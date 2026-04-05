const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Monitor (v9.0)
app.use((req, res, next) => {
    // Hidden monitoring for cleaner logs but accessible if needed
    next();
});

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true }
};

// --- API ENDPOINTS ---

app.get('/api/users', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Users');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
    const { id, username, password, name, email, whatsapp, selfie, role } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.NVarChar, id).input('username', sql.NVarChar, username).input('password', sql.NVarChar, password)
            .input('name', sql.NVarChar, name).input('email', sql.NVarChar, email).input('whatsapp', sql.NVarChar, whatsapp)
            .input('selfie', sql.NVarChar(sql.MAX), selfie).input('role', sql.NVarChar, role)
            .query('INSERT INTO Users (id, username, password, name, email, whatsapp, selfie, role) VALUES (@id, @username, @password, @name, @email, @whatsapp, @selfie, @role)');
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CRITICAL: Permanent User Deletion (v9.0)
app.all(['/api/users/delete/:id', '/api/users/:id'], async (req, res) => {
    if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).send('Use POST');
    try {
        const { id } = req.params;
        const pool = await sql.connect(dbConfig);
        const t = new sql.Transaction(pool);
        await t.begin();
        try {
            await t.request().input('id', sql.NVarChar, id).query('DELETE FROM Messages WHERE [from] = @id OR [to] = @id');
            await t.request().input('id', sql.NVarChar, id).query('DELETE FROM Bookings WHERE customerId = @id');
            await t.request().input('id', sql.NVarChar, id).query('DELETE FROM Users WHERE id = @id');
            await t.commit();
            res.json({ success: true });
        } catch (e) { await t.rollback(); throw e; }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CRITICAL: Permanent Booking/Alert Deletion (v9.0 - Using POST for network safety)
app.all(['/api/bookings/delete/:id', '/api/bookings/:id'], async (req, res) => {
    if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).send('Use POST');
    try {
        const { id } = req.params;
        console.log(`🗑️ PERMANENTLY REMOVING BOOKING: [${id}]`);
        const pool = await sql.connect(dbConfig);
        await pool.request().input('id', sql.NVarChar, id).query('DELETE FROM Bookings WHERE id = @id');
        res.json({ success: true, message: 'Purged' });
    } catch (err) {
        console.error('❌ Booking Deletion Fail:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/cars', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Cars');
        const clean = result.recordset.map(c => ({ ...c, availableDates: JSON.parse(c.availableDates || '[]') }));
        res.json(clean);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cars', async (req, res) => {
    const { id, brand, model, description, pricePerDay, image, availableDates } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.NVarChar, id).input('brand', sql.NVarChar, brand).input('model', sql.NVarChar, model)
            .input('description', sql.NVarChar, description || '').input('pricePerDay', sql.Int, pricePerDay)
            .input('image', sql.NVarChar(sql.MAX), image).input('availableDates', sql.NVarChar(sql.MAX), JSON.stringify(availableDates || []))
            .query('INSERT INTO Cars (id, brand, model, description, pricePerDay, image, availableDates) VALUES (@id, @brand, @model, @description, @pricePerDay, @image, @availableDates)');
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Bookings');
        const clean = result.recordset.map(b => ({ ...b, date: JSON.parse(b.date || '[]') }));
        res.json(clean);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { id, carId, customerId, customerName, date, idPhoto, status, extraCharge, seen, adminSeen, cancelReason, custCancelReason } = req.body;
        await pool.request()
            .input('id', sql.NVarChar, id).input('carId', sql.NVarChar, carId).input('customerId', sql.NVarChar, customerId).input('customerName', sql.NVarChar, customerName)
            .input('date', sql.NVarChar(sql.MAX), JSON.stringify(date)).input('idPhoto', sql.NVarChar(sql.MAX), idPhoto).input('status', sql.NVarChar, status)
            .input('extraCharge', sql.Int, extraCharge).input('seen', sql.Bit, seen ? 1 : 0).input('adminSeen', sql.Bit, adminSeen ? 1 : 0)
            .input('cancelReason', sql.NVarChar, cancelReason).input('custCancelReason', sql.NVarChar, custCancelReason)
            .query('INSERT INTO Bookings (id, carId, customerId, customerName, date, idPhoto, status, extraCharge, seen, adminSeen, cancelReason, custCancelReason) VALUES (@id, @carId, @customerId, @customerName, @date, @idPhoto, @status, @extraCharge, @seen, @adminSeen, @cancelReason, @custCancelReason)');
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { id } = req.params;
        const { status, cancelReason, seen, adminSeen, custCancelReason } = req.body;
        await pool.request()
            .input('id', sql.NVarChar, id).input('status', sql.NVarChar, status).input('cancelReason', sql.NVarChar, cancelReason)
            .input('seen', sql.Bit, seen ? 1 : 0).input('adminSeen', sql.Bit, adminSeen ? 1 : 0).input('custCancelReason', sql.NVarChar, custCancelReason)
            .query('UPDATE Bookings SET status = @status, cancelReason = @cancelReason, seen = @seen, adminSeen = @adminSeen, custCancelReason = @custCancelReason WHERE id = @id');
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Messages ORDER BY id');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/messages', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { id, from, to, text, image, seen } = req.body;
        await pool.request()
            .input('id', sql.NVarChar, id).input('from', sql.NVarChar, from).input('to', sql.NVarChar, to)
            .input('text', sql.NVarChar(sql.MAX), text).input('image', sql.NVarChar(sql.MAX), image).input('seen', sql.Bit, seen ? 1 : 0)
            .query('INSERT INTO Messages (id, [from], [to], text, image, seen) VALUES (@id, @from, @to, @text, @image, @seen)');
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.all(['/api/messages/seen/:toId'], async (req, res) => {
    if (req.method !== 'PATCH' && req.method !== 'PUT') return res.status(405).send('Use PATCH/PUT');
    try {
        const pool = await sql.connect(dbConfig);
        const { toId } = req.params;
        await pool.request()
            .input('toId', sql.NVarChar, toId)
            .query('UPDATE Messages SET seen = 1 WHERE [to] = @toId');
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

async function start() {
    try {
        console.log('⏳ Connecting to Database...');
        await sql.connect(dbConfig);
        console.log('✅ Connected to MSSQL Database');
        app.listen(port, '0.0.0.0', () => {
            console.log(`📡 Ready Cabs API v9.0 ACTIVE at http://127.0.0.1:${port}`);
        });
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        setTimeout(start, 5000);
    }
}
start();
