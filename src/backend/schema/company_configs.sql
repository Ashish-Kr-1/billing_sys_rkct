-- Company Configurations Table
-- This table stores company-specific details for invoice generation
-- Should be created in ALL company databases

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configurations for Company 1 (RK Casting and Engineering Works)
INSERT INTO company_configs (
    company_id, company_name, company_short_name, gstin, trade_license_no,
    company_address, mobile_no, email,
    account_name, account_no, ifsc_code, bank_name, branch, branch_code,
    invoice_prefix, financial_year,
    primary_color, secondary_color
) VALUES (
    1,
    'M/S R.K Casting & Engineering Works',
    'RK Casting',
    '20DAMPK8203A1ZB',
    'SEA2135400243601',
    'Plot No. 125, Khata No.19, Rakuwa No. 05, Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN : 828129',
    '+91 6204583192',
    'rkcastingmoonidih@gmail.com',
    'R.K CASTING AND ENGINEERING WORKS',
    '08710210000724',
    'UCBA0000871',
    'UCO Bank',
    'Moonidih',
    '0871',
    'RKCT',
    '2025-26',
    '#1e293b',
    '#10b981'
) ON DUPLICATE KEY UPDATE
    company_name = VALUES(company_name),
    updated_at = CURRENT_TIMESTAMP;

-- Note: Configurations for Company 2 and 3 should be added after gathering their details
-- Example placeholder for Company 2:
-- INSERT INTO company_configs (company_id, company_name, ...) VALUES (2, 'RKCASTING ENGINEERING PVT. LTD.', ...);
-- INSERT INTO company_configs (company_id, company_name, ...) VALUES (3, 'Global Bharat', ...);
