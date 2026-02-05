import { dbManager } from './db.js';

async function checkCompaniesTable() {
    try {
        console.log('Checking companies table in all databases...\n');

        for (let companyId of [1, 2, 3]) {
            console.log(`\n=== Company ${companyId} Database ===`);
            const rows = await dbManager.query(companyId, 'SELECT * FROM companies');
            console.log(JSON.stringify(rows, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkCompaniesTable();
