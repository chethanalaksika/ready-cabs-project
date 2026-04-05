const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
});

// --- API ENDPOINTS ---

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Users');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
    const { id, username, password, name, email, whatsapp, selfie, role } = req.body;
    try {
        await pool.query(
            'INSERT INTO Users (id, username, password, name, email, whatsapp, selfie, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, username, password, name, email, whatsapp, selfie, role]
        );
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CRITICAL: Permanent User Deletion (PG)
app.all(['/api/users/delete/:id', '/api/users/:id'], async (req, res) => {
    if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).send('Use POST');
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');
        await client.query('DELETE FROM Messages WHERE "from" = $1 OR "to" = $1', [id]);
        await client.query('DELETE FROM Bookings WHERE customerId = $1', [id]);
        await client.query('DELETE FROM Users WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) { 
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message }); 
    } finally {
        client.release();
    }
});

// CRITICAL: Permanent Booking Deletion
app.all(['/api/bookings/delete/:id'], async (req, res) => {
    if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).send('Use POST');
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Bookings WHERE id = $1', [id]);
        res.json({ success: true, message: 'Purged' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRITICAL: Permanent Car Deletion
app.post('/api/cars/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Cars WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/cars', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Cars');
        // PG returns lowercased columns without quotes, normalize for frontend compatibility
        const clean = result.rows.map(c => {
           const parsedDates = JSON.parse(c.availabledates || c.availableDates || '[]');
           return { id: c.id, brand: c.brand, model: c.model, description: c.description, pricePerDay: c.priceperday || c.pricePerDay, image: c.image, availableDates: parsedDates };
        });
        res.json(clean);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cars', async (req, res) => {
    const { id, brand, model, description, pricePerDay, image, availableDates } = req.body;
    try {
        await pool.query(
            'INSERT INTO Cars (id, brand, model, description, pricePerDay, image, availableDates) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, brand, model, description || '', pricePerDay, image, JSON.stringify(availableDates || [])]
        );
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/api/cars/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { brand, model, description, pricePerDay, image, availableDates } = req.body;
        await pool.query(
            'UPDATE Cars SET brand = $1, model = $2, description = $3, pricePerDay = $4, image = $5, availableDates = $6 WHERE id = $7',
            [brand, model, description || '', pricePerDay, image, JSON.stringify(availableDates || []), id]
        );
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Bookings');
        const clean = result.rows.map(b => {
           return {
              id: b.id, carId: b.carid || b.carId, customerId: b.customerid || b.customerId, customerName: b.customername || b.customerName,
              date: JSON.parse(b.date || '[]'), idPhoto: b.idphoto || b.idPhoto, status: b.status, extraCharge: b.extracharge || b.extraCharge,
              seen: b.seen, adminSeen: b.adminseen || b.adminSeen, cancelReason: b.cancelreason || b.cancelReason, custCancelReason: b.custcancelreason || b.custCancelReason
           }
        });
        res.json(clean);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { id, carId, customerId, customerName, date, idPhoto, status, extraCharge, seen, adminSeen, cancelReason, custCancelReason } = req.body;
        await pool.query(
            'INSERT INTO Bookings (id, carId, customerId, customerName, date, idPhoto, status, extraCharge, seen, adminSeen, cancelReason, custCancelReason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [id, carId, customerId, customerName, JSON.stringify(date), idPhoto, status, extraCharge, seen ? true : false, adminSeen ? true : false, cancelReason, custCancelReason]
        );
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelReason, seen, adminSeen, custCancelReason } = req.body;
        await pool.query(
            'UPDATE Bookings SET status = $1, cancelReason = $2, seen = $3, adminSeen = $4, custCancelReason = $5 WHERE id = $6',
            [status, cancelReason, seen ? true : false, adminSeen ? true : false, custCancelReason, id]
        );
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Messages ORDER BY id');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { id, from, to, text, image, seen } = req.body;
        await pool.query(
            'INSERT INTO Messages (id, "from", "to", text, image, seen) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, from, to, text, image, seen ? true : false]
        );
        res.status(201).json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.all(['/api/messages/seen/:toId'], async (req, res) => {
    if (req.method !== 'PATCH' && req.method !== 'PUT') return res.status(405).send('Use PATCH/PUT');
    try {
        const { toId } = req.params;
        await pool.query('UPDATE Messages SET seen = true WHERE "to" = $1', [toId]);
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const serverless = require('serverless-http');

async function start() {
    try {
        console.log('⏳ Connecting to Supabase PostgreSQL Database...');
        await pool.query('SELECT 1'); // Test Connection
        console.log('✅ Connected to Postgres');
        if (process.env.NODE_ENV !== 'production') {
            app.listen(port, '0.0.0.0', () => {
                console.log(`📡 API ACTIVE at http://127.0.0.1:${port}`);
            });
        }
    } catch (err) {
        console.error('❌ Database Initialization Error:', err.message);
        if (process.env.NODE_ENV !== 'production') setTimeout(start, 5000);
    }
}
start();

// Export for external API Serverless wrappers
module.exports = app;
