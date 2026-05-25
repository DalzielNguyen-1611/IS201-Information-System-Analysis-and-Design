const oracledb = require('oracledb');
const db = require('../config/db');

// 1. Lấy danh sách tất cả sản phẩm (kèm tồn kho)
exports.getAllProducts = async (req, res) => {
  try {
    const query = `
      SELECT s.MASANPHAM, s.TENSANPHAM, s.DONVITINH, s.GIANIEMYET, s.THUE,
             s.MAVACH, s.COTHEMUA, s.COTHEBAN, s.POS,
             s.THUONGHIEU, s.XUATXU, s.PHUHOP, s.THANHPHAN, s.HUONGDAN, s.MOTA,
             s.HINHANH,
             NVL(t.SOLUONGTON, 0) as SOLUONGTON
      FROM SAN_PHAM s
      LEFT JOIN TON_KHO t ON s.MASANPHAM = t.MASANPHAM
      ORDER BY s.MASANPHAM DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi Server' });
  }
};

// 2. Thêm sản phẩm mới (Có hỗ trợ ảnh qua req.file)
exports.createProduct = async (req, res) => {
  const {
    tenSanPham, donViTinh, giaNiemYet, thue,
    coTheMua, coTheBan, pos,
    mavach, thuonghieu, xuatxu, phuhop, thanhphan, huongdan, mota
  } = req.body;

  try {
    const conn = await db.getConnection();
    try {
      const insertResult = await conn.execute(
        `INSERT INTO SAN_PHAM
           (TENSANPHAM, DONVITINH, GIANIEMYET, THUE, COTHEMUA, COTHEBAN, POS,
            MAVACH, THUONGHIEU, XUATXU, PHUHOP, THANHPHAN, HUONGDAN, MOTA, HINHANH)
         VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15)
         RETURNING MASANPHAM INTO :id`,
        {
          1: tenSanPham,
          2: donViTinh || 'Cái',
          3: Number(giaNiemYet) || 0,
          4: Number(thue) || 0,
          5: Number(coTheMua) !== undefined ? Number(coTheMua) : 1,
          6: Number(coTheBan) !== undefined ? Number(coTheBan) : 1,
          7: Number(pos) !== undefined ? Number(pos) : 1,
          8: mavach || null,
          9: thuonghieu || null,
          10: xuatxu || null,
          11: phuhop || null,
          12: thanhphan || null,
          13: huongdan || null,
          14: mota || null,
          15: req.file ? req.file.path : null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      const newId = insertResult.outBinds.id[0];
      await conn.commit();

      const selectResult = await db.query(
        `SELECT s.*, NVL(t.SOLUONGTON, 0) as SOLUONGTON FROM SAN_PHAM s LEFT JOIN TON_KHO t ON s.MASANPHAM = t.MASANPHAM WHERE s.MASANPHAM = $1`,
        [newId]
      );
      res.json(selectResult.rows[0]);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      await conn.close();
    }
  } catch (err) {
    console.error('Lỗi khi thêm sản phẩm:', err.message);
    res.status(500).json({ error: 'Lỗi Server: Không thể tạo sản phẩm', details: err.message });
  }
};

// 3. Cập nhật thông tin sản phẩm (Có hỗ trợ ảnh qua req.file)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    tenSanPham, donViTinh, giaNiemYet, thue,
    coTheMua, coTheBan, pos,
    mavach, thuonghieu, xuatxu, phuhop, thanhphan, huongdan, mota
  } = req.body;

  try {
    const conn = await db.getConnection();
    try {
      let updateQuery = `
        UPDATE SAN_PHAM SET
          TENSANPHAM = :1, DONVITINH = :2, GIANIEMYET = :3, THUE = :4,
          COTHEMUA = :5, COTHEBAN = :6, POS = :7,
          MAVACH = :8, THUONGHIEU = :9, XUATXU = :10,
          PHUHOP = :11, THANHPHAN = :12, HUONGDAN = :13, MOTA = :14
      `;
      let params = {
        1: tenSanPham,
        2: donViTinh,
        3: Number(giaNiemYet) || 0,
        4: Number(thue) || 0,
        5: Number(coTheMua) !== undefined ? Number(coTheMua) : 1,
        6: Number(coTheBan) !== undefined ? Number(coTheBan) : 1,
        7: Number(pos) !== undefined ? Number(pos) : 1,
        8: mavach || null,
        9: thuonghieu || null,
        10: xuatxu || null,
        11: phuhop || null,
        12: thanhphan || null,
        13: huongdan || null,
        14: mota || null
      };

      if (req.file) {
        updateQuery += `, HINHANH = :15`;
        params[15] = req.file.path;
      }

      updateQuery += ` WHERE MASANPHAM = :id`;
      params['id'] = Number(id);

      await conn.execute(updateQuery, params);
      await conn.commit();

      const selectResult = await db.query(
        `SELECT s.*, NVL(t.SOLUONGTON, 0) as SOLUONGTON FROM SAN_PHAM s LEFT JOIN TON_KHO t ON s.MASANPHAM = t.MASANPHAM WHERE s.MASANPHAM = $1`,
        [id]
      );
      res.json(selectResult.rows[0]);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      await conn.close();
    }
  } catch (err) {
    console.error('Lỗi khi cập nhật sản phẩm:', err.message);
    res.status(500).json({ error: 'Lỗi Server: Không thể cập nhật sản phẩm' });
  }
};

// 4. "Xóa mềm" - Ngừng kinh doanh
exports.deactivateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'UPDATE SAN_PHAM SET COTHEMUA = 0, COTHEBAN = 0, POS = 0 WHERE MASANPHAM = $1',
      [id]
    );
    const selectResult = await db.query(
      `SELECT s.*, NVL(t.SOLUONGTON, 0) as SOLUONGTON FROM SAN_PHAM s LEFT JOIN TON_KHO t ON s.MASANPHAM = t.MASANPHAM WHERE s.MASANPHAM = $1`,
      [id]
    );
    res.json({
      message: 'Đã ngừng kinh doanh sản phẩm này!',
      product: selectResult.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi Server' });
  }
};

// 5. Lấy danh sách dịch vụ
exports.getAllServices = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT MADICHVU, TENDICHVU, GIA, COTHEBAN FROM DICH_VU ORDER BY MADICHVU DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAllServices error:', err.message);
    res.status(500).json({ error: 'Lỗi Server khi lấy danh sách dịch vụ' });
  }
};

// 6. Thêm dịch vụ mới
exports.createService = async (req, res) => {
  const { tenDichVu, gia, coTheBan } = req.body;
  if (!tenDichVu || !gia) {
    return res.status(400).json({ error: 'Tên dịch vụ và giá là bắt buộc' });
  }
  try {
    const conn = await db.getConnection();
    try {
      const insertResult = await conn.execute(
        `INSERT INTO DICH_VU (TENDICHVU, GIA, COTHEBAN)
         VALUES (:1, :2, :3)
         RETURNING MADICHVU INTO :id`,
        {
          1: tenDichVu,
          2: Number(gia) || 0,
          3: coTheBan !== undefined ? Number(coTheBan) : 1,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      const newId = insertResult.outBinds.id[0];
      await conn.commit();

      const selectResult = await db.query(
        'SELECT MADICHVU, TENDICHVU, GIA, COTHEBAN FROM DICH_VU WHERE MADICHVU = $1',
        [newId]
      );
      res.status(201).json(selectResult.rows[0]);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      await conn.close();
    }
  } catch (err) {
    console.error('createService error:', err.message);
    res.status(500).json({ error: 'Lỗi Server khi tạo dịch vụ', details: err.message });
  }
};

// 7. Cập nhật dịch vụ
exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { tenDichVu, gia, coTheBan } = req.body;
  if (!tenDichVu || !gia) {
    return res.status(400).json({ error: 'Tên dịch vụ và giá là bắt buộc' });
  }
  try {
    const conn = await db.getConnection();
    try {
      const result = await conn.execute(
        `UPDATE DICH_VU SET
           TENDICHVU = :1, GIA = :2, COTHEBAN = :3
         WHERE MADICHVU = :id`,
        {
          1: tenDichVu,
          2: Number(gia) || 0,
          3: coTheBan !== undefined ? Number(coTheBan) : 1,
          id: Number(id)
        }
      );
      if (result.rowsAffected === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
      }
      await conn.commit();

      const selectResult = await db.query(
        'SELECT MADICHVU, TENDICHVU, GIA, COTHEBAN FROM DICH_VU WHERE MADICHVU = $1',
        [id]
      );
      res.json(selectResult.rows[0]);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      await conn.close();
    }
  } catch (err) {
    console.error('updateService error:', err.message);
    res.status(500).json({ error: 'Lỗi Server khi cập nhật dịch vụ' });
  }
};

// 8. Ngừng kinh doanh dịch vụ
exports.deactivateService = async (req, res) => {
  const { id } = req.params;
  try {
    const updateResult = await db.query(
      'UPDATE DICH_VU SET COTHEBAN = 0 WHERE MADICHVU = $1',
      [id]
    );
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    }
    const selectResult = await db.query(
      'SELECT MADICHVU, TENDICHVU, GIA, COTHEBAN FROM DICH_VU WHERE MADICHVU = $1',
      [id]
    );
    res.json({
      message: 'Đã ngừng kinh doanh dịch vụ này!',
      service: selectResult.rows[0]
    });
  } catch (err) {
    console.error('deactivateService error:', err.message);
    res.status(500).json({ error: 'Lỗi Server khi ngừng kinh doanh dịch vụ' });
  }
};

// 9. Xóa hẳn dịch vụ khỏi database
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM DICH_VU WHERE MADICHVU = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    }
    res.json({ message: 'Đã xóa dịch vụ thành công!', id: Number(id) });
  } catch (err) {
    console.error('deleteService error:', err.message);
    res.status(500).json({ error: 'Lỗi Server khi xóa dịch vụ', details: err.message });
  }
};