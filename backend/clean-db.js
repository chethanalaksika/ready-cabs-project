const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true }
};

async function clean() {
    try {
        console.log('Connecting to DB...');
        await sql.connect(config);
        console.log('Deleting test records where brand="Test" or brand="Test Brand"...');
        await sql.query("DELETE FROM Cars WHERE brand LIKE '%Test%' OR model LIKE '%Test%'");
        console.log('✅ Cleaned up test data!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}
clean();
