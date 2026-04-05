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
        console.log('Connecting to MSSQL...');
        await sql.connect(config);
        console.log('Connected! Fetching Users...');
        const res = await sql.query('SELECT * FROM Users');
        console.log('Users in Database:', res.recordset.length);
        res.recordset.forEach(u => console.log(`- ${u.username} (${u.role})`));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}
test();
