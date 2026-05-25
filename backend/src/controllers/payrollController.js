const oracledb = require('oracledb');
const db = require('../config/db');

function formatMonthYear(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${yyyy}`;
}

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calculateProgressiveTax(amount, brackets) {
  let remaining = amount;
  let prevCap = 0;
  const details = [];
  let totalTax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const { cap, rate } = brackets[i];
    const bracketSize = cap - prevCap;
    const taxableInBracket = Math.max(0, Math.min(bracketSize, remaining));
    if (taxableInBracket > 0) {
      const tax = Math.round(taxableInBracket * rate);
      totalTax += tax;
      details.push({
        bacthue: i + 1,
        thunhapchiuthue: Math.round(taxableInBracket),
        tienthue: tax
      });
      remaining -= taxableInBracket;
    }
    prevCap = cap;
    if (remaining <= 0) break;
  }
  return { totalTax, details };
}

module.exports = {
  // POST /api/payroll/calculate
  calculatePayroll: async (req, res) => {
    const thangnam = req.body && req.body.thangnam ? req.body.thangnam : formatMonthYear(new Date());

    const [mmStr, yyyyStr] = thangnam.split('/');
    const mm = Number(mmStr);
    const yyyy = Number(yyyyStr);
    const startDate = new Date(yyyy, mm - 1, 1);
    const endDate = new Date(yyyy, mm, 0);

    const startStr = formatLocalDate(startDate);
    const endStr = formatLocalDate(endDate);

    // Oracle: dùng getConnection cho transaction
    const conn = await db.getConnection();
    try {
      // 1. Lấy cấu hình hệ số toàn cục từ database
      const paramsRes = await conn.query('SELECT MA_THAM_SO AS CODE, GIA_TRI AS VALUE FROM THAM_SO_LUONG');
      const params = {};
      paramsRes.rows.forEach(r => {
        params[r.code] = Number(r.value);
      });

      const tyLeBHXH = (params.TY_LE_BHXH !== undefined ? params.TY_LE_BHXH : 8) / 100;
      const tyLeBHYT = (params.TY_LE_BHYT !== undefined ? params.TY_LE_BHYT : 1.5) / 100;
      const tyLeBHTN = (params.TY_LE_BHTN !== undefined ? params.TY_LE_BHTN : 1) / 100;
      const tongTyLeBH = tyLeBHXH + tyLeBHYT + tyLeBHTN;
      const tranLuongBH = params.TRAN_LUONG_BH !== undefined ? params.TRAN_LUONG_BH : 36000000;

      const bracketsRes = await conn.query('SELECT NGUONG_TREN, THUE_SUAT FROM BIEU_THUE_TNCN ORDER BY BAC');
      const activeBrackets = bracketsRes.rows.map(b => ({
        cap: Number(b.nguong_tren),
        rate: Number(b.thue_suat) / 100
      }));

      // 2. SELECT danh sách nhân viên
      const employeesRes = await conn.query(
        `SELECT n.MANHANVIEN AS MANHANVIEN, n.HOTEN AS HOTEN,
                h.MUCLUONG AS MUCLUONG,
                h.GIAMTRUBANTHAN AS GIAMTRU_BAN_THAN,
                h.SONGUOIPHUTHUOC AS SONGUOI_PHUTHUOC,
                h.TIENGIAMNPT AS TIEN_GIAM_NPT,
                h.BHTUYCHINH AS BHTUYCHINH,
                h.THUETUYCHINH AS THUETUYCHINH
         FROM NHANVIEN n
         LEFT JOIN HO_SO_LUONG h ON n.MANHANVIEN = h.MANHANVIEN
         WHERE n.TRANGTHAI = $1`,
        ['Đang làm việc']
      );

      const created = [];
      const updated = [];
      for (const emp of employeesRes.rows) {
        const manhanvien = emp.manhanvien;
        const mucluong = Number(emp.mucluong || 0);

        // Aggregate attendance — Oracle: dùng TO_DATE cho BETWEEN
        const attRes = await conn.query(
          `SELECT NVL(SUM(SOGIOLAM),0) AS TOTAL_SOGIOLAM, NVL(SUM(TANGCA),0) AS TOTAL_TANGCA
           FROM CHAM_CONG WHERE MANHANVIEN = $1 AND NGAY BETWEEN TO_DATE($2, 'YYYY-MM-DD') AND TO_DATE($3, 'YYYY-MM-DD')`,
          [manhanvien, startStr, endStr]
        );
        const totalSOGIO = Number(attRes.rows[0].total_sogiolam || 0);
        const totalTANGCA = Number(attRes.rows[0].total_tangca || 0);

        const hourly = mucluong > 0 ? (mucluong / (26 * 8)) : 0;
        const gross = mucluong + Math.round(totalTANGCA * hourly * 1.5);

        const bhtuychinh = emp.bhtuychinh !== undefined && emp.bhtuychinh !== null ? Number(emp.bhtuychinh) : -1;
        const thuetuychinh = emp.thuetuychinh !== undefined && emp.thuetuychinh !== null ? Number(emp.thuetuychinh) : -1;

        let tongBaoHiemNV = 0;
        let bhxh_nv = 0;
        let bhyt_nv = 0;
        let bhtn_nv = 0;
        if (bhtuychinh >= 0) {
          tongBaoHiemNV = bhtuychinh;
          bhxh_nv = Math.round(tongBaoHiemNV * (tyLeBHXH / (tongTyLeBH || 1)));
          bhyt_nv = Math.round(tongBaoHiemNV * (tyLeBHYT / (tongTyLeBH || 1)));
          bhtn_nv = tongBaoHiemNV - bhxh_nv - bhyt_nv;
        } else {
          const luongDongBH = gross > 0 ? Math.min(mucluong, tranLuongBH) : 0;
          bhxh_nv = Math.round(luongDongBH * tyLeBHXH);
          bhyt_nv = Math.round(luongDongBH * tyLeBHYT);
          bhtn_nv = Math.round(luongDongBH * tyLeBHTN);
          tongBaoHiemNV = bhxh_nv + bhyt_nv + bhtn_nv;
        }

        const giamtrubanthan = Number(emp.giamtru_ban_than || 15500000);
        const tiengiamnpt = Number(emp.tien_giam_npt || 4400000);
        const songuoi = Number(emp.songuoi_phuthuoc || 0);

        let totalTax = 0;
        let details = [];
        if (thuetuychinh >= 0) {
          totalTax = thuetuychinh;
          details.push({
            bacthue: 1,
            thunhapchiuthue: totalTax > 0 ? Math.round(totalTax / (activeBrackets[0]?.rate || 0.05)) : 0,
            tienthue: totalTax
          });
        } else {
          const thuNhapChiuThue = Math.max(0, Math.round(gross - tongBaoHiemNV - giamtrubanthan - (tiengiamnpt * songuoi)));
          const taxRes = thuNhapChiuThue > 0 ? calculateProgressiveTax(thuNhapChiuThue, activeBrackets) : { totalTax: 0, details: [] };
          totalTax = taxRes.totalTax;
          details = taxRes.details;
        }

        const thuclinh = Math.round(gross - tongBaoHiemNV - totalTax);

        // Check existing payroll record
        const existingPlRes = await conn.query(
          `SELECT MAPHIEU FROM PHIEU_LUONG WHERE MANHANVIEN = $1 AND THANGNAM = $2`,
          [manhanvien, thangnam]
        );

        let maphieu;
        if (existingPlRes.rows.length > 0) {
          maphieu = existingPlRes.rows[0].maphieu;
          await conn.query(
            `UPDATE PHIEU_LUONG SET LUONG = $1, TONGBAOHIEMNV = $2, TONGTHUETNCN = $3, THUCLINH = $4, TRANGTHAI = $5 WHERE MAPHIEU = $6`,
            [gross, tongBaoHiemNV, totalTax, thuclinh, 'Chờ duyệt', maphieu]
          );

          await conn.query(`DELETE FROM CHI_TIET_BAO_HIEM WHERE MAPHIEU = $1`, [maphieu]);
          await conn.query(`DELETE FROM CHI_TIET_THUE_TNCN WHERE MAPHIEU = $1`, [maphieu]);
        } else {
          // Oracle: RETURNING MAPHIEU INTO :id
          const insertPl = await conn.execute(
            `INSERT INTO PHIEU_LUONG (MANHANVIEN, THANGNAM, LUONG, TONGBAOHIEMNV, TONGTHUETNCN, THUCLINH, TRANGTHAI) 
             VALUES (:1,:2,:3,:4,:5,:6,:7) RETURNING MAPHIEU INTO :id`,
            {
              1: manhanvien, 2: thangnam, 3: gross, 4: tongBaoHiemNV, 5: totalTax, 6: thuclinh, 7: 'Chờ duyệt',
              id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
          );
          maphieu = insertPl.outBinds.id[0];
        }

        // Insert insurance detail and tax details
        await conn.query(
          `INSERT INTO CHI_TIET_BAO_HIEM (MAPHIEU, BHXH_NV, BHYT_NV, BHTN_NV, BHXH_DN, BHYT_DN, BHTN_DN) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [maphieu, bhxh_nv, bhyt_nv, bhtn_nv, 0, 0, 0]
        );

        for (const d of details) {
          await conn.query(
            `INSERT INTO CHI_TIET_THUE_TNCN (MAPHIEU, BACTHUE, THUNHAPCHIUTHUE, TIENTHUE) VALUES ($1,$2,$3,$4)`,
            [maphieu, d.bacthue, d.thunhapchiuthue, d.tienthue]
          );
        }

        if (existingPlRes.rows.length > 0) {
          updated.push({ manhanvien, maphieu, hoten: emp.hoten, gross, tongBaoHiemNV, totalTax, thuclinh });
        } else {
          created.push({ manhanvien, maphieu, hoten: emp.hoten, gross, tongBaoHiemNV, totalTax, thuclinh });
        }
      }

      await conn.commit();
      res.json({ success: true, thangnam, created, updated });
    } catch (error) {
      await conn.rollback();
      console.error('calculatePayroll error:', error);
      res.status(500).json({ error: 'Lỗi khi tính lương', details: error.message });
    } finally {
      await conn.close();
    }
  },

  // GET /api/payroll?thangnam=MM/YYYY
  getPayrollRecords: async (req, res) => {
    const thangnam = req.query.thangnam || formatMonthYear(new Date());
    try {
      const q = `SELECT p.MAPHIEU AS MAPHIEU, p.MANHANVIEN AS MANHANVIEN, n.HOTEN AS HOTEN,
                        p.LUONG AS LUONG, p.TONGBAOHIEMNV AS TONGBAOHIEMNV,
                        p.TONGTHUETNCN AS TONGTHUETNCN, p.THUCLINH AS THUCLINH, p.TRANGTHAI AS TRANGTHAI, p.THANGNAM AS THANGNAM
                 FROM PHIEU_LUONG p
                 LEFT JOIN NHANVIEN n ON p.MANHANVIEN = n.MANHANVIEN
                 WHERE p.THANGNAM = $1 AND n.TRANGTHAI = 'Đang làm việc'
                 ORDER BY p.MANHANVIEN`;
      const result = await db.query(q, [thangnam]);
      res.json({ success: true, thangnam, data: result.rows });
    } catch (error) {
      console.error('getPayrollRecords error:', error);
      res.status(500).json({ error: 'Lỗi khi lấy phiếu lương', details: error.message });
    }
  },

  // GET /api/payroll/profile/:id
  getSalaryProfile: async (req, res) => {
    const id = req.params.id;
    try {
      const r = await db.query('SELECT * FROM HO_SO_LUONG WHERE MANHANVIEN = $1', [id]);
      if (r.rows.length === 0) return res.json({ success: true, data: null });
      return res.json({ success: true, data: r.rows[0] });
    } catch (err) {
      console.error('getSalaryProfile error:', err);
      res.status(500).json({ error: 'Lỗi server khi lấy hồ sơ lương' });
    }
  },

  // PUT /api/payroll/profile/:id
  upsertSalaryProfile: async (req, res) => {
    const id = req.params.id;
    const manhanvien = Number(id);
    if (isNaN(manhanvien)) {
      return res.status(400).json({ error: 'Mã nhân viên không hợp lệ' });
    }

    const { mucluong, songuoiphuthuoc, giamtru_banthan, tien_giam_npt, bhtuychinh, thuetuychinh } = req.body;
    const conn = await db.getConnection();
    try {
      const r = await conn.query('SELECT MANHANVIEN FROM HO_SO_LUONG WHERE MANHANVIEN = $1', [manhanvien]);
      
      const safeGiamTru = (giamtru_banthan !== undefined && giamtru_banthan !== null) ? Number(giamtru_banthan) : 15500000;
      const safeTienGiam = (tien_giam_npt !== undefined && tien_giam_npt !== null) ? Number(tien_giam_npt) : 4400000;
      const safeMucLuong = (mucluong !== undefined && mucluong !== null) ? Number(mucluong) : 0;
      const safeSoNguoi = (songuoiphuthuoc !== undefined && songuoiphuthuoc !== null) ? Number(songuoiphuthuoc) : 0;
      const safeBHTuyChinh = (bhtuychinh !== undefined && bhtuychinh !== null) ? Number(bhtuychinh) : -1;
      const safeThueTuyChinh = (thuetuychinh !== undefined && thuetuychinh !== null) ? Number(thuetuychinh) : -1;

      if (r.rows.length > 0) {
        await conn.query(
          `UPDATE HO_SO_LUONG 
           SET MUCLUONG = $1, 
               SONGUOIPHUTHUOC = $2, 
               GIAMTRUBANTHAN = $3, 
               TIENGIAMNPT = $4,
               BHTUYCHINH = $5,
               THUETUYCHINH = $6,
               NGAYCAPNHAT = SYSDATE
           WHERE MANHANVIEN = $7`,
          [safeMucLuong, safeSoNguoi, safeGiamTru, safeTienGiam, safeBHTuyChinh, safeThueTuyChinh, manhanvien]
        );
      } else {
        await conn.query(
          `INSERT INTO HO_SO_LUONG (MANHANVIEN, MUCLUONG, SONGUOIPHUTHUOC, GIAMTRUBANTHAN, TIENGIAMNPT, BHTUYCHINH, THUETUYCHINH, NGAYCAPNHAT) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, SYSDATE)`,
          [manhanvien, safeMucLuong, safeSoNguoi, safeGiamTru, safeTienGiam, safeBHTuyChinh, safeThueTuyChinh]
        );
      }
      await conn.commit();
      res.json({ success: true, message: 'Đã lưu hồ sơ lương' });
    } catch (err) {
      await conn.rollback();
      console.error('upsertSalaryProfile error:', err);
      res.status(500).json({ error: 'Lỗi server khi lưu hồ sơ lương', details: err.message });
    } finally {
      await conn.close();
    }
  },

  // 5. Duyệt phiếu lương
  approvePayroll: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query(
        `UPDATE PHIEU_LUONG SET TRANGTHAI = 'Đã duyệt' WHERE MAPHIEU = $1`,
        [Number(id)]
      );
      res.json({ success: true, message: 'Đã duyệt phiếu lương thành công!' });
    } catch (error) {
      console.error('approvePayroll error:', error);
      res.status(500).json({ error: 'Lỗi duyệt phiếu lương: ' + error.message });
    }
  },

  // 5.1 Duyệt toàn bộ bảng lương của tháng
  approveAllPayroll: async (req, res) => {
    const { thangnam } = req.body;
    if (!thangnam) {
      return res.status(400).json({ error: 'Thiếu tham số tháng/năm' });
    }
    try {
      await db.query(
        `UPDATE PHIEU_LUONG SET TRANGTHAI = 'Đã duyệt' WHERE THANGNAM = $1 AND TRANGTHAI = 'Chờ duyệt'`,
        [thangnam]
      );
      res.json({ success: true, message: 'Đã duyệt toàn bộ bảng lương tháng thành công!' });
    } catch (error) {
      console.error('approveAllPayroll error:', error);
      res.status(500).json({ error: 'Lỗi duyệt bảng lương: ' + error.message });
    }
  },

  // 6. Thanh toán lương
  payPayroll: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query(
        `UPDATE PHIEU_LUONG SET TRANGTHAI = 'Đã thanh toán' WHERE MAPHIEU = $1`,
        [Number(id)]
      );
      res.json({ success: true, message: 'Thanh toán lương thành công!' });
    } catch (error) {
      console.error('payPayroll error:', error);
      res.status(500).json({ error: 'Lỗi thanh toán lương: ' + error.message });
    }
  },

  // 7. Lấy cấu hình hệ số toàn cục
  getGlobalConfig: async (req, res) => {
    try {
      const paramsRes = await db.query('SELECT MA_THAM_SO AS CODE, GIA_TRI AS VALUE, MO_TA AS DESCRIPTION FROM THAM_SO_LUONG');
      const bracketsRes = await db.query('SELECT BAC, NGUONG_TREN, THUE_SUAT FROM BIEU_THUE_TNCN ORDER BY BAC');
      
      const config = {};
      paramsRes.rows.forEach(r => {
        config[r.code] = Number(r.value);
      });

      res.json({
        success: true,
        params: config,
        brackets: bracketsRes.rows.map(b => ({
          bac: Number(b.bac),
          nguong_tren: Number(b.nguong_tren),
          thue_suat: Number(b.thue_suat)
        }))
      });
    } catch (error) {
      console.error('getGlobalConfig error:', error);
      res.status(500).json({ error: 'Lỗi khi lấy cấu hình hệ thống: ' + error.message });
    }
  },

  // 8. Cập nhật cấu hình hệ số toàn cục
  updateGlobalConfig: async (req, res) => {
    const conn = await db.getConnection();
    try {
      const { params, brackets } = req.body;
      
      // Update THAM_SO_LUONG
      if (params) {
        for (const [code, val] of Object.entries(params)) {
          await conn.query(
            `UPDATE THAM_SO_LUONG SET GIA_TRI = $1 WHERE MA_THAM_SO = $2`,
            [Number(val), code]
          );
        }
      }

      // Update BIEU_THUE_TNCN
      if (brackets && Array.isArray(brackets)) {
        await conn.query('DELETE FROM BIEU_THUE_TNCN');
        for (const b of brackets) {
          await conn.query(
            `INSERT INTO BIEU_THUE_TNCN (BAC, NGUONG_TREN, THUE_SUAT) VALUES ($1, $2, $3)`,
            [Number(b.bac), Number(b.nguong_tren), Number(b.thue_suat)]
          );
        }
      }

      await conn.commit();
      res.json({ success: true, message: 'Đã cập nhật cấu hình hệ thống thành công!' });
    } catch (error) {
      await conn.rollback();
      console.error('updateGlobalConfig error:', error);
      res.status(500).json({ error: 'Lỗi cập nhật cấu hình hệ thống: ' + error.message });
    } finally {
      await conn.close();
    }
  }
};

