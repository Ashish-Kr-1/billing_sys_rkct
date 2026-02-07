import { dbManager } from '../db.js';

async function addCreatedByColumn() {
    console.log('🔄 Adding created_by column to user_company_access table...');

    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
        console.log(`\n📊 Updating Company ${companyId}...`);

        try {
            const client = await dbManager.getPool(companyId).getConnection();

            try {
                // Add created_by column if it doesn't exist
                await client.query(`
                    ALTER TABLE user_company_access 
                    ADD COLUMN created_by INT NULL
                `).catch(err => {
                    if (err.message.includes('Duplicate column')) {
                        console.log('   ℹ️  created_by column already exists');
                    } else {
                        throw err;
                    }
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

addCreatedByColumn();
