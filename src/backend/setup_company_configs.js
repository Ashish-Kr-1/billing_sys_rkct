import { dbManager } from './db.js';

/**
 * Setup company configurations for all 3 companies
 * This script creates the company_configs table and populates initial data
 */

async function setupCompanyConfigs() {
    console.log('🚀 Setting up company configurations...\n');

    const companies = [
        {
            id: 1,
            name: 'RK Casting and Engineering Works',
            shortName: 'RK Casting'
        },
        {
            id: 2,
            name: 'RKCASTING ENGINEERING PVT. LTD.',
            shortName: 'RK Engineering'
        },
        {
            id: 3,
            name: 'Global Bharat',
            shortName: 'Global Bharat'
        }
    ];

    for (const company of companies) {
        try {
            console.log(`📊 Setting up ${company.name}...`);
            const pool = dbManager.getPool(company.id);

            // Create company_configs table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS company_configs (
                    config_id INT AUTO_INCREMENT PRIMARY KEY,
                    company_id INT NOT NULL UNIQUE,
                    company_name VARCHAR(255) NOT NULL,
                    company_short_name VARCHAR(100),
                    
                    -- Company Legal Details
                    gstin VARCHAR(20),
                    trade_license_no VARCHAR(50),
                    
                    -- Address Details
                    company_address TEXT,
                    pin_code VARCHAR(10),
                    state VARCHAR(50),
                    
                    -- Contact Details
                    mobile_no VARCHAR(20),
                    email VARCHAR(100),
                    
                    -- Bank Details
                    account_name VARCHAR(255),
                    account_no VARCHAR(50),
                    ifsc_code VARCHAR(20),
                    bank_name VARCHAR(100),
                    branch VARCHAR(100),
                    branch_code VARCHAR(20),
                    
                    -- Invoice Settings
                    invoice_prefix VARCHAR(20) DEFAULT 'INV',
                    financial_year VARCHAR(20) DEFAULT '2025-26',
                    
                    -- Company Branding
                    logo_url VARCHAR(500),
                    primary_color VARCHAR(10) DEFAULT '#1e293b',
                    secondary_color VARCHAR(10) DEFAULT '#10b981',
                    
                    -- Metadata
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    INDEX idx_company_id (company_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log(`✅ Created company_configs table for ${company.name}`);

            // Insert default configuration based on company ID
            let config;
            if (company.id === 1) {
                config = {
                    company_id: 1,
                    company_name: 'M/S R.K Casting & Engineering Works',
                    company_short_name: 'RK Casting',
                    gstin: '20DAMPK8203A1ZB',
                    trade_license_no: 'SEA2135400243601',
                    company_address: 'Plot No. 125, Khata No.19, Rakuwa No. 05, Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN : 828129',
                    pin_code: '828129',
                    state: 'Jharkhand',
                    mobile_no: '+91 6204583192',
                    email: 'rkcastingmoonidih@gmail.com',
                    account_name: 'R.K CASTING AND ENGINEERING WORKS',
                    account_no: '08710210000724',
                    ifsc_code: 'UCBA0000871',
                    bank_name: 'UCO Bank',
                    branch: 'Moonidih',
                    branch_code: '0871',
                    invoice_prefix: 'RKCT',
                    financial_year: '2025-26',
                    primary_color: '#1e293b',
                    secondary_color: '#10b981'
                };
            } else if (company.id === 2) {
                config = {
                    company_id: 2,
                    company_name: 'RKCASTING ENGINEERING PVT. LTD.',
                    company_short_name: 'RK Engineering',
                    gstin: '', // To be filled
                    trade_license_no: '',
                    company_address: '', // To be filled with actual address
                    pin_code: '',
                    state: '',
                    mobile_no: '',
                    email: '',
                    account_name: '',
                    account_no: '',
                    ifsc_code: '',
                    bank_name: '',
                    branch: '',
                    branch_code: '',
                    invoice_prefix: 'RKEP',
                    financial_year: '2025-26',
                    primary_color: '#0f172a',
                    secondary_color: '#3b82f6'
                };
            } else if (company.id === 3) {
                config = {
                    company_id: 3,
                    company_name: 'Global Bharat',
                    company_short_name: 'Global Bharat',
                    gstin: '', // To be filled
                    trade_license_no: '',
                    company_address: '', // To be filled with actual address
                    pin_code: '',
                    state: '',
                    mobile_no: '',
                    email: '',
                    account_name: '',
                    account_no: '',
                    ifsc_code: '',
                    bank_name: '',
                    branch: '',
                    branch_code: '',
                    invoice_prefix: 'GBH',
                    financial_year: '2025-26',
                    primary_color: '#312e81',
                    secondary_color: '#a855f7'
                };
            }

            // Insert or update configuration
            await pool.query(`
                INSERT INTO company_configs (
                    company_id, company_name, company_short_name, gstin, trade_license_no,
                    company_address, pin_code, state, mobile_no, email,
                    account_name, account_no, ifsc_code, bank_name, branch, branch_code,
                    invoice_prefix, financial_year, primary_color, secondary_color
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    company_name = VALUES(company_name),
                    company_short_name = VALUES(company_short_name),
                    updated_at = CURRENT_TIMESTAMP
            `, [
                config.company_id, config.company_name, config.company_short_name,
                config.gstin, config.trade_license_no, config.company_address,
                config.pin_code, config.state, config.mobile_no, config.email,
                config.account_name, config.account_no, config.ifsc_code,
                config.bank_name, config.branch, config.branch_code,
                config.invoice_prefix, config.financial_year,
                config.primary_color, config.secondary_color
            ]);

            console.log(`✅ Inserted configuration for ${company.name}\n`);

        } catch (error) {
            console.error(`❌ Error setting up ${company.name}:`, error.message);
        }
    }

    console.log('✨ Company configurations setup completed!');
    process.exit(0);
}

// Run the setup
setupCompanyConfigs().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
