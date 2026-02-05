import { dbManager } from './db.js';

async function testCompanyConfig() {
    try {
        console.log('Testing company config endpoint simulation...\n');

        for (let companyId of [1, 2, 3]) {
            console.log(`\n=== Testing Company ${companyId} ===`);

            const company = dbManager.getCompanyInfo(companyId);
            console.log('Company Info:', company);

            // Fetch from existing companies table
            const companies = await dbManager.query(
                companyId,
                'SELECT * FROM companies LIMIT 1'
            );

            if (companies && companies.length > 0) {
                const companyData = companies[0];

                const config = {
                    company_id: companyId,
                    company_name: companyData.name || company.name,
                    company_short_name: company.shortName,
                    gstin: companyData.gstin || '',
                    cin_no: companyData.cinNo || '',
                    company_address: companyData.address || '',
                    state: companyData.state || '',
                    state_code: companyData.state_code || '',
                    mobile_no: companyData.mobile_no || '',
                    email: companyData.email_id || '',
                    contact_person: companyData.contact_person || ''
                };

                console.log('Config:', JSON.stringify(config, null, 2));
            } else {
                console.log('❌ No company data found');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

testCompanyConfig();
