const oracledb = require('oracledb');
require('dotenv').config();

// Trả về rows dạng object (giống pg) thay vì mảng
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// Đọc CLOB dạng string (quan trọng cho cột QUYENHAN lưu JSON)
oracledb.fetchAsString = [oracledb.CLOB];

let pool;

// Khởi tạo connection pool — phải gọi trước khi dùng query
async function initialize() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });
    console.log('Đã kết nối thành công tới Database Oracle!');
  } catch (err) {
    console.error('Lỗi kết nối Oracle:', err);
    process.exit(1);
  }
}

// Helper: chuyển key của row về lowercase (Oracle trả về UPPERCASE)
function lowercaseKeys(row) {
  if (!row) return row;
  const newRow = {};
  for (const [key, val] of Object.entries(row)) {
    newRow[key.toLowerCase()] = val;
  }
  return newRow;
}

// Hàm query chính — tương thích API cũ: db.query(sql, params) -> { rows: [...] }
// Tự động chuyển $1,$2 sang :1,:2
async function query(text, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Chuyển placeholder PostgreSQL ($1, $2...) sang Oracle (:1, :2...)
    const oracleSQL = text.replace(/\$(\d+)/g, ':$1');

    // Chuyển mảng params sang object binds cho oracledb
    const binds = {};
    params.forEach((val, i) => {
      binds[String(i + 1)] = (val === undefined || val === null) ? null : val;
    });

    const result = await connection.execute(oracleSQL, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    });

    // Xử lý outBinds (cho RETURNING ... INTO)
    if (result.outBinds) {
      const row = {};
      for (const [key, val] of Object.entries(result.outBinds)) {
        row[key] = Array.isArray(val) ? val[0] : val;
      }
      return { rows: [row], rowCount: result.rowsAffected };
    }

    // SELECT trả về rows
    if (result.rows) {
      return { rows: result.rows.map(lowercaseKeys), rowCount: result.rowsAffected };
    }

    return { rows: [], rowCount: result.rowsAffected };
  } finally {
    if (connection) await connection.close();
  }
}

// Lấy connection riêng cho transaction (BEGIN không cần trong Oracle)
// Trả về wrapper có .query(), .commit(), .rollback(), .close(), .execute()
async function getConnection() {
  const rawConn = await pool.getConnection();

  return {
    // query tương tự db.query nhưng dùng chung 1 connection (cho transaction)
    async query(text, params = []) {
      const oracleSQL = text.replace(/\$(\d+)/g, ':$1');
      const binds = {};
      params.forEach((val, i) => {
        binds[String(i + 1)] = (val === undefined || val === null) ? null : val;
      });

      const result = await rawConn.execute(oracleSQL, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false // KHÔNG auto commit trong transaction
      });

      if (result.outBinds) {
        const row = {};
        for (const [key, val] of Object.entries(result.outBinds)) {
          row[key] = Array.isArray(val) ? val[0] : val;
        }
        return { rows: [row], rowCount: result.rowsAffected };
      }

      if (result.rows) {
        return { rows: result.rows.map(lowercaseKeys), rowCount: result.rowsAffected };
      }

      return { rows: [], rowCount: result.rowsAffected };
    },

    // Raw execute cho các câu lệnh phức tạp (RETURNING INTO, MERGE, etc.)
    async execute(sql, binds, options = {}) {
      return rawConn.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false,
        ...options
      });
    },

    async commit() { await rawConn.commit(); },
    async rollback() { await rawConn.rollback(); },
    async close() { await rawConn.close(); }
  };
}

async function close() {
  if (pool) await pool.close(0);
}

// Export tương thích — giữ pool cho payrollController
module.exports = { query, getConnection, initialize, close, pool: { connect: getConnection } };