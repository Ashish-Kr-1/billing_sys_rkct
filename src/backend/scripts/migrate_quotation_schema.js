
import { dbManager } from '../db.js';

const runMigration = async () => {
    console.log('🚀 Starting schema migration for Quotation Details...');

    const companies = dbManager.getAllCompanies();

    // Columns to add
    const columnsToAdd = [
        "ADD COLUMN validity_days INT NULL",
        "ADD COLUMN rfq_no VARCHAR(50) NULL",
        "ADD COLUMN rfq_date DATE NULL",
        "ADD COLUMN contact_person VARCHAR(100) NULL",
        "ADD COLUMN contact_no VARCHAR(50) NULL",
        "ADD COLUMN email VARCHAR(100) NULL"
    ];

    for (const company of companies) {
        console.log(`\n🔹 Processing Company ${company.id}: ${company.name}`);

        try {
            // Get connection to run raw queries
            const pool = dbManager.getPool(company.id);

            for (const colDef of columnsToAdd) {
                try {
                    const query = `ALTER TABLE quotation_details ${colDef}`;
                    console.log(`   Running: ${query}`);
                    await pool.query(query);
                    console.log(`   ✅ Success`);
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log(`   ⚠️ Column already exists (skipped)`);
                    } else {
                        console.error(`   ❌ Error adding column: ${err.message}`);
                    }
                }
            }

        } catch (err) {
            console.error(`❌ Fatal error for company ${company.id}:`, err);
        }
    }

    console.log('\n✅ Migration finished.');
    process.exit(0);
};

runMigration();
