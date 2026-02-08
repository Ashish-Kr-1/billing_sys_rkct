
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_CONFIGS } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

(async () => {
    console.log('🔄 Adding is_deleted column to items table in all databases...');

    for (const [companyId, config] of Object.entries(DB_CONFIGS)) {
        console.log(`\n🏢 Processing Company ${companyId}...`);

        let connection;
        try {
            connection = await mysql.createConnection({
                host: config.host,
                user: config.user,
                password: config.password,
                database: config.database
            });

            // Check if column exists
            const [columns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'items' AND COLUMN_NAME = 'is_deleted'
            `, [config.database]);

            if (columns.length > 0) {
                console.log('⚠️ is_deleted column already exists.');
            } else {
                await connection.query(`
                    ALTER TABLE items 
                    ADD COLUMN is_deleted TINYINT(1) DEFAULT 0
                `);
                console.log('✅ is_deleted column added successfully.');
            }

        } catch (error) {
            console.error(`❌ Error processing Company ${companyId}:`, error.message);
        } finally {
            if (connection) await connection.end();
        }
    }

    console.log('\n✨ Migration complete.');
    process.exit(0);
})();
