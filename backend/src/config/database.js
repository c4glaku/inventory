const path = require('node:path');
const pgp = require('pg-promise')();
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const databaseConfig = process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'inventory_db',
    user: process.env.DB_USER || 'inventory_app',
    password: process.env.DB_PASSWORD,
    ...(process.env.DB_SSL === 'true'
        ? { ssl: { rejectUnauthorized: true } }
        : {}),
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
};

const db = pgp(databaseConfig);

async function testConnection() {
    try {
        await db.one('SELECT 1');
        return true;
    } catch {
        return false;
    }
}

async function closeDatabase() {
    await pgp.end();
}

module.exports = { db, testConnection, closeDatabase };
