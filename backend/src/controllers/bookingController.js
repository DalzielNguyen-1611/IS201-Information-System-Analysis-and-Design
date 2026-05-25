const oracledb = require('oracledb');
const db = require('../config/db');

// 1. Lấy danh sách lịch hẹn
exports.getBookings = async (req, res) => {
  try {
    const query = `
      SELECT lh.MALICHHEN, lh.THOIGIANHEN, lh.TRANGTHAI,
             (SELECT MIN(ctlh.GHICHU) FROM CHI_TIET_LICH_HEN ctlh WHERE ctlh.MALICHHEN = lh.MALICHHEN) AS GHICHU,
             dt.TENDOITAC AS TENKHACHHANG, dt.SODIENTHOAI AS SDTKHACHHANG,
             tc.TENTHUCUNG, tc.LOAITHUCUNG AS LOAITHUCUNG,
             nv.HOTEN AS TENNHANVIEN,
             (SELECT LISTAGG(dv.TENDICHVU, ', ') WITHIN GROUP (ORDER BY dv.TENDICHVU)
              FROM CHI_TIET_LICH_HEN ctlh
              JOIN DICH_VU dv ON ctlh.MADICHVU = dv.MADICHVU
              WHERE ctlh.MALICHHEN = lh.MALICHHEN) AS DANHSACHDICHVU,
             (SELECT SUM(dv.GIA)
              FROM CHI_TIET_LICH_HEN ctlh
              JOIN DICH_VU dv ON ctlh.MADICHVU = dv.MADICHVU
              WHERE ctlh.MALICHHEN = lh.MALICHHEN) AS TONGTIEN
      FROM LICH_HEN lh
      LEFT JOIN KHACH_HANG kh ON lh.MAKH = kh.MADOITAC
      LEFT JOIN DOI_TAC dt ON kh.MADOITAC = dt.MADOITAC
      LEFT JOIN HO_SO_THU_CUNG tc ON lh.MATHUCUNG = tc.MATHUCUNG
      LEFT JOIN NHANVIEN nv ON lh.MANV = nv.MANHANVIEN
      ORDER BY lh.THOIGIANHEN DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách lịch hẹn:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách lịch hẹn: ' + err.message });
  }
};

// 2. Tạo lịch hẹn mới
exports.createBooking = async (req, res) => {
  const { makh, mathucung, thoigianhen, manv, ghichu, services } = req.body;

  if (!makh || !thoigianhen || !services || services.length === 0) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (khách hàng, thời gian, dịch vụ)' });
  }

  const conn = await db.getConnection();
  try {
    // Thêm vào LICH_HEN (loại bỏ cột GHICHU không có trong schema LICH_HEN)
    const bookingRes = await conn.execute(
      `INSERT INTO LICH_HEN (MAKH, MATHUCUNG, THOIGIANHEN, TRANGTHAI, MANV)
       VALUES (:1, :2, TO_TIMESTAMP(:3, 'YYYY-MM-DD"T"HH24:MI'), 'Đợi check-in', :4)
       RETURNING MALICHHEN INTO :id`,
      {
        1: Number(makh),
        2: mathucung ? Number(mathucung) : null,
        3: thoigianhen, // format: 2026-05-22T18:30
        4: manv ? Number(manv) : null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const maLichHen = bookingRes.outBinds.id[0];

    // Thêm các dịch vụ vào CHI_TIET_LICH_HEN
    for (let serviceId of services) {
      await conn.execute(
        `INSERT INTO CHI_TIET_LICH_HEN (MALICHHEN, MAKH, MADICHVU, GHICHU)
         VALUES (:1, :2, :3, :4)`,
        [maLichHen, Number(makh), Number(serviceId), ghichu || null]
      );
    }

    await conn.commit();
    res.json({ message: 'Đặt lịch hẹn thành công!', maLichHen });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi tạo lịch hẹn:', err);
    res.status(500).json({ error: 'Lỗi tạo lịch hẹn: ' + err.message });
  } finally {
    await conn.close();
  }
};

// 3. Cập nhật thông tin lịch hẹn
exports.updateBooking = async (req, res) => {
  const { id } = req.params;
  const { thoigianhen, trangthai, manv, ghichu } = req.body;

  try {
    let query = `
      UPDATE LICH_HEN
      SET TRANGTHAI = :1,
          MANV = :2
    `;
    const params = [trangthai, manv ? Number(manv) : null];

    if (thoigianhen) {
      query += `, THOIGIANHEN = TO_TIMESTAMP(:3, 'YYYY-MM-DD"T"HH24:MI')`;
      params.push(thoigianhen);
    }

    query += ` WHERE MALICHHEN = :${params.length + 1}`;
    params.push(Number(id));

    const result = await db.query(query, params);

    // Cập nhật GHICHU ở bảng chi tiết nếu được truyền lên
    if (ghichu !== undefined) {
      await db.query(
        `UPDATE CHI_TIET_LICH_HEN SET GHICHU = :1 WHERE MALICHHEN = :2`,
        [ghichu || null, Number(id)]
      );
    }

    res.json({ message: 'Cập nhật lịch hẹn thành công!', rowsAffected: result.rowsAffected });
  } catch (err) {
    console.error('Lỗi cập nhật lịch hẹn:', err);
    res.status(500).json({ error: 'Lỗi cập nhật lịch hẹn: ' + err.message });
  }
};

// 4. Hủy lịch hẹn
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE LICH_HEN SET TRANGTHAI = 'Đã hủy' WHERE MALICHHEN = :1`,
      [Number(id)]
    );
    res.json({ message: 'Đã hủy lịch hẹn thành công!', rowsAffected: result.rowsAffected });
  } catch (err) {
    console.error('Lỗi hủy lịch hẹn:', err);
    res.status(500).json({ error: 'Lỗi hủy lịch hẹn: ' + err.message });
  }
};

// 5. Lấy danh sách Dịch vụ Spa
exports.getServices = async (req, res) => {
  try {
    const result = await db.query('SELECT MADICHVU, TENDICHVU, GIA FROM DICH_VU ORDER BY MADICHVU ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách dịch vụ:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách dịch vụ' });
  }
};

// 6. Lấy danh sách thú cưng của một khách hàng
exports.getPetsByCustomer = async (req, res) => {
  const { customerId } = req.params;
  try {
    const result = await db.query(
      `SELECT MATHUCUNG, TENTHUCUNG, LOAITHUCUNG AS LOAI, GIOITINH
       FROM HO_SO_THU_CUNG
       WHERE MADOITAC = :1
       ORDER BY MATHUCUNG DESC`,
      [Number(customerId)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy thú cưng của khách hàng:', err);
    res.status(500).json({ error: 'Lỗi lấy thú cưng: ' + err.message });
  }
};
