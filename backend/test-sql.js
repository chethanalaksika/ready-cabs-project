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
        console.log('Inserting Test Car...');
        const req = new sql.Request();
        await req
            .input('id', sql.NVarChar, 'test-' + Date.now())
            .input('brand', sql.NVarChar, 'Test')
            .input('model', sql.NVarChar, 'Test')
            .input('description', sql.NVarChar, 'Desc')
            .input('pricePerDay', sql.Int, 1000)
            .input('image', sql.NVarChar(sql.MAX), 'img')
            .input('availableDates', sql.NVarChar(sql.MAX), '[]')
            .query('INSERT INTO Cars (id, brand, model, description, pricePerDay, image, availableDates) VALUES (@id, @brand, @model, @description, @pricePerDay, @image, @availableDates)');
        console.log('✅ Success!');
        process.exit(0);
    } catch (err) {
        console.error('❌ SQL ERROR:', err.message);
        process.exit(1);
    }
}
test();
