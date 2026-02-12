
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_CONFIGS } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MIGRATIONS = [
    {
        table: 'sell_summary',
        column: 'item_name',
        query: "ALTER TABLE sell_summary ADD COLUMN item_name VARCHAR(255) DEFAULT NULL"
    },
    {
        table: 'sell_summary',
        column: 'hsn_code',
        query: "ALTER TABLE sell_summary ADD COLUMN hsn_code VARCHAR(50) DEFAULT NULL"
    },
    {
        table: 'sell_summary',
        column: 'unit_price',
        query: "ALTER TABLE sell_summary ADD COLUMN unit_price DECIMAL(10,2) DEFAULT NULL"
    }
];

(async () => {
    console.log('🚀 Starting Database Migration for Data Decoupling...');

    for (const [companyId, config] of Object.entries(DB_CONFIGS)) {
        console.log(`\n🏢 Processing Company ${companyId}: ${config.database}...`);

        let connection;
        try {
            connection = await mysql.createConnection({
                host: config.host,
                user: config.user,
                password: config.password,
                database: config.database
            });

            for (const migration of MIGRATIONS) {
                // Check if column exists
                const [columns] = await connection.query(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
                `, [config.database, migration.table, migration.column]);

                if (columns.length > 0) {
                    console.log(`  ✓ Column '${migration.table}.${migration.column}' already exists.`);
                } else {
                    await connection.query(migration.query);
                    console.log(`  ✅ Added column '${migration.table}.${migration.column}'.`);
                }
            }

        } catch (error) {
            console.error(`  ❌ Error processing Company ${companyId}:`, error.message);
        } finally {
            if (connection) await connection.end();
        }
    }

    console.log('\n✨ Migration complete.');
    process.exit(0);
})();
