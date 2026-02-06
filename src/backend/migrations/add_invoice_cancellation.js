import { dbManager } from '../db.js';

async function addInvoiceCancellationColumns() {
    console.log('🔄 Adding invoice cancellation columns...');

    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
        console.log(`\n📊 Updating Company ${companyId}...`);

        try {
            const client = await dbManager.getPool(companyId).getConnection();

            try {
                // Add status column (default to 'active')
                await client.query(`
                    ALTER TABLE transactions 
                    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
                `).catch(err => {
                    if (!err.message.includes('Duplicate column')) {
                        throw err;
                    }
                    console.log('   ℹ️  status column already exists');
                });

                // Add cancelled_at column
                await client.query(`
                    ALTER TABLE transactions 
                    ADD COLUMN IF NOT EXISTS cancelled_at DATETIME NULL
                `).catch(err => {
                    if (!err.message.includes('Duplicate column')) {
                        throw err;
                    }
                    console.log('   ℹ️  cancelled_at column already exists');
                });

                // Add cancelled_by column
                await client.query(`
                    ALTER TABLE transactions 
                    ADD COLUMN IF NOT EXISTS cancelled_by INT NULL
                `).catch(err => {
                    if (!err.message.includes('Duplicate column')) {
                        throw err;
                    }
                    console.log('   ℹ️  cancelled_by column already exists');
                });

                console.log(`   ✅ Company ${companyId} updated successfully`);

            } finally {
                client.release();
            }

        } catch (err) {
            console.error(`   ❌ Error for Company ${companyId}:`, err.message);
        }
    }

    console.log('\n✨ Migration complete!');
    process.exit(0);
}

addInvoiceCancellationColumns();
