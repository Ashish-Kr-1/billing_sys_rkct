import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configurations for all 3 companies
const DB_CONFIGS = {
    1: {
        host: process.env.DB_HOST || 'srv687.hstgr.io',
        user: 'u971268451_billing_system',
        password: process.env.DB_PASSWORD || 'RKbilling@123',
        database: 'u971268451_Billing_System',
    },
    2: {
        host: process.env.DB_HOST || 'srv687.hstgr.io',
        user: 'u971268451_global_billing',
        password: process.env.DB_PASSWORD || 'RKbilling@123',
        database: 'u971268451_GlobalBilling',
    },
    3: {
        host: process.env.DB_HOST || 'srv687.hstgr.io',
        user: 'u971268451_work_billing',
        password: process.env.DB_PASSWORD || 'RKbilling@123',
        database: 'u971268451_RkWorkBilling',
    }
};

const COMPANY_NAMES = {
    1: 'RK Casting and Engineering Works',
    2: 'RKCASTING ENGINEERING PVT. LTD.',
    3: 'Global Bharat'
};

async function setupAuthTables() {
    console.log('🚀 Setting up authentication tables for all companies...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'schema', 'auth_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    for (const [companyId, config] of Object.entries(DB_CONFIGS)) {
        try {
            console.log(`📊 Company ${companyId}: ${COMPANY_NAMES[companyId]}`);
            console.log(`   Database: ${config.database}`);

            const connection = await mysql.createConnection(config);

            // Split SQL by semicolons and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                await connection.query(statement);
            }

            await connection.end();

            console.log(`   ✅ Tables created successfully\n`);

        } catch (error) {
            console.error(`   ❌ Error for Company ${companyId}:`, error.message);
            console.error(`   Details:`, error);
            console.log('');
        }
    }

    console.log('✨ Setup complete!');
}

// Run the setup
setupAuthTables().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
