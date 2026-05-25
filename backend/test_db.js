const db = require('./src/config/db');
const oracledb = require('oracledb');

async function run() {
  try {
    await db.initialize();
    
    const conn = await db.getConnection();
    try {
      const insertDoiTac = await conn.execute(
        `INSERT INTO DOI_TAC (TENDOITAC, SODIENTHOAI, DIACHI, EMAIL, LOAIDOITAC)
         VALUES (:1, :2, :3, :4, 'KhachHang')
         RETURNING MADOITAC INTO :id`,
        {
          1: 'Test Khách hàng',
          2: '0987654321',
          3: '123 Test Street',
          4: 'test@gmail.com',
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      const newId = insertDoiTac.outBinds.id[0];
      console.log('Inserted DOI_TAC newId:', newId);

      const khRes = await conn.execute(
        `INSERT INTO KHACH_HANG (MADOITAC, DIEMTICHLUY, LOAIKHACHHANG) VALUES (:1, 0, 'Đồng')`,
        [newId]
      );
      console.log('Inserted KHACH_HANG success:', khRes);

      await conn.commit();
      console.log('Committed successfully!');
    } catch (err) {
      await conn.rollback();
      console.error('ERROR during transaction:', err);
    } finally {
      await conn.close();
    }
  } catch (err) {
    console.error('ERROR during initialization:', err);
  } finally {
    await db.close();
  }
}

run();
