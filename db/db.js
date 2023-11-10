const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: true
});

async function setupDatabase() {
    try {
        const connection = await pool.getConnection();
        const sqlScript = fs.readFileSync(path.join(__dirname, 'db.sql'), 'utf8');
        await connection.query(sqlScript);
        connection.release();
        console.log('Database setup completed');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

setupDatabase();

module.exports = pool;