const oracledb = require('oracledb');
const db = require('../config/db');

// 1. LẤY SẢN PHẨM POS (SAN_PHAM + DICH_VU)
exports.getPosProducts = async (req, res) => {
  const { keyword } = req.query;
  try {
    // Base UNION query: san pham hang hoa + dich vu cham soc
    // Dung TO_NCHAR() de tranh ORA-12704 charset mismatch (TENSANPHAM=VARCHAR2, TENDICHVU=NVARCHAR2)
    const unionBase = `
      SELECT
        s.MASANPHAM              AS id,
        TO_NCHAR(s.TENSANPHAM)   AS tensanpham,
        s.GIANIEMYET             AS gia,
        TO_NCHAR(s.DONVITINH)    AS donvitinh,
        s.HINHANH                AS hinhanh,
        NVL(t.SOLUONGTON, 0)     AS soluongton,
        TO_NCHAR('Hang hoa')     AS loaisanpham,
        TO_NCHAR('san_pham')     AS itemtype
      FROM SAN_PHAM s
      LEFT JOIN TON_KHO t ON s.MASANPHAM = t.MASANPHAM
      WHERE s.COTHEBAN = 1 AND s.POS = 1
      UNION ALL
      SELECT
        d.MADICHVU               AS id,
        d.TENDICHVU              AS tensanpham,
        d.GIA                    AS gia,
        TO_NCHAR('Dich vu')      AS donvitinh,
        NULL                     AS hinhanh,
        0                        AS soluongton,
        TO_NCHAR('Dich vu')      AS loaisanpham,
        TO_NCHAR('dich_vu')      AS itemtype
      FROM DICH_VU d
      WHERE d.COTHEBAN = 1
    `;

    let baseQuery;
    let params = [];

    if (keyword) {
      baseQuery = `SELECT * FROM (${unionBase}) WHERE UPPER(tensanpham) LIKE UPPER($1)`;
      params.push(`%${keyword}%`);
    } else {
      baseQuery = unionBase;
    }

    const result = await db.query(baseQuery, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getPosProducts error:', err.message);
    res.status(500).json({ error: 'Loi tai du lieu POS', details: err.message });
  }

};

// 2. TÌM KHÁCH HÀNG BẰNG SỐ ĐIỆN THOẠI
exports.findCustomer = async (req, res) => {
  const { sdt } = req.query;
  try {
    const query = `
      SELECT d.MADOITAC, d.TENDOITAC, d.SODIENTHOAI, k.DIEMTICHLUY, k.LOAIKHACHHANG
      FROM DOI_TAC d
      JOIN KHACH_HANG k ON d.MADOITAC = k.MADOITAC
      WHERE d.SODIENTHOAI = $1 AND NVL(k.TRANGTHAI, 1) = 1
    `;
    const result = await db.query(query, [sdt]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi tìm khách hàng' });
  }
};

// 3. HOLD ĐƠN HÀNG
exports.holdOrder = async (req, res) => {
  const { maDoiTac, cartItems, tongTien, maDonHangHold } = req.body;
  if (!maDoiTac) return res.status(400).json({ error: 'Bắt buộc phải có khách hàng để Hold đơn!' });

  const conn = await db.getConnection();
  try {
    let maDonHang = maDonHangHold;

    if (maDonHangHold) {
      await conn.execute(
        `UPDATE DON_HANG SET TONGTIEN = :1, MADOITAC = :2 WHERE MADONHANG = :3`,
        [tongTien, maDoiTac, maDonHangHold]
      );
      await conn.execute(`DELETE FROM CHI_TIET_DON_HANG WHERE MADONHANG = :1`, [maDonHangHold]);
    } else {
      const donHangRes = await conn.execute(
        `INSERT INTO DON_HANG (MADOITAC, TONGTIEN, TRANGTHAI) VALUES (:1, :2, 'Hold') RETURNING MADONHANG INTO :id`,
        {
          1: maDoiTac,
          2: tongTien,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      maDonHang = donHangRes.outBinds.id[0];
    }

    for (let item of cartItems) {
      await conn.execute(
        `INSERT INTO CHI_TIET_DON_HANG (MADONHANG, MASANPHAM, SOLUONG, DONGIA, THANHTIEN)
         VALUES (:1, :2, :3, :4, :5)`,
        [maDonHang, item.masanpham, item.soluong, item.gianiemyet, item.soluong * item.gianiemyet]
      );
    }

    await conn.commit();
    res.json({ message: maDonHangHold ? 'Đã cập nhật đơn treo!' : 'Đã treo đơn thành công!', maDonHang });
  } catch (err) {
    await conn.rollback();
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi Hold đơn' });
  } finally {
    await conn.close();
  }
};

exports.getHoldOrders = async (req, res) => {
  try {
    const query = `
      SELECT d.MADONHANG, d.MADOITAC, d.NGAYTAO, d.TONGTIEN, dt.TENDOITAC, dt.SODIENTHOAI
      FROM DON_HANG d
      JOIN DOI_TAC dt ON d.MADOITAC = dt.MADOITAC
      WHERE d.TRANGTHAI = 'Hold'
      ORDER BY d.NGAYTAO DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách đơn Hold' });
  }
};

exports.getHoldOrderDetail = async (req, res) => {
  const { id } = req.params;
  try {
    // Schema mới: không có LOAISANPHAM, HINHANH trong SAN_PHAM
    const details = await db.query(
      `SELECT c.MACHITIET, c.MADONHANG, c.MASANPHAM, c.SOLUONG, c.DONGIA, c.THANHTIEN,
              s.TENSANPHAM, s.DONVITINH, s.THUONGHIEU
       FROM CHI_TIET_DON_HANG c
       JOIN SAN_PHAM s ON c.MASANPHAM = s.MASANPHAM
       WHERE c.MADONHANG = $1`,
      [id]
    );
    res.json(details.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy chi tiết đơn Hold' });
  }
};

// 4. HỦY ĐƠN HOLD
exports.cancelHoldOrder = async (req, res) => {
  const { id } = req.params;
  try {
    // ON DELETE CASCADE sẽ tự xóa CHI_TIET_DON_HANG
    await db.query(`DELETE FROM DON_HANG WHERE MADONHANG = $1`, [id]);
    res.json({ message: 'Đã hủy đơn hàng tạm!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi khi hủy đơn hàng' });
  }
};

// 5. THANH TOÁN
exports.checkout = async (req, res) => {
  const { maDoiTac, cartItems, tongTien, maDonHangHold, diemSuDung } = req.body;
  const maNhanVien = req.user ? req.user.maNhanVien : null;

  const conn = await db.getConnection();
  try {
    // Schema mới: DON_HANG (không phải HOA_DON_BAN_HANG)
    // NGAYTAO là DEFAULT SYSTIMESTAMP — không cần truyền
    const orderRes = await conn.execute(
      `INSERT INTO DON_HANG (MADOITAC, MANHANVIEN, TONGTIEN, TRANGTHAI, DIEMSUDUNG, THOIGIANTHANHTOAN)
       VALUES (:1, :2, :3, 'HoanThanh', :4, SYSTIMESTAMP) RETURNING MADONHANG INTO :id`,
      {
        1: maDoiTac || null,
        2: maNhanVien,
        3: tongTien,
        4: diemSuDung || 0,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const maDonHang = orderRes.outBinds.id[0];

    for (let item of cartItems) {
      if (item.itemtype === 'dich_vu') {
        // Dich vu: ghi vao CHI_TIET_DON_HANG voi MADICHVU, khong tru kho
        await conn.execute(
          `INSERT INTO CHI_TIET_DON_HANG (MADONHANG, MADICHVU, SOLUONG, DONGIA, THANHTIEN)
           VALUES (:1, :2, :3, :4, :5)`,
          [maDonHang, item.id, item.soluong, item.gia, item.soluong * item.gia]
        );
      } else {
        // San pham thuong: ghi vao CHI_TIET_DON_HANG voi MASANPHAM
        const maSP = item.masanpham || item.id;
        const donGia = item.gianiemyet || item.gia;
        await conn.execute(
          `INSERT INTO CHI_TIET_DON_HANG (MADONHANG, MASANPHAM, SOLUONG, DONGIA, THANHTIEN)
           VALUES (:1, :2, :3, :4, :5)`,
          [maDonHang, maSP, item.soluong, donGia, item.soluong * donGia]
        );

        // Tru ton kho
        const stockCheck = await conn.execute(
          `SELECT SOLUONGTON FROM TON_KHO WHERE MASANPHAM = :1`,
          [maSP]
        );

        if (stockCheck.rows.length > 0) {
          const row = stockCheck.rows[0];
          const soLuongHienTai = Number(
            Array.isArray(row)
              ? row[0]
              : (row.SOLUONGTON !== undefined ? row.SOLUONGTON : row.soluongton)
          );

          if (!isNaN(soLuongHienTai)) {
            if (soLuongHienTai < item.soluong) {
              throw {
                status: 400,
                message: `San pham "${item.tensanpham || maSP}" chi con ${soLuongHienTai} trong kho!`
              };
            }
            await conn.execute(
              `UPDATE TON_KHO SET SOLUONGTON = SOLUONGTON - :1, NGAYCAPNHAT = SYSTIMESTAMP WHERE MASANPHAM = :2`,
              [item.soluong, maSP]
            );
          }
        }
      }
    }

    // Tích điểm cho khách hàng và tự động phân hạng thành viên
    let diemCongThem = 0;
    if (maDoiTac) {
      diemCongThem = Math.floor(tongTien / 10000);
      const usedPoints = Number(diemSuDung) || 0;

      // Cập nhật điểm tích lũy mới (trừ điểm sử dụng và cộng điểm tích lũy mới)
      await conn.execute(
        `UPDATE KHACH_HANG 
         SET DIEMTICHLUY = GREATEST(DIEMTICHLUY + :1 - :2, 0) 
         WHERE MADOITAC = :3`,
        [diemCongThem, usedPoints, maDoiTac]
      );

      // Lấy số điểm hiện tại để phân loại khách hàng
      const pointsRes = await conn.execute(
        `SELECT DIEMTICHLUY FROM KHACH_HANG WHERE MADOITAC = :1`,
        [maDoiTac]
      );
      
      if (pointsRes.rows.length > 0) {
        const row = pointsRes.rows[0];
        const currentPoints = Number(Array.isArray(row) ? row[0] : (row.DIEMTICHLUY !== undefined ? row.DIEMTICHLUY : row.diemtichluy));
        
        let loaiKhach = 'Thành viên';
        if (currentPoints >= 5000) {
          loaiKhach = 'Vàng';
        } else if (currentPoints >= 1000) {
          loaiKhach = 'Bạch kim';
        } else if (currentPoints >= 500) {
          loaiKhach = 'Bạc';
        } else if (currentPoints >= 200) {
          loaiKhach = 'Đồng';
        }

        // Cập nhật lại hạng khách hàng mới
        await conn.execute(
          `UPDATE KHACH_HANG SET LOAIKHACHHANG = :1 WHERE MADOITAC = :2`,
          [loaiKhach, maDoiTac]
        );
      }
    }

    // Đóng đơn Hold nếu có
    if (maDonHangHold) {
      await conn.execute(
        `UPDATE DON_HANG SET TRANGTHAI = 'HoanThanh' WHERE MADONHANG = :1 AND TRANGTHAI = 'Hold'`,
        [maDonHangHold]
      );
    }

    await conn.commit();
    res.json({
      success: true,
      maDonHang,
      message: `Thanh toán thành công! Khách hàng được cộng ${diemCongThem} điểm.`
    });
  } catch (err) {
    await conn.rollback();
    const fs = require('fs');
    try {
      fs.writeFileSync('d:\\IS201-Information-System-Design-Analysis\\backend\\error.log', err.stack || err.message || String(err));
    } catch (e) {}
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Lỗi checkout:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi thanh toán' });
  } finally {
    await conn.close();
  }
};