const oracledb = require('oracledb');
const db = require('../config/db');

// --- 1. LẤY DANH SÁCH KHÁCH HÀNG ---
exports.getAllCustomers = async (req, res) => {
  try {
    const query = `
      SELECT
        d.MADOITAC, d.TENDOITAC, d.SODIENTHOAI, d.DIACHI, d.EMAIL, d.LOAIDOITAC, k.TRANGTHAI,
        k.DIEMTICHLUY, k.LOAIKHACHHANG, k.NGAYTHAMGIA,
        COUNT(dh.MADONHANG) as TOTAL_ORDERS,
        NVL(SUM(dh.TONGTIEN), 0) as TOTAL_SPENT
      FROM DOI_TAC d
      JOIN KHACH_HANG k ON d.MADOITAC = k.MADOITAC
      LEFT JOIN DON_HANG dh ON d.MADOITAC = dh.MADOITAC AND dh.TRANGTHAI = 'HoanThanh'
      WHERE d.LOAIDOITAC IN ('KHACH_HANG', 'KhachHang')
      GROUP BY d.MADOITAC, d.TENDOITAC, d.SODIENTHOAI, d.DIACHI, d.EMAIL, d.LOAIDOITAC, k.TRANGTHAI,
               k.DIEMTICHLUY, k.LOAIKHACHHANG, k.NGAYTHAMGIA
      ORDER BY d.MADOITAC DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi GET khách hàng:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách khách hàng' });
  }
};

// --- 2. THÊM MỚI KHÁCH HÀNG ---
exports.createCustomer = async (req, res) => {
  const { name, phone, address, email } = req.body;
  const conn = await db.getConnection();
  try {
    const insertDoiTac = await conn.execute(
      `INSERT INTO DOI_TAC (TENDOITAC, SODIENTHOAI, DIACHI, EMAIL, LOAIDOITAC)
       VALUES (:1, :2, :3, :4, 'KhachHang')
       RETURNING MADOITAC INTO :id`,
      {
        1: name, 2: phone, 3: address || null, 4: email || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const newId = insertDoiTac.outBinds.id[0];

    await conn.execute(
      `INSERT INTO KHACH_HANG (MADOITAC, DIEMTICHLUY, LOAIKHACHHANG, TRANGTHAI) VALUES (:1, 0, 'Đồng', 1)`,
      [newId]
    );

    await conn.commit();
    res.json({ message: 'Thêm khách hàng thành công', madoitac: newId });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi chi tiết khi POST khách hàng:', err);
    res.status(500).json({ error: 'Lỗi thêm khách hàng', details: err.message });
  } finally {
    await conn.close();
  }
};

// --- 3. CẬP NHẬT THÔNG TIN KHÁCH HÀNG ---
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, email, diemTichLuy, loaiKhachHang } = req.body;

  const conn = await db.getConnection();
  try {
    // 1. Cập nhật DOI_TAC
    await conn.execute(
      `UPDATE DOI_TAC
       SET TENDOITAC = :1, SODIENTHOAI = :2, DIACHI = :3, EMAIL = :4
       WHERE MADOITAC = :5`,
      [name, phone, address || null, email || null, Number(id)]
    );

    // 2. Cập nhật KHACH_HANG
    let khQuery = `UPDATE KHACH_HANG SET MADOITAC = MADOITAC`;
    const khParams = [];
    let paramIndex = 1;

    if (diemTichLuy !== undefined) {
      khQuery += `, DIEMTICHLUY = :${paramIndex++}`;
      khParams.push(Number(diemTichLuy));
    }
    if (loaiKhachHang !== undefined) {
      khQuery += `, LOAIKHACHHANG = :${paramIndex++}`;
      khParams.push(loaiKhachHang);
    }

    khQuery += ` WHERE MADOITAC = :${paramIndex}`;
    khParams.push(Number(id));

    await conn.execute(khQuery, khParams);

    await conn.commit();
    res.json({ message: 'Cập nhật thông tin khách hàng thành công!' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi cập nhật khách hàng:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin khách hàng: ' + err.message });
  } finally {
    await conn.close();
  }
};

// --- 4. KHÓA / MỞ KHÓA KHÁCH HÀNG ---
exports.toggleCustomerStatus = async (req, res) => {
  const { id } = req.params;
  const { trangthai } = req.body; // 0: Khóa, 1: Hoạt động

  try {
    const statusVal = Number(trangthai);
    await db.query(
      `UPDATE KHACH_HANG SET TRANGTHAI = :1 WHERE MADOITAC = :2`,
      [statusVal, Number(id)]
    );
    res.json({ message: statusVal === 0 ? 'Đã khóa tài khoản khách hàng!' : 'Đã mở khóa tài khoản khách hàng!' });
  } catch (err) {
    console.error('Lỗi thay đổi trạng thái khách hàng:', err);
    res.status(500).json({ error: 'Lỗi thay đổi trạng thái khách hàng' });
  }
};

// --- 5. LẤY DANH SÁCH THÚ CƯNG CỦA 1 KHÁCH HÀNG ---
exports.getPetsByCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT MATHUCUNG, TENTHUCUNG, LOAITHUCUNG, 
              CASE WHEN GIOITINH = 1 THEN 'Đực' ELSE 'Cái' END AS GIOITINH 
       FROM HO_SO_THU_CUNG 
       WHERE MADOITAC = :1`,
      [Number(id)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi GET thú cưng:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách thú cưng' });
  }
};

// --- 6. THÊM THÚ CƯNG CHO KHÁCH HÀNG ---
exports.createPet = async (req, res) => {
  const maDoiTac = req.params.id;
  const { tenThuCung, loaiThuCung, gioiTinh } = req.body;
  try {
    let gioiTinhDb = 0;
    if (gioiTinh === 'Đực' || gioiTinh === 1 || gioiTinh === '1' || String(gioiTinh).toLowerCase() === 'đực') {
      gioiTinhDb = 1;
    }

    await db.query(
      `INSERT INTO HO_SO_THU_CUNG (MADOITAC, TENTHUCUNG, LOAITHUCUNG, GIOITINH)
       VALUES (:1, :2, :3, :4)`,
      [Number(maDoiTac), tenThuCung, loaiThuCung, gioiTinhDb]
    );
    res.json({ message: 'Thêm thú cưng thành công' });
  } catch (err) {
    console.error('Lỗi POST thú cưng:', err);
    res.status(500).json({ error: 'Lỗi thêm thú cưng', details: err.message });
  }
};