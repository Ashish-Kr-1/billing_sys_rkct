import { dbManager } from '../db.js';

async function addUserSectionAccess() {
    console.log('🔄 Creating user_section_access table...');

    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
        console.log(`\n📊 Updating Company ${companyId}...`);

        try {
            const client = await dbManager.getPool(companyId).getConnection();

            try {
                // Create user_section_access table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS user_section_access (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        section_name VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_by INT NULL,
                        UNIQUE KEY unique_user_section (user_id, section_name),
                        INDEX idx_user_id (user_id)
                    )
                `);

                console.log(`   ✅ user_section_access table created/verified`);

                // Grant all existing users access to all sections by default
                // Only do this for Company 1 where the users table exists
                if (companyId === 1) {
                    const sections = ['invoice', 'analytics', 'ledger', 'quotation'];

                    for (const section of sections) {
                        await client.query(`
                            INSERT IGNORE INTO user_section_access (user_id, section_name)
                            SELECT user_id, ? FROM users
                        `, [section]);
                    }

                    console.log(`   ✅ Granted existing users access to all sections`);
                }

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

addUserSectionAccess();
