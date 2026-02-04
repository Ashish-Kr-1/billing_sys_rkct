
import { dbManager } from './db.js';

async function verifyAnalytics(companyId) {
    console.log(`\nVerifying analytics for Company ${companyId}...`);
    try {
        const pool = dbManager.getPool(companyId);

        // 1. Transactions - Basic Check
        console.log("Checking 'transactions' table...");
        const [txn] = await pool.query('SELECT count(*) as count FROM transactions');
        console.log(`✅ 'transactions' table OK (Rows: ${txn[0].count})`);

        // 2. Sell Summary - JOIN Check
        console.log("Checking 'sell_summary' JOIN with 'items'...");
        try {
            const [rows] = await pool.query(`
                SELECT ss.invoice_no, i.item_name 
                FROM sell_summary ss
                JOIN items i ON ss.item_id = i.item_id
                LIMIT 5
            `);
            console.log(`✅ 'sell_summary' JOIN successful (Returned ${rows.length} rows)`);
        } catch (e) {
            console.error(`❌ 'sell_summary' JOIN failed: ${e.message}`);
        }

        console.log("✅ Analytics verification complete.");
    } catch (error) {
        console.error(`❌ Error verifying analytics for Company ${companyId}:`, error.message);
    }
}

async function main() {
    try {
        await verifyAnalytics(1);
        setTimeout(async () => {
            await dbManager.closeAllPools();
            process.exit(0);
        }, 1000);
    } catch (err) {
        console.error("Main error:", err);
        process.exit(1);
    }
}

main();
