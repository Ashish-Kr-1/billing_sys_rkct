import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function resetPassword() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        const hash = await bcrypt.hash('password123', 10);
        await connection.execute('UPDATE users SET password_hash = ? WHERE username = ?', [hash, 'Kumar']);
        console.log('Password updated for Kumar to password123');

    } catch (error) {
        console.error('Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

resetPassword();
