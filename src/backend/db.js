import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: "./.env" })

const pool = mysql.createPool({
    host: process.env.DB_HOST, // Hostinger DB Host
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    rowsAsRows: true, // Optimizes return
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log("Database connected successfully");
        conn.release();
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });

export default pool;

export async function query(text, params) {
    const [rows, fields] = await pool.query(text, params);
    return { rows };
};