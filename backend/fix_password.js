const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function fixPasswords() {
  await db.initialize();
  const hash = await bcrypt.hash('123456', 10);
  console.log('Generated bcrypt hash for "123456":', hash);
  
  await db.query(
    'UPDATE TAI_KHOAN_NHAN_VIEN SET PASSWORDHASH = $1',
    [hash]
  );
  console.log('All account passwords updated to "123456"');
  
  // Verify
  const result = await db.query('SELECT USERNAME, PASSWORDHASH FROM TAI_KHOAN_NHAN_VIEN');
  for (const row of result.rows) {
    const match = await bcrypt.compare('123456', row.passwordhash);
    console.log(`  ${row.username}: password match = ${match}`);
  }
  
  await db.close();
  process.exit(0);
}

fixPasswords().catch(err => { console.error(err); process.exit(1); });
