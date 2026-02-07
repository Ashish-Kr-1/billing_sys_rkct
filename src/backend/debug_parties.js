import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function checkParties() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        console.log('Connected!');

        const [columns] = await connection.execute('DESCRIBE parties');
        console.table(columns);

    } catch (error) {
        console.error('Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkParties();
