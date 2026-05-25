const db = require('../config/db');

function computeHours(giovao, giora) {
  if (!giovao || !giora) return { sogiolam: 0, tangca: 0 };
  const msPerHour = 1000 * 60 * 60;
  let totalHours = (giora.getTime() - giovao.getTime()) / msPerHour;
  if (totalHours < 0) totalHours = 0;
  const crossedLunch = (giovao.getHours() < 12) && (giora.getHours() >= 13);
  if (crossedLunch) totalHours = Math.max(0, totalHours - 1);
  const sogiolam = Math.round(Math.max(0, Math.min(8, totalHours)) * 100) / 100;
  const overtimeBaseline = new Date(giora);
  overtimeBaseline.setHours(17, 0, 0, 0);
  const rawOver = (giora.getTime() - overtimeBaseline.getTime()) / msPerHour;
  const tangca = Math.round(Math.max(0, rawOver) * 100) / 100;
  return { sogiolam, tangca };
}

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = {
  // POST /api/attendance/check-in
  checkIn: async (req, res) => {
    const ma = req.user && req.user.maNhanVien;
    if (!ma) return res.status(400).json({ error: 'Không xác định nhân viên từ token' });

    try {
      const now = new Date();
      const localDate = formatLocalDate(now);

      // Kiểm tra nghỉ phép đã duyệt — schema mới: DON_XIN_NGHI_PHEP, cột TUNGAY/DENNGAY
      const leaveCheck = await db.query(
        `SELECT MADON FROM DON_XIN_NGHI_PHEP
         WHERE MANHANVIEN = $1 AND TRANGTHAI = 'Đã duyệt'
           AND TUNGAY <= TO_DATE($2, 'YYYY-MM-DD')
           AND DENNGAY >= TO_DATE($3, 'YYYY-MM-DD')`,
        [ma, localDate, localDate]
      );
      if (leaveCheck.rows.length > 0)
        return res.status(400).json({ error: 'Bạn đang có đơn nghỉ phép đã được duyệt hôm nay' });

      const existing = await db.query(
        `SELECT * FROM CHAM_CONG WHERE MANHANVIEN = $1 AND NGAY = TO_DATE($2, 'YYYY-MM-DD')`,
        [ma, localDate]
      );

      if (existing.rows.length > 0) {
        const rec = existing.rows[0];
        if (rec.giovao) return res.status(400).json({ error: 'Bạn đã check-in hôm nay' });
        await db.query(
          `UPDATE CHAM_CONG SET GIOVAO = $1, TRANGTHAI = 'Có mặt' WHERE MACHAMCONG = $2`,
          [now, rec.machamcong]
        );
        const updated = await db.query('SELECT * FROM CHAM_CONG WHERE MACHAMCONG = $1', [rec.machamcong]);
        return res.json({ success: true, record: updated.rows[0] });
      }

      const oracledb = require('oracledb');
      const conn = await db.getConnection();
      try {
        const insertRes = await conn.execute(
          `INSERT INTO CHAM_CONG (MANHANVIEN, NGAY, GIOVAO, TRANGTHAI)
           VALUES (:1, TO_DATE(:2, 'YYYY-MM-DD'), :3, 'Có mặt') RETURNING MACHAMCONG INTO :id`,
          {
            1: ma, 2: localDate, 3: now,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
          }
        );
        await conn.commit();
        const newId = insertRes.outBinds.id[0];
        const newRec = await db.query('SELECT * FROM CHAM_CONG WHERE MACHAMCONG = $1', [newId]);
        res.json({ success: true, record: newRec.rows[0] });
      } finally {
        await conn.close();
      }
    } catch (err) {
      console.error('checkIn error:', err);
      res.status(500).json({ error: 'Lỗi server khi check-in' });
    }
  },

  // POST /api/attendance/check-out
  checkOut: async (req, res) => {
    const ma = req.user && req.user.maNhanVien;
    if (!ma) return res.status(400).json({ error: 'Không xác định nhân viên từ token' });

    try {
      const now = new Date();
      const localDate = formatLocalDate(now);
      const existing = await db.query(
        `SELECT * FROM CHAM_CONG WHERE MANHANVIEN = $1 AND NGAY = TO_DATE($2, 'YYYY-MM-DD')`,
        [ma, localDate]
      );
      if (existing.rows.length === 0) return res.status(400).json({ error: 'Không tìm thấy bản ghi check-in hôm nay' });
      const rec = existing.rows[0];
      if (!rec.giovao) return res.status(400).json({ error: 'Bạn chưa check-in hôm nay' });
      if (rec.giora) return res.status(400).json({ error: 'Bạn đã check-out rồi' });

      const giovao = new Date(rec.giovao);
      const giora = now;
      const { sogiolam, tangca } = computeHours(giovao, giora);

      await db.query(
        `UPDATE CHAM_CONG SET GIORA = $1, SOGIOLAM = $2, TANGCA = $3 WHERE MACHAMCONG = $4`,
        [giora, sogiolam, tangca, rec.machamcong]
      );
      const updated = await db.query('SELECT * FROM CHAM_CONG WHERE MACHAMCONG = $1', [rec.machamcong]);
      res.json({ success: true, record: updated.rows[0] });
    } catch (err) {
      console.error('checkOut error:', err);
      res.status(500).json({ error: 'Lỗi server khi check-out' });
    }
  },

  // GET /api/attendance/my-records?thangnam=MM/YYYY
  getMyRecords: async (req, res) => {
    const ma = req.user && req.user.maNhanVien;
    if (!ma) return res.status(400).json({ error: 'Không xác định nhân viên từ token' });
    const thangnam = req.query.thangnam;
    try {
      let rows;
      if (thangnam) {
        const [mm, yyyy] = thangnam.split('/').map(Number);
        const start = new Date(yyyy, mm - 1, 1);
        const end = new Date(yyyy, mm, 0);
        rows = await db.query(
          `SELECT * FROM CHAM_CONG WHERE MANHANVIEN = $1 AND NGAY BETWEEN TO_DATE($2, 'YYYY-MM-DD') AND TO_DATE($3, 'YYYY-MM-DD') ORDER BY NGAY DESC`,
          [ma, formatLocalDate(start), formatLocalDate(end)]
        );
      } else {
        rows = await db.query(
          `SELECT * FROM CHAM_CONG WHERE MANHANVIEN = $1 ORDER BY NGAY DESC FETCH FIRST 100 ROWS ONLY`,
          [ma]
        );
      }
      res.json({ success: true, data: rows.rows });
    } catch (err) {
      console.error('getMyRecords error:', err);
      res.status(500).json({ error: 'Lỗi server khi lấy bảng công' });
    }
  },

  // GET /api/attendance/all-records?thangnam=MM/YYYY
  getAllRecords: async (req, res) => {
    try {
      const thangnam = req.query.thangnam;
      let rows;
      if (thangnam) {
        const [mm, yyyy] = thangnam.split('/').map(Number);
        const start = new Date(yyyy, mm - 1, 1);
        const end = new Date(yyyy, mm, 0);
        rows = await db.query(
          `SELECT * FROM CHAM_CONG WHERE NGAY BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD') ORDER BY NGAY DESC`,
          [formatLocalDate(start), formatLocalDate(end)]
        );
      } else {
        rows = await db.query('SELECT * FROM CHAM_CONG ORDER BY NGAY DESC FETCH FIRST 100 ROWS ONLY');
      }
      res.json({ success: true, data: rows.rows });
    } catch (err) {
      console.error('getAllRecords error:', err);
      res.status(500).json({ error: 'Lỗi server khi lấy bảng công toàn công ty' });
    }
  },

  // PUT /api/attendance/edit/:id
  editRecord: async (req, res) => {
    const id = req.params.id;
    const { giovao: gvBody, giora: grBody, ghichu, lydo } = req.body;
    const conn = await db.getConnection();
    try {
      const recR = await conn.execute(
        `SELECT MACHAMCONG, GIOVAO, GIORA, SOGIOLAM, TANGCA FROM CHAM_CONG WHERE MACHAMCONG = :1`,
        [id]
      );
      if (recR.rows.length === 0) return res.status(404).json({ error: 'Bản ghi không tồn tại' });
      const rec = recR.rows[0];
      // rec là array theo thứ tự cột: [MACHAMCONG, GIOVAO, GIORA, SOGIOLAM, TANGCA]
      const recRow = await db.query('SELECT * FROM CHAM_CONG WHERE MACHAMCONG = $1', [id]);
      const recObj = recRow.rows[0];

      const giovao = gvBody ? new Date(gvBody) : (recObj.giovao ? new Date(recObj.giovao) : null);
      const giora  = grBody ? new Date(grBody) : (recObj.giora  ? new Date(recObj.giora)  : null);
      const { sogiolam, tangca } = computeHours(giovao, giora);

      // Ghi lịch sử sửa
      await conn.execute(
        `INSERT INTO CHAM_CONG_SUA_LICH_SU
           (MACHAMCONG, NGUOISUA, GIOVAO_CU, GIOVAO_MOI, GIORA_CU, GIORA_MOI, SOGIOLAM_CU, SOGIOLAM_MOI, TANGCA_CU, TANGCA_MOI, LYDO)
         VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11)`,
        [id, req.user.maNhanVien, recObj.giovao, giovao, recObj.giora, giora,
         recObj.sogiolam, sogiolam, recObj.tangca, tangca, lydo || null]
      );

      await conn.execute(
        `UPDATE CHAM_CONG SET GIOVAO = :1, GIORA = :2, SOGIOLAM = :3, TANGCA = :4, GHICHU = NVL(:5, GHICHU) WHERE MACHAMCONG = :6`,
        [giovao, giora, sogiolam, tangca, ghichu || null, id]
      );

      await conn.commit();
      const updated = await db.query('SELECT * FROM CHAM_CONG WHERE MACHAMCONG = $1', [id]);
      res.json({ success: true, record: updated.rows[0] });
    } catch (err) {
      await conn.rollback();
      console.error('editRecord error:', err);
      res.status(500).json({ error: 'Lỗi server khi chỉnh sửa bảng công' });
    } finally {
      await conn.close();
    }
  },

  // GET /api/attendance/history/:id
  getEditHistory: async (req, res) => {
    const id = req.params.id;
    try {
      const r = await db.query(
        `SELECT s.*, n.HOTEN as NGUOISUA_HOTEN
         FROM CHAM_CONG_SUA_LICH_SU s
         LEFT JOIN NHANVIEN n ON s.NGUOISUA = n.MANHANVIEN
         WHERE s.MACHAMCONG = $1
         ORDER BY s.NGAYSUA DESC`,
        [id]
      );
      res.json({ success: true, data: r.rows });
    } catch (err) {
      console.error('getEditHistory error:', err);
      res.status(500).json({ error: 'Lỗi server khi lấy lịch sử sửa' });
    }
  }
};
