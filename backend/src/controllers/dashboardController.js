const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. KPI chính — Schema mới: DON_HANG (NGAYTAO, MADONHANG, TONGTIEN)
    const kpiQuery = `
      SELECT
        NVL(SUM(TONGTIEN), 0) as TONG_DOANH_THU,
        COUNT(*) as TONG_DON_HANG
      FROM DON_HANG
      WHERE TRANGTHAI = 'HoanThanh'
    `;
    const kpiResult = await db.query(kpiQuery);

    // Đếm khách hàng
    const customerResult = await db.query(
      `SELECT COUNT(*) as TONG_KHACH_HANG FROM KHACH_HANG`
    );

    const kpiData = {
      tong_doanh_thu: kpiResult.rows[0].tong_doanh_thu,
      tong_don_hang:  kpiResult.rows[0].tong_don_hang,
      tong_khach_hang: customerResult.rows[0].tong_khach_hang
    };

    // 2. Biểu đồ doanh thu động (Ngày, Tháng, Năm)
    const filterType = req.query.type || 'month';
    let chartQuery = '';

    if (filterType === 'date') {
      chartQuery = `
        WITH date_range AS (
          SELECT TRUNC(SYSDATE) - LEVEL + 1 AS NGAY
          FROM DUAL
          CONNECT BY LEVEL <= 7
        )
        SELECT 
          TO_CHAR(dr.NGAY, 'DD/MM') AS BIEU_DIEN,
          dr.NGAY AS SORT_KEY,
          NVL(SUM(dh.TONGTIEN), 0) AS DOANH_THU
        FROM date_range dr
        LEFT JOIN DON_HANG dh ON TRUNC(dh.NGAYTAO) = dr.NGAY AND dh.TRANGTHAI = 'HoanThanh'
        GROUP BY dr.NGAY
        ORDER BY dr.NGAY ASC
      `;
    } else if (filterType === 'year') {
      chartQuery = `
        WITH year_range AS (
          SELECT ADD_MONTHS(TRUNC(SYSDATE, 'YYYY'), - (LEVEL - 1) * 12) AS NAM
          FROM DUAL
          CONNECT BY LEVEL <= 5
        )
        SELECT 
          TO_CHAR(nam.NAM, 'YYYY') AS BIEU_DIEN,
          nam.NAM AS SORT_KEY,
          NVL(SUM(dh.TONGTIEN), 0) AS DOANH_THU
        FROM year_range nam
        LEFT JOIN DON_HANG dh ON TRUNC(dh.NGAYTAO, 'YYYY') = nam.NAM AND dh.TRANGTHAI = 'HoanThanh'
        GROUP BY nam.NAM
        ORDER BY nam.NAM ASC
      `;
    } else {
      // Mặc định: month (6 tháng gần nhất)
      chartQuery = `
        WITH month_range AS (
          SELECT ADD_MONTHS(TRUNC(SYSDATE, 'MM'), - LEVEL + 1) AS THANG
          FROM DUAL
          CONNECT BY LEVEL <= 6
        )
        SELECT 
          TO_CHAR(mr.THANG, 'MM/YYYY') AS BIEU_DIEN,
          mr.THANG AS SORT_KEY,
          NVL(SUM(dh.TONGTIEN), 0) AS DOANH_THU
        FROM month_range mr
        LEFT JOIN DON_HANG dh ON TRUNC(dh.NGAYTAO, 'MM') = mr.THANG AND dh.TRANGTHAI = 'HoanThanh'
        GROUP BY mr.THANG
        ORDER BY mr.THANG ASC
      `;
    }

    const chartResult = await db.query(chartQuery);
    const chartData = chartResult.rows.map(row => ({
      name: filterType === 'month' ? `Tháng ${row.bieu_dien}` : row.bieu_dien,
      revenue: Number(row.doanh_thu)
    }));

    // 3. Sản phẩm sắp hết hàng (< 5)
    const lowStockQuery = `
      SELECT s.MASANPHAM, s.TENSANPHAM, s.DONVITINH, t.SOLUONGTON
      FROM SAN_PHAM s
      JOIN TON_KHO t ON s.MASANPHAM = t.MASANPHAM
      WHERE t.SOLUONGTON < 5 AND s.COTHEBAN = 1
      ORDER BY t.SOLUONGTON ASC
    `;
    const lowStockResult = await db.query(lowStockQuery);

    // 4. Top 5 sản phẩm bán chạy — CHI_TIET_DON_HANG
    const topProductsQuery = `
      SELECT
        s.MASANPHAM,
        s.TENSANPHAM,
        SUM(c.SOLUONG) as TONG_BAN,
        SUM(c.THANHTIEN) as DOANH_THU_SP
      FROM CHI_TIET_DON_HANG c
      JOIN SAN_PHAM s ON c.MASANPHAM = s.MASANPHAM
      JOIN DON_HANG dh ON c.MADONHANG = dh.MADONHANG
      WHERE dh.TRANGTHAI = 'HoanThanh'
      GROUP BY s.MASANPHAM, s.TENSANPHAM
      ORDER BY DOANH_THU_SP DESC
      FETCH FIRST 5 ROWS ONLY
    `;
    const topProductsResult = await db.query(topProductsQuery);

    // 5. Đơn hàng gần nhất — DON_HANG, NGAYTAO
    const recentOrdersQuery = `
      SELECT
        dh.MADONHANG,
        NVL(dt.TENDOITAC, 'Khách vãng lai') as TEN_KHACH_HANG,
        dh.TONGTIEN,
        dh.TRANGTHAI,
        dh.NGAYTAO
      FROM DON_HANG dh
      LEFT JOIN DOI_TAC dt ON dh.MADOITAC = dt.MADOITAC
      ORDER BY dh.NGAYTAO DESC
      FETCH FIRST 5 ROWS ONLY
    `;
    const recentOrdersResult = await db.query(recentOrdersQuery);

    res.json({
      kpi: kpiData,
      chartData,
      notifications: lowStockResult.rows,
      topProducts: topProductsResult.rows,
      recentOrders: recentOrdersResult.rows
    });
  } catch (error) {
    console.error('Lỗi lấy dữ liệu Dashboard:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tải Dashboard' });
  }
};