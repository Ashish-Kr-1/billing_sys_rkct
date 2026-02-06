
import { dbManager } from './db.js';
import { setupQuotationTables } from './setup_quotation_tables.js';

async function resetTables() {
    console.log('⚠️  STARTING FORCE RESET OF QUOTATION TABLES...');

    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
        console.log(`\n🗑️  Dropping tables for Company ${companyId}...`);
        try {
            const client = await dbManager.getPool(companyId).getConnection();
            try {
                await client.query('SET FOREIGN_KEY_CHECKS = 0;');
                await client.query('DROP TABLE IF EXISTS quotation_items;');
                await client.query('DROP TABLE IF EXISTS quotation_details;');
                await client.query('DROP TABLE IF EXISTS quotations;');
                await client.query('SET FOREIGN_KEY_CHECKS = 1;');
                console.log('   Dropped.');
            } finally {
                client.release();
            }
        } catch (err) {
            console.error(`   Error dropping tables: ${err.message}`);
        }
    }

    console.log('\n🔄 Re-creating tables...');
    await setupQuotationTables();

    console.log('\n✅ Reset Complete. Exiting.');
    process.exit(0);
}

resetTables();
