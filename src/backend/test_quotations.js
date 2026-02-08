import { dbManager } from './db.js';

async function checkAllQuotations() {
    try {
        for (let i = 1; i <= 3; i++) {
            console.log(`\n\n=== Checking Company ${i} ===`);
            try {
                const pool = dbManager.getPool(i);

                // Check if 'quotations' table exists and has data
                const [rows] = await pool.query('SELECT quotation_no, quotation_date, status, total_amount FROM quotations ORDER BY created_at DESC LIMIT 5');
                console.log(`Found ${rows.length} quotations in 'quotations' table:`);
                if (rows.length > 0) console.log(rows);

                // Also check if they are stored in transactions with type 'QUOTATION'
                const [tx] = await pool.query("SELECT * FROM transactions WHERE transaction_type = 'QUOTATION' LIMIT 5");
                console.log(`Found ${tx.length} transactions with type 'QUOTATION':`);
                if (tx.length > 0) console.log(tx);

            } catch (err) {
                console.log(`Error checking Company ${i}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await dbManager.closeAllPools();
    }
}

checkAllQuotations();
