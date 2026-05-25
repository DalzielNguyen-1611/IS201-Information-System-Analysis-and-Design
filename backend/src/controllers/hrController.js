const oracledb = require('oracledb');
const db = require('../config/db');
const bcrypt = require('bcrypt');

// === EMPLOYEE MANAGEMENT ===

exports.getAllEmployees = async (req, res) => {
  try {
    // Schema mới: USERNAME/MAVAITRO trực tiếp trong NHANVIEN
    const query = `
      SELECT nv.MANHANVIEN, nv.HOTEN, nv.SDT, nv.EMAIL, nv.TRANGTHAI, nv.NGAYVAOLAM,
             nv.MAVAITRO, vt.TENVAITRO, nv.USERNAME,
             hsl.MUCLUONG, hsl.SONGUOIPHUTHUOC
      FROM NHANVIEN nv
      LEFT JOIN VAI_TRO vt ON nv.MAVAITRO = vt.MAVAITRO
      LEFT JOIN HO_SO_LUONG hsl ON nv.MANHANVIEN = hsl.MANHANVIEN
      ORDER BY nv.MANHANVIEN ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    const fs = require('fs');
    try {
      fs.writeFileSync('d:\\IS201-Information-System-Design-Analysis\\backend\\error.log', 'getAllEmployees error: ' + (err.stack || err.message || String(err)));
    } catch (e) {}
    res.status(500).json({ error: 'Lỗi lấy danh sách nhân viên: ' + err.message });
  }
};

exports.register = async (req, res) => {
  const { hoten, sdt, email, username, password, maVaiTro } = req.body;
  const conn = await db.getConnection();
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const safeSdt = (sdt && sdt.trim()) ? sdt.trim() : '—';
    const safeEmail = (email && email.trim()) ? email.trim() : '—';

    // Schema mới: INSERT thẳng vào NHANVIEN với USERNAME, PASSWORDHASH, MAVAITRO
    const nvResult = await conn.execute(
      `INSERT INTO NHANVIEN (HOTEN, SDT, EMAIL, NGAYVAOLAM, TRANGTHAI, MAVAITRO, USERNAME, PASSWORDHASH)
       VALUES (:1, :2, :3, SYSDATE, 'Đang làm việc', :4, :5, :6) RETURNING MANHANVIEN INTO :id`,
      {
        1: hoten, 2: safeSdt, 3: safeEmail, 4: maVaiTro, 5: username, 6: passwordHash,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const maNhanVienMoi = nvResult.outBinds.id[0];

    await conn.commit();
    res.status(201).json({ message: 'Tạo tài khoản nhân viên thành công!', manhanvien: maNhanVienMoi });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi tạo tài khoản:', err);
    const fs = require('fs');
    try {
      fs.writeFileSync('d:\\IS201-Information-System-Design-Analysis\\backend\\error.log', 'register error: ' + (err.stack || err.message || String(err)));
    } catch (e) {}
    if (err.errorNum === 1) {
      return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại!' });
    }
    res.status(500).json({ error: 'Lỗi server khi tạo nhân viên: ' + err.message });
  } finally {
    await conn.close();
  }
};

exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { hoten, sdt, email, maVaiTro, trangthai } = req.body;
  const conn = await db.getConnection();
  try {
    const safeSdt = (sdt && sdt.trim()) ? sdt.trim() : '—';
    const safeEmail = (email && email.trim()) ? email.trim() : '—';
    // Schema mới: UPDATE NHANVIEN bao gồm cả MAVAITRO
    await conn.execute(
      `UPDATE NHANVIEN SET HOTEN = :1, SDT = :2, EMAIL = :3, TRANGTHAI = :4, MAVAITRO = :5 WHERE MANHANVIEN = :6`,
      [hoten, safeSdt, safeEmail, trangthai, maVaiTro, id]
    );
    await conn.commit();
    res.json({ message: 'Cập nhật thông tin thành công!' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi cập nhật nhân viên:', err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật: ' + err.message });
  } finally {
    await conn.close();
  }
};

exports.softDeleteEmployee = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    // Thử xóa cứng trước để dọn dẹp DB nếu nhân viên chưa có dữ liệu phát sinh
    try {
      const deleteRes = await conn.execute(
        `DELETE FROM NHANVIEN WHERE MANHANVIEN = :1`,
        [id]
      );
      if (deleteRes.rowsAffected > 0) {
        await conn.commit();
        return res.json({ message: 'Đã xóa hoàn toàn nhân viên khỏi hệ thống!' });
      }
    } catch (dbErr) {
      // Nếu là lỗi ORA-02292 (ràng buộc khóa ngoại), chuyển sang xóa mềm (Đã nghỉ việc)
      if (dbErr.errorNum === 2292) {
        const updateRes = await conn.execute(
          `UPDATE NHANVIEN SET TRANGTHAI = 'Đã nghỉ việc' WHERE MANHANVIEN = :1`,
          [id]
        );
        if (updateRes.rowsAffected > 0) {
          await conn.commit();
          return res.json({ message: 'Nhân viên đã có dữ liệu phát sinh. Đã tự động chuyển trạng thái sang Đã nghỉ việc!' });
        }
      } else {
        throw dbErr;
      }
    }
    res.status(404).json({ error: 'Không tìm thấy nhân viên để xóa!' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi xóa nhân viên:', err);
    res.status(500).json({ error: 'Lỗi server khi xóa nhân viên: ' + err.message });
  } finally {
    await conn.close();
  }
};

// === LEAVE MANAGEMENT ===

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

exports.createLeave = async (req, res) => {
  const ma = req.user && req.user.maNhanVien;
  if (!ma) return res.status(400).json({ error: 'Không xác định nhân viên từ token' });

  const { fromDate, toDate, lydo, loainghi } = req.body;
  if (!fromDate || !toDate) return res.status(400).json({ error: 'Thiếu ngày bắt đầu hoặc kết thúc' });

  const conn = await db.getConnection();
  try {
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    const soday = Math.round((d2.setHours(0,0,0,0) - d1.setHours(0,0,0,0)) / msPerDay) + 1;

    // Schema mới: DON_XIN_NGHI_PHEP, cột TUNGAY/DENNGAY/SONGAY/LOAINGHI
    // Bổ sung cơ chế tự sinh ID an toàn bằng SELECT COALESCE(MAX(MADON), 0) + 1 để tránh lỗi lệch Sequence Oracle
    const insertRes = await conn.execute(
      `INSERT INTO DON_XIN_NGHI_PHEP (MADON, MANHANVIEN, LOAINGHI, TUNGAY, DENNGAY, SONGAY, LYDO, TRANGTHAI)
       VALUES ((SELECT COALESCE(MAX(MADON), 0) + 1 FROM DON_XIN_NGHI_PHEP), :1, :2, TO_DATE(:3,'YYYY-MM-DD'), TO_DATE(:4,'YYYY-MM-DD'), :5, :6, 'Chờ duyệt')
       RETURNING MADON INTO :id`,
      {
        1: ma, 2: loainghi || 'Nghỉ phép năm', 3: fromDate, 4: toDate, 5: soday, 6: lydo || '',
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const newId = insertRes.outBinds.id[0];

    // Khởi tạo QUAN_LY_PHEP nếu chưa có (schema mới có NAM và DADUNG)
    const nam = new Date().getFullYear();
    const qRes = await conn.execute(
      `SELECT IDPHEP FROM QUAN_LY_PHEP WHERE MANHANVIEN = :1 AND NAM = :2`,
      [ma, nam]
    );
    if (qRes.rows.length === 0) {
      // Bổ sung cơ chế tự sinh ID an toàn bằng SELECT COALESCE(MAX(IDPHEP), 0) + 1 để tránh lỗi lệch Sequence Oracle
      await conn.execute(
        `INSERT INTO QUAN_LY_PHEP (IDPHEP, MANHANVIEN, NAM, TONGPHEP, DADUNG, CONLAI)
         VALUES ((SELECT COALESCE(MAX(IDPHEP), 0) + 1 FROM QUAN_LY_PHEP), :1, :2, :3, :4, :5)`,
        [ma, nam, 12, 0, 12]
      );
    }

    await conn.commit();
    const newRec = await db.query('SELECT * FROM DON_XIN_NGHI_PHEP WHERE MADON = $1', [newId]);
    res.json({ success: true, request: newRec.rows[0] });
  } catch (err) {
    await conn.rollback();
    console.error('createLeave error:', err);
    const fs = require('fs');
    try {
      fs.writeFileSync('d:\\IS201-Information-System-Design-Analysis\\backend\\error.log', 'createLeave error: ' + (err.stack || err.message || String(err)));
    } catch (e) {}
    res.status(500).json({ error: 'Lỗi server khi tạo đơn nghỉ phép: ' + err.message });
  } finally {
    await conn.close();
  }
};

exports.getMyLeaves = async (req, res) => {
  const ma = req.user && req.user.maNhanVien;
  if (!ma) return res.status(400).json({ error: 'Không xác định nhân viên từ token' });
  try {
    const r = await db.query(
      'SELECT * FROM DON_XIN_NGHI_PHEP WHERE MANHANVIEN = $1 ORDER BY MADON DESC',
      [ma]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('getMyLeaves error:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy đơn nghỉ của bạn' });
  }
};

exports.getLeaveBalance = async (req, res) => {
  const ma = req.user && req.user.maNhanVien;
  if (!ma) return res.status(400).json({ error: 'Không xác định nhân viên từ token' });
  try {
    const nam = new Date().getFullYear();
    const r = await db.query(
      'SELECT * FROM QUAN_LY_PHEP WHERE MANHANVIEN = $1 AND NAM = $2',
      [ma, nam]
    );
    if (r.rows.length === 0) return res.json({ success: true, data: { tongphep: 12, dadung: 0, conlai: 12 } });
    const row = r.rows[0];
    res.json({ success: true, data: { tongphep: Number(row.tongphep), dadung: Number(row.dadung), conlai: Number(row.conlai) } });
  } catch (err) {
    console.error('getLeaveBalance error:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin phép' });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT d.*, n.HOTEN as HOTEN_NHANVIEN
       FROM DON_XIN_NGHI_PHEP d
       LEFT JOIN NHANVIEN n ON d.MANHANVIEN = n.MANHANVIEN
       WHERE d.TRANGTHAI = 'Chờ duyệt'
       ORDER BY d.MADON ASC`
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('getPendingLeaves error:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy đơn chờ duyệt' });
  }
};

exports.getLeaveHistory = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT d.*, n.HOTEN as HOTEN_NHANVIEN, app.HOTEN as HOTEN_NGUOIDUYET
       FROM DON_XIN_NGHI_PHEP d
       LEFT JOIN NHANVIEN n ON d.MANHANVIEN = n.MANHANVIEN
       LEFT JOIN NHANVIEN app ON d.NGUOIDUYET = app.MANHANVIEN
       WHERE d.TRANGTHAI IN ('Đã duyệt', 'Từ chối')
       ORDER BY d.MADON DESC`
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    console.error('getLeaveHistory error:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy lịch sử duyệt phép' });
  }
};

exports.approveLeave = async (req, res) => {
  const approver = req.user && req.user.maNhanVien;
  const id = req.params.id;
  const conn = await db.getConnection();
  try {
    const r = await conn.execute(
      `SELECT * FROM DON_XIN_NGHI_PHEP WHERE MADON = :1`,
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Đơn không tồn tại' });
    const leave = r.rows[0];
    const trangthai = leave[6]; // index depends on column order - use named approach via query
    
    const leaveRow = await db.query('SELECT * FROM DON_XIN_NGHI_PHEP WHERE MADON = $1', [id]);
    if (leaveRow.rows.length === 0) return res.status(404).json({ error: 'Đơn không tồn tại' });
    const lv = leaveRow.rows[0];
    if (lv.trangthai !== 'Chờ duyệt') return res.status(400).json({ error: 'Đơn đã được xử lý' });

    await conn.execute(
      `UPDATE DON_XIN_NGHI_PHEP SET TRANGTHAI = 'Đã duyệt', NGUOIDUYET = :1 WHERE MADON = :2`,
      [approver, id]
    );

    // Cập nhật QUAN_LY_PHEP (schema mới có NAM, DADUNG)
    const nam = new Date(lv.tungay || lv.TUNGAY).getFullYear() || new Date().getFullYear();
    const qRes = await conn.execute(
      `SELECT * FROM QUAN_LY_PHEP WHERE MANHANVIEN = :1 AND NAM = :2`,
      [lv.manhanvien, nam]
    );
    const songay = Number(lv.songay || 0);
    if (qRes.rows.length === 0) {
      await conn.execute(
        `INSERT INTO QUAN_LY_PHEP (MANHANVIEN, NAM, TONGPHEP, DADUNG, CONLAI) VALUES (:1, :2, :3, :4, :5)`,
        [lv.manhanvien, nam, 12, songay, Math.max(0, 12 - songay)]
      );
    } else {
      await conn.execute(
        `UPDATE QUAN_LY_PHEP SET DADUNG = DADUNG + :1, CONLAI = GREATEST(0, CONLAI - :2) WHERE MANHANVIEN = :3 AND NAM = :4`,
        [songay, songay, lv.manhanvien, nam]
      );
    }

    // Đánh dấu CHAM_CONG là nghỉ phép
    try {
      const start = new Date(lv.tungay);
      const end = new Date(lv.denngay);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = formatLocalDate(new Date(d));
        const ghiChuText = `Nghỉ phép: ${lv.lydo || ''}`;
        const chRes = await conn.execute(
          `SELECT MACHAMCONG FROM CHAM_CONG WHERE MANHANVIEN = :1 AND NGAY = TO_DATE(:2, 'YYYY-MM-DD')`,
          [lv.manhanvien, dateStr]
        );
        if (chRes.rows.length > 0) {
          await conn.execute(
            `UPDATE CHAM_CONG SET GIOVAO = NULL, GIORA = NULL, SOGIOLAM = 0, TANGCA = 0, TRANGTHAI = 'Nghỉ phép', GHICHU = :1 WHERE MACHAMCONG = :2`,
            [ghiChuText, chRes.rows[0][0]]
          );
        } else {
          await conn.execute(
            `INSERT INTO CHAM_CONG (MANHANVIEN, NGAY, SOGIOLAM, TANGCA, TRANGTHAI, GHICHU) VALUES (:1, TO_DATE(:2, 'YYYY-MM-DD'), 0, 0, 'Nghỉ phép', :3)`,
            [lv.manhanvien, dateStr, ghiChuText]
          );
        }
      }
    } catch (e) {
      console.error('approveLeave - mark CHAM_CONG error:', e);
    }

    await conn.commit();
    res.json({ success: true, message: 'Đã duyệt đơn nghỉ phép' });
  } catch (err) {
    await conn.rollback();
    console.error('approveLeave error:', err);
    res.status(500).json({ error: 'Lỗi server khi duyệt đơn' });
  } finally {
    await conn.close();
  }
};

exports.rejectLeave = async (req, res) => {
  const approver = req.user && req.user.maNhanVien;
  const id = req.params.id;
  const { reason } = req.body;
  try {
    const r = await db.query('SELECT * FROM DON_XIN_NGHI_PHEP WHERE MADON = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Đơn không tồn tại' });
    const leave = r.rows[0];
    if (leave.trangthai !== 'Chờ duyệt') return res.status(400).json({ error: 'Đơn đã được xử lý' });

    await db.query(
      `UPDATE DON_XIN_NGHI_PHEP SET TRANGTHAI = 'Từ chối', NGUOIDUYET = $1, LYDO = NVL($2, LYDO) WHERE MADON = $3`,
      [approver, reason || null, id]
    );
    res.json({ success: true, message: 'Đã từ chối đơn nghỉ phép' });
  } catch (err) {
    console.error('rejectLeave error:', err);
    res.status(500).json({ error: 'Lỗi server khi từ chối đơn' });
  }
};

// GET /api/hr/employees/weekly-attendance?start=YYYY-MM-DD
exports.getEmployeesWeeklyAttendance = async (req, res) => {
  try {
    let startParam = req.query.start;
    let startDate = startParam ? new Date(startParam) : new Date();
    startDate.setHours(0,0,0,0);
    const day = startDate.getDay();
    const diffToMon = (day + 6) % 7;
    startDate.setDate(startDate.getDate() - diffToMon);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(formatLocalDate(d));
    }
    const startStr = dates[0];
    const endStr = dates[6];

    const empRes = await db.query(
      `SELECT MANHANVIEN, HOTEN FROM NHANVIEN WHERE TRANGTHAI = $1 ORDER BY MANHANVIEN`,
      ['Đang làm việc']
    );

    const chRes = await db.query(
      `SELECT MANHANVIEN, NGAY, GIOVAO, GIORA, SOGIOLAM FROM CHAM_CONG
       WHERE NGAY BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')`,
      [startStr, endStr]
    );

    const attMap = {};
    for (const r of chRes.rows) {
      const man = r.manhanvien;
      const dateKey = formatLocalDate(new Date(r.ngay));
      if (!attMap[man]) attMap[man] = {};
      const present = (r.giovao !== null) || (r.giora !== null) || (r.sogiolam && Number(r.sogiolam) > 0);
      attMap[man][dateKey] = !!present;
    }

    const data = empRes.rows.map(emp => {
      const obj = { manhanvien: emp.manhanvien, hoten: emp.hoten, attendance: {} };
      for (const d of dates) {
        obj.attendance[d] = attMap[emp.manhanvien] && attMap[emp.manhanvien][d] ? true : false;
      }
      return obj;
    });

    res.json({ success: true, start: startStr, end: endStr, days: dates, data });
  } catch (err) {
    console.error('getEmployeesWeeklyAttendance error:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy chấm công tuần' });
  }
};
