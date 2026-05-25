const oracledb = require('oracledb');
require('dotenv').config();

async function run() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER || 'PROJECT_IS_201',
      password: process.env.DB_PASSWORD || '123456',
      connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/orcl'
    });

    console.log('Connected to database.');

    const result = await connection.execute(
      `UPDATE NHANVIEN SET TRANGTHAI = 'Đang làm việc' WHERE MANHANVIEN = 1`,
      [],
      { autoCommit: true }
    );

    console.log('Successfully updated rows:', result.rowsAffected);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

run();
