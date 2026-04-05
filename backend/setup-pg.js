const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    try {
        console.log('Connecting to Supabase...');
        await client.connect();
        const sql = fs.readFileSync('schema.sql', 'utf8');
        console.log('Executing Schema...');
        await client.query(sql);
        console.log('✅ Supabase PostgreSQL Database Initialized Successfully!');
    } catch (e) {
        console.error('❌ Setup Failed:', e.message);
    } finally {
        await client.end();
    }
}
setup();
