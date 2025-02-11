const pgp = require('pg-promise')();
require('dotenv').config();

// Database Connection Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inventory_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
};

// for debugging purposes
// console.log('Database config:', { ...dbConfig, password: process.env.DB_PASSWORD });

// Database Instance
const db = pgp(dbConfig);

// Test DB Connection
async function testConnection() {
    try {
        const dbVersion = await db.one('SELECT VERSION()');
        console.log('Database connected successfully:', dbVersion.version);
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

module.exports = {
    db,
    testConnection
};