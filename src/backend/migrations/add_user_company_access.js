import { dbManager } from '../db.js';

async function addUserCompanyAccess() {
    console.log('🔄 Creating user_company_access table...');

    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
        console.log(`\n📊 Updating Company ${companyId}...`);

        try {
            const client = await dbManager.getPool(companyId).getConnection();

            try {
                // Create user_company_access table
                await client.query(`
                    CREATE TABLE IF NOT EXISTS user_company_access (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        company_id INT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_by INT NULL,
                        UNIQUE KEY unique_user_company (user_id, company_id),
                        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                    )
                `);

                console.log(`   ✅ user_company_access table created/verified`);

                // Grant all existing users access to their current company by default
                await client.query(`
                    INSERT IGNORE INTO user_company_access (user_id, company_id)
                    SELECT user_id, ? FROM users
                `, [companyId]);

                console.log(`   ✅ Granted existing users access to Company ${companyId}`);

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

addUserCompanyAccess();
