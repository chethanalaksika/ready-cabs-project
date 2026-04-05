const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true }
};

async function test() {
    try {
        console.log('Connecting...');
        await sql.connect(config);
        console.log('Checking Users table...');
        const r1 = await sql.query('SELECT COUNT(*) as count FROM Users');
        console.log('Users count:', r1.recordset[0].count);
        
        console.log('Checking Cars table...');
        const r2 = await sql.query('SELECT COUNT(*) as count FROM Cars');
        console.log('Cars count:', r2.recordset[0].count);

        console.log('Checking Bookings table...');
        const r3 = await sql.query('SELECT COUNT(*) as count FROM Bookings');
        console.log('Bookings count:', r3.recordset[0].count);

        console.log('Checking Messages table...');
        const r4 = await sql.query('SELECT COUNT(*) as count FROM Messages');
        console.log('Messages count:', r4.recordset[0].count);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}
test();
