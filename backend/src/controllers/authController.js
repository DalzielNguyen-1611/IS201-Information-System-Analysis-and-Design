const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Schema mới: USERNAME/PASSWORDHASH/MAVAITRO nằm trực tiếp trong NHANVIEN
    const query = `
      SELECT nv.MANHANVIEN, nv.USERNAME, nv.PASSWORDHASH,
             nv.HOTEN, nv.TRANGTHAI,
             vt.MAVAITRO, vt.TENVAITRO, vt.QUYENHAN
      FROM NHANVIEN nv
      JOIN VAI_TRO vt ON nv.MAVAITRO = vt.MAVAITRO
      WHERE nv.USERNAME = $1
    `;
    const result = await db.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập không tồn tại!' });
    }

    const user = result.rows[0];

    if (user.trangthai !== 'Đang làm việc') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa hoặc nhân viên đã nghỉ việc!' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordhash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác!' });
    }

    // Oracle: QUYENHAN là CLOB chứa JSON string -> parse
    const quyenHan = typeof user.quyenhan === 'string' ? JSON.parse(user.quyenhan) : user.quyenhan;

    const payload = {
      maNhanVien: user.manhanvien,
      hoTen: user.hoten,
      tenVaiTro: user.tenvaitro,
      quyenHan: quyenHan
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'my_super_secret_jwt_key', { expiresIn: '1d' });
    res.json({ message: 'Đăng nhập thành công', token, user: payload });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};