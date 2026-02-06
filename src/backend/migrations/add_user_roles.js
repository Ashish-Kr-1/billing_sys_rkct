import { dbManager } from '../db.js';

async function addUserRoles() {
    console.log('🔄 Adding role and created_by columns to users table...');

    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
        console.log(`\n📊 Updating Company ${companyId}...`);

        try {
            const client = await dbManager.getPool(companyId).getConnection();

            try {
                // Add role column (default to 'user')
                await client.query(`
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
                `).catch(err => {
                    if (!err.message.includes('Duplicate column')) {
                        throw err;
                    }
                    console.log('   ℹ️  role column already exists');
                });

                // Add created_by column
                await client.query(`
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS created_by INT NULL
                `).catch(err => {
                    if (!err.message.includes('Duplicate column')) {
                        throw err;
                    }
                    console.log('   ℹ️  created_by column already exists');
                });

                // Set first user as admin (if exists)
                const [users] = await client.query('SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1');
                if (users.length > 0) {
                    await client.query('UPDATE users SET role = ? WHERE user_id = ?', ['admin', users[0].user_id]);
                    console.log(`   ✅ Set user ${users[0].user_id} as admin`);
                }

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

addUserRoles();
