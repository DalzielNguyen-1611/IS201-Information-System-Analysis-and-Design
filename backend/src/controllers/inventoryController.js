const oracledb = require('oracledb');
const db = require('../config/db');

// 1. Xem danh sách tồn kho
exports.getInventory = async (req, res) => {
  try {
    // Schema mới: SAN_PHAM không có LOAISANPHAM, HINHANH
    const query = `
      SELECT s.MASANPHAM, s.TENSANPHAM, s.DONVITINH, s.GIANIEMYET, s.THUE,
             s.COTHEMUA, s.COTHEBAN, s.THUONGHIEU, s.MAVACH,
             NVL(t.SOLUONGTON, 0) as SOLUONGTON,
             t.NGAYCAPNHAT
      FROM SAN_PHAM s
      LEFT JOIN TON_KHO t ON s.MASANPHAM = t.MASANPHAM
      WHERE s.COTHEMUA = 1
      ORDER BY s.MASANPHAM DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu kho' });
  }
};

// 2. Nhập kho — Schema mới: HOA_DON_NHAP_HANG + CHI_TIET_HOA_DON_NHAP
exports.importStock = async (req, res) => {
  const { items, madoitac, ghichu, phuongthucthanhtoan } = req.body;
  const maNhanVien = req.user ? req.user.maNhanVien : null;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Danh sách hàng nhập không được rỗng' });
  }

  // Chuẩn hóa dữ liệu items từ frontend (hỗ trợ cả camelCase và lowercase)
  const normalizedItems = items.map(item => {
    const masanpham = Number(item.masanpham !== undefined ? item.masanpham : item.maSanPham);
    const soluong = Number(item.soluong !== undefined ? item.soluong : item.soLuong);
    const dongia = Number(item.dongia !== undefined ? item.dongia : (item.giaNhap !== undefined ? item.giaNhap : item.giaNhap));
    return { masanpham, soluong, dongia };
  });

  // Kiểm tra tính hợp lệ của số liệu
  for (let i = 0; i < normalizedItems.length; i++) {
    const item = normalizedItems[i];
    if (isNaN(item.masanpham) || isNaN(item.soluong) || isNaN(item.dongia)) {
      return res.status(400).json({ error: `Dữ liệu sản phẩm thứ ${i + 1} không hợp lệ (NaN)` });
    }
  }

  const conn = await db.getConnection();
  try {
    const tongTien = normalizedItems.reduce((sum, item) => sum + (item.soluong * item.dongia), 0);

    // Tạo phiếu nhập hàng — HOA_DON_NHAP_HANG
    const phieuRes = await conn.execute(
      `INSERT INTO HOA_DON_NHAP_HANG
         (MADOITAC, MANHANVIEN, TONGTIEN, PHUONGTHUCTHANHTOAN, TRANGTHAI_THANHTOAN, GHICHU)
       VALUES (:1, :2, :3, :4, 'Chờ duyệt', :5)
       RETURNING MAHOADONNHAP INTO :id`,
      {
        1: madoitac || null,
        2: maNhanVien,
        3: tongTien,
        4: phuongthucthanhtoan || 'Tiền mặt',
        5: ghichu || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const maHoaDonNhap = phieuRes.outBinds.id[0];

    for (let item of normalizedItems) {
      const thanhtien = item.soluong * item.dongia;

      // Thêm chi tiết phiếu nhập — CHI_TIET_HOA_DON_NHAP
      await conn.execute(
        `INSERT INTO CHI_TIET_HOA_DON_NHAP
           (MAHOADONNHAP, MASANPHAM, SOLUONG, SOLUONGDANHAN, DONGIA, THANHTIEN)
         VALUES (:1, :2, :3, :4, :5, :6)`,
        [maHoaDonNhap, item.masanpham, item.soluong, item.soluong, item.dongia, thanhtien]
      );
    }

    await conn.commit();
    res.json({ message: 'Nhập kho thành công!', maHoaDonNhap, tongTien });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi nhập kho:', err);
    res.status(500).json({ error: 'Lỗi khi nhập kho: ' + err.message });
  } finally {
    await conn.close();
  }
};

// 3. Kiểm kê kho
exports.createInventoryCheck = async (req, res) => {
  let { items } = req.body;
  const maNhanVien = req.user ? req.user.maNhanVien : null;

  // Nếu frontend gửi 1 item đơn lẻ (không bọc trong items)
  if (!items) {
    const { maSanPham, soLuongThucTe, ghiChu, masanpham, slthucte, lydolech } = req.body;
    items = [{
      masanpham: masanpham !== undefined ? masanpham : maSanPham,
      slthucte: slthucte !== undefined ? slthucte : soLuongThucTe,
      lydolech: lydolech !== undefined ? lydolech : ghiChu
    }];
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Danh sách sản phẩm kiểm kê trống' });
  }

  // Chuẩn hóa dữ liệu
  const normalizedItems = items.map(item => {
    const masanpham = Number(item.masanpham !== undefined ? item.masanpham : item.maSanPham);
    const slthucte = Number(item.slthucte !== undefined ? item.slthucte : item.soLuongThucTe);
    const lydolech = item.lydolech !== undefined ? item.lydolech : item.ghiChu;
    return { masanpham, slthucte, lydolech };
  });

  for (let i = 0; i < normalizedItems.length; i++) {
    const item = normalizedItems[i];
    if (isNaN(item.masanpham) || isNaN(item.slthucte)) {
      return res.status(400).json({ error: `Dữ liệu kiểm kê thứ ${i + 1} không hợp lệ (NaN)` });
    }
  }

  const conn = await db.getConnection();
  try {
    const kiemKeResult = await conn.execute(
      `INSERT INTO KIEM_KE (NGUOIKIEMKE, TRANGTHAI) VALUES (:1, 'Hoàn thành') RETURNING MAKIEMKE INTO :id`,
      {
        1: maNhanVien,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const maKiemKe = kiemKeResult.outBinds.id[0];

    for (let item of normalizedItems) {
      const tonKhoResult = await conn.execute(
        `SELECT SOLUONGTON FROM TON_KHO WHERE MASANPHAM = :1`,
        [item.masanpham]
      );
      
      const row = tonKhoResult.rows[0];
      const slHeThong = tonKhoResult.rows.length > 0 
        ? Number(Array.isArray(row) ? row[0] : (row.SOLUONGTON !== undefined ? row.SOLUONGTON : row.soluongton)) 
        : 0;

      const slThucTe = item.slthucte;
      const slLech = slThucTe - slHeThong;

      await conn.execute(
        `INSERT INTO CHI_TIET_KIEM_KE (MAKIEMKE, MASANPHAM, SLHETHONG, SLTHUCTE, SLLECH, LYDOLECH)
         VALUES (:1, :2, :3, :4, :5, :6)`,
        [maKiemKe, item.masanpham, slHeThong, slThucTe, slLech, item.lydolech || null]
      );

      await conn.execute(
        `MERGE INTO TON_KHO t
         USING (SELECT :1 AS MASANPHAM, :2 AS SOLUONGTON FROM DUAL) s
         ON (t.MASANPHAM = s.MASANPHAM)
         WHEN MATCHED THEN
           UPDATE SET t.SOLUONGTON = s.SOLUONGTON, t.NGAYCAPNHAT = SYSTIMESTAMP
         WHEN NOT MATCHED THEN
           INSERT (MASANPHAM, SOLUONGTON, NGAYCAPNHAT) VALUES (s.MASANPHAM, s.SOLUONGTON, SYSTIMESTAMP)`,
        [item.masanpham, slThucTe]
      );
    }

    await conn.commit();
    res.json({ message: 'Kiểm kê kho thành công!', maKiemKe });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi kiểm kê:', err);
    res.status(500).json({ error: 'Lỗi khi thực hiện kiểm kê: ' + err.message });
  } finally {
    await conn.close();
  }
};

// 4. Lấy lịch sử kiểm kê
exports.getInventoryChecks = async (req, res) => {
  try {
    const query = `
      SELECT kk.MAKIEMKE, kk.NGAYKIEMKE, kk.TRANGTHAI,
             ct.MASANPHAM, ct.SLHETHONG, ct.SLTHUCTE, ct.SLLECH, ct.LYDOLECH,
             sp.TENSANPHAM, nv.HOTEN AS TENNGUOIKIEMKE
      FROM KIEM_KE kk
      JOIN CHI_TIET_KIEM_KE ct ON kk.MAKIEMKE = ct.MAKIEMKE
      JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
      LEFT JOIN NHANVIEN nv ON kk.NGUOIKIEMKE = nv.MANHANVIEN
      ORDER BY kk.MAKIEMKE DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy lịch sử kiểm kê:', err);
    res.status(500).json({ error: 'Lỗi lấy lịch sử kiểm kê' });
  }
};

// 5. Lấy lịch sử nhập hàng (Mua hàng)
exports.getImportHistory = async (req, res) => {
  try {
    const query = `
      SELECT hd.MAHOADONNHAP, hd.NGAYLAP, hd.TONGTIEN, hd.PHUONGTHUCTHANHTOAN,
             hd.TRANGTHAI_THANHTOAN, hd.GHICHU,
             dt.TENDOITAC AS TENNHACUNGCAP,
             nv.HOTEN AS TENNHANVIEN
      FROM HOA_DON_NHAP_HANG hd
      LEFT JOIN DOI_TAC dt ON hd.MADOITAC = dt.MADOITAC
      LEFT JOIN NHANVIEN nv ON hd.MANHANVIEN = nv.MANHANVIEN
      ORDER BY hd.MAHOADONNHAP DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy lịch sử nhập hàng:', err);
    res.status(500).json({ error: 'Lỗi lấy lịch sử nhập hàng' });
  }
};

// 6. Lấy chi tiết một đơn nhập hàng
exports.getImportDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT ct.MACHITIET, ct.MASANPHAM, ct.SOLUONG, ct.SOLUONGDANHAN,
             ct.DONGIA, ct.THANHTIEN, sp.TENSANPHAM, sp.DONVITINH
      FROM CHI_TIET_HOA_DON_NHAP ct
      JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
      WHERE ct.MAHOADONNHAP = :1
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy chi tiết hóa đơn nhập:', err);
    res.status(500).json({ error: 'Lỗi lấy chi tiết hóa đơn nhập: ' + err.message });
  }
};

// 7. Lấy danh sách Nhà cung cấp rút gọn (để chọn khi lập đơn)
exports.getSuppliers = async (req, res) => {
  try {
    const query = `
      SELECT dt.MADOITAC, dt.TENDOITAC, ncc.MASOTHUE
      FROM NHA_CUNG_CAP ncc
      JOIN DOI_TAC dt ON ncc.MADOITAC = dt.MADOITAC
      WHERE dt.TRANGTHAI = 1
      ORDER BY dt.TENDOITAC ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách nhà cung cấp:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách nhà cung cấp' });
  }
};

// 8. Lấy danh sách Nhà cung cấp chi tiết (đầy đủ thông tin)
exports.getSuppliersDetailed = async (req, res) => {
  try {
    const query = `
      SELECT dt.MADOITAC, dt.TENDOITAC, dt.SODIENTHOAI, dt.DIACHI, dt.EMAIL, dt.TRANGTHAI,
             ncc.MASOTHUE, ncc.DIEUKHOANTHANHTOAN, ncc.GHICHU
      FROM NHA_CUNG_CAP ncc
      JOIN DOI_TAC dt ON ncc.MADOITAC = dt.MADOITAC
      ORDER BY dt.MADOITAC DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách nhà cung cấp chi tiết:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách nhà cung cấp chi tiết' });
  }
};

// 9. Thêm Nhà cung cấp mới
exports.createSupplier = async (req, res) => {
  const { tendoitac, sodienthoai, diachi, email, masothue, dieukhoanthanhtoan, ghichu } = req.body;

  if (!tendoitac || !masothue) {
    return res.status(400).json({ error: 'Tên nhà cung cấp và Mã số thuế không được bỏ trống' });
  }

  const conn = await db.getConnection();
  try {
    // 1. Thêm vào DOI_TAC
    const dtRes = await conn.execute(
      `INSERT INTO DOI_TAC (TENDOITAC, SODIENTHOAI, DIACHI, EMAIL, LOAIDOITAC, TRANGTHAI)
       VALUES (:1, :2, :3, :4, 'Nhà cung cấp', 1)
       RETURNING MADOITAC INTO :id`,
      {
        1: tendoitac,
        2: sodienthoai || null,
        3: diachi || null,
        4: email || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const maDoiTac = dtRes.outBinds.id[0];

    // 2. Thêm vào NHA_CUNG_CAP
    await conn.execute(
      `INSERT INTO NHA_CUNG_CAP (MADOITAC, MASOTHUE, DIEUKHOANTHANHTOAN, GHICHU)
       VALUES (:1, :2, :3, :4)`,
      [maDoiTac, masothue, dieukhoanthanhtoan || null, ghichu || null]
    );

    await conn.commit();
    res.json({ message: 'Thêm nhà cung cấp thành công!', maDoiTac });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi thêm nhà cung cấp:', err);
    res.status(500).json({ error: 'Lỗi khi thêm nhà cung cấp: ' + err.message });
  } finally {
    await conn.close();
  }
};

// 10. Sửa thông tin Nhà cung cấp
exports.updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { tendoitac, sodienthoai, diachi, email, masothue, dieukhoanthanhtoan, ghichu } = req.body;

  if (!tendoitac || !masothue) {
    return res.status(400).json({ error: 'Tên nhà cung cấp và Mã số thuế không được bỏ trống' });
  }

  const conn = await db.getConnection();
  try {
    // 1. Cập nhật DOI_TAC
    await conn.execute(
      `UPDATE DOI_TAC
       SET TENDOITAC = :1, SODIENTHOAI = :2, DIACHI = :3, EMAIL = :4
       WHERE MADOITAC = :5`,
      [tendoitac, sodienthoai || null, diachi || null, email || null, Number(id)]
    );

    // 2. Cập nhật NHA_CUNG_CAP
    await conn.execute(
      `UPDATE NHA_CUNG_CAP
       SET MASOTHUE = :1, DIEUKHOANTHANHTOAN = :2, GHICHU = :3
       WHERE MADOITAC = :4`,
      [masothue, dieukhoanthanhtoan || null, ghichu || null, Number(id)]
    );

    await conn.commit();
    res.json({ message: 'Cập nhật thông tin nhà cung cấp thành công!' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi cập nhật nhà cung cấp:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin nhà cung cấp: ' + err.message });
  } finally {
    await conn.close();
  }
};

// 11. Khóa / Mở khóa Nhà cung cấp
exports.toggleSupplierStatus = async (req, res) => {
  const { id } = req.params;
  const { trangthai } = req.body; // 0: Khóa, 1: Hoạt động

  try {
    const statusVal = Number(trangthai);
    await db.query(
      `UPDATE DOI_TAC SET TRANGTHAI = :1 WHERE MADOITAC = :2`,
      [statusVal, Number(id)]
    );
    res.json({ message: statusVal === 0 ? 'Đã khóa nhà cung cấp thành công!' : 'Đã mở khóa nhà cung cấp thành công!' });
  } catch (err) {
    console.error('Lỗi thay đổi trạng thái nhà cung cấp:', err);
    res.status(500).json({ error: 'Lỗi thay đổi trạng thái nhà cung cấp' });
  }
};

// 13. Xóa hóa đơn nhập hàng (Có hoàn tác số lượng tồn kho)
exports.deleteImport = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    // 1. Kiểm tra trạng thái hiện tại
    const checkRes = await conn.execute(
      `SELECT TRANGTHAI_THANHTOAN FROM HOA_DON_NHAP_HANG WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn nhập' });
    }
    const status = checkRes.rows[0].TRANGTHAI_THANHTOAN || checkRes.rows[0].trangthai_thanhtoan || checkRes.rows[0][0];

    // 2. Trừ lại số lượng tồn kho (chỉ khi đã duyệt: Chờ thanh toán hoặc Đã thanh toán)
    if (status === 'Chờ thanh toán' || status === 'Đã thanh toán') {
      const itemsRes = await conn.execute(
        `SELECT MASANPHAM, SOLUONG FROM CHI_TIET_HOA_DON_NHAP WHERE MAHOADONNHAP = :1`,
        [Number(id)]
      );

      for (let row of itemsRes.rows) {
        const masanpham = Number(row.MASANPHAM !== undefined ? row.MASANPHAM : row[0]);
        const soluong = Number(row.SOLUONG !== undefined ? row.SOLUONG : row[1]);

        await conn.execute(
          `UPDATE TON_KHO
           SET SOLUONGTON = GREATEST(0, SOLUONGTON - :1), NGAYCAPNHAT = SYSTIMESTAMP
           WHERE MASANPHAM = :2`,
          [soluong, masanpham]
        );
      }
    }

    // 3. Xóa chi tiết hóa đơn
    await conn.execute(
      `DELETE FROM CHI_TIET_HOA_DON_NHAP WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );

    // 4. Xóa hóa đơn
    await conn.execute(
      `DELETE FROM HOA_DON_NHAP_HANG WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );

    await conn.commit();
    res.json({ message: 'Xóa hóa đơn nhập thành công!' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi xóa hóa đơn nhập:', err);
    res.status(500).json({ error: 'Lỗi khi xóa hóa đơn nhập: ' + err.message });
  } finally {
    await conn.close();
  }
};

// 14. Duyệt đơn hàng mua (Chờ duyệt -> Chờ nhập kho)
exports.approveImport = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    // 1. Kiểm tra trạng thái hiện tại
    const checkRes = await conn.execute(
      `SELECT TRANGTHAI_THANHTOAN FROM HOA_DON_NHAP_HANG WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn nhập' });
    }
    const status = checkRes.rows[0].TRANGTHAI_THANHTOAN || checkRes.rows[0].trangthai_thanhtoan || checkRes.rows[0][0];
    if (status !== 'Chờ duyệt') {
      return res.status(400).json({ error: 'Hóa đơn phải ở trạng thái Chờ duyệt mới được phép duyệt' });
    }

    // 2. Cập nhật sang Chờ nhập kho
    await conn.execute(
      `UPDATE HOA_DON_NHAP_HANG SET TRANGTHAI_THANHTOAN = 'Chờ nhập kho' WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );

    await conn.commit();
    res.json({ success: true, message: 'Phê duyệt hóa đơn nhập thành công! Đã chuyển trạng thái sang Chờ nhập kho.' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi duyệt hóa đơn nhập:', err);
    res.status(500).json({ error: 'Lỗi khi duyệt hóa đơn nhập: ' + err.message });
  } finally {
    await conn.close();
  }
};


// 15. Xác nhận nhập kho (Chờ nhập kho -> Chờ thanh toán + Cộng tồn kho)
exports.receiveImport = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    // 1. Kiểm tra trạng thái hiện tại
    const checkRes = await conn.execute(
      `SELECT TRANGTHAI_THANHTOAN FROM HOA_DON_NHAP_HANG WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn nhập' });
    }
    const status = checkRes.rows[0].TRANGTHAI_THANHTOAN || checkRes.rows[0].trangthai_thanhtoan || checkRes.rows[0][0];
    if (status !== 'Chờ nhập kho') {
      return res.status(400).json({ error: 'Hóa đơn phải ở trạng thái Chờ nhập kho mới được phép xác nhận nhập kho' });
    }

    // 2. Cập nhật sang Chờ thanh toán
    await conn.execute(
      `UPDATE HOA_DON_NHAP_HANG SET TRANGTHAI_THANHTOAN = 'Chờ thanh toán' WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );

    // 3. Lấy chi tiết hóa đơn để cộng vào tồn kho
    const itemsRes = await conn.execute(
      `SELECT MASANPHAM, SOLUONG FROM CHI_TIET_HOA_DON_NHAP WHERE MAHOADONNHAP = :1`,
      [Number(id)]
    );

    for (let row of itemsRes.rows) {
      const masanpham = Number(row.MASANPHAM !== undefined ? row.MASANPHAM : row[0]);
      const soluong = Number(row.SOLUONG !== undefined ? row.SOLUONG : row[1]);

      await conn.execute(
        `MERGE INTO TON_KHO t
         USING (SELECT :1 AS MASANPHAM, :2 AS SOLUONG FROM DUAL) s
         ON (t.MASANPHAM = s.MASANPHAM)
         WHEN MATCHED THEN
           UPDATE SET t.SOLUONGTON = t.SOLUONGTON + s.SOLUONG, t.NGAYCAPNHAT = SYSTIMESTAMP
         WHEN NOT MATCHED THEN
           INSERT (MASANPHAM, SOLUONGTON, NGAYCAPNHAT) VALUES (s.MASANPHAM, s.SOLUONG, SYSTIMESTAMP)`,
        [masanpham, soluong]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Xác nhận nhập kho và tăng số lượng tồn kho thành công!' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi xác nhận nhập kho:', err);
    res.status(500).json({ error: 'Lỗi khi xác nhận nhập kho: ' + err.message });
  } finally {
    await conn.close();
  }
};

// 16. Thanh toán hóa đơn nhập (Chờ thanh toán -> Đã thanh toán)
exports.payImport = async (req, res) => {
  const { id } = req.params;
  try {
    const checkRes = await db.query(
      `SELECT TRANGTHAI_THANHTOAN FROM HOA_DON_NHAP_HANG WHERE MAHOADONNHAP = $1`,
      [Number(id)]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn nhập' });
    }
    const status = checkRes.rows[0].trangthai_thanhtoan;
    if (status !== 'Chờ thanh toán') {
      return res.status(400).json({ error: 'Hóa đơn phải ở trạng thái Chờ thanh toán mới được phép thanh toán' });
    }

    await db.query(
      `UPDATE HOA_DON_NHAP_HANG SET TRANGTHAI_THANHTOAN = 'Đã thanh toán' WHERE MAHOADONNHAP = $1`,
      [Number(id)]
    );
    res.json({ success: true, message: 'Thanh toán hóa đơn nhập hàng thành công!' });
  } catch (err) {
    console.error('Lỗi thanh toán hóa đơn:', err);
    res.status(500).json({ error: 'Lỗi khi thanh toán hóa đơn nhập: ' + err.message });
  }
};





