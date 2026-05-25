const db = require('./src/config/db');

async function run() {
  try {
    await db.initialize();
    const conn = await db.getConnection();
    try {
      console.log('=== CONSTRAINT DETAILS ===');
      const res = await conn.execute(
        `SELECT a.CONSTRAINT_NAME, a.CONSTRAINT_TYPE, b.COLUMN_NAME 
         FROM USER_CONSTRAINTS a
         JOIN USER_CONS_COLUMNS b ON a.CONSTRAINT_NAME = b.CONSTRAINT_NAME
         WHERE a.TABLE_NAME = 'DON_HANG'`,
        [],
        { outFormat: 4002 }
      );
      console.log(res.rows);
    } finally {
      await conn.close();
    }
  } catch (err) {
    console.error(err);
  } finally {
    await db.close();
  }
}
run();
