import { dbManager } from '../db.js';

/**
 * Get all available companies with connection status
 */
export async function getAllCompanies(req, res) {
    try {
        const companies = dbManager.getAllCompanies();

        // Test connection for each company
        const companiesWithStatus = await Promise.all(
            companies.map(async (company) => {
                let connectionStatus = 'disconnected';
                let errorMessage = null;

                try {
                    const pool = dbManager.getPool(company.id);
                    await pool.query('SELECT 1');
                    connectionStatus = 'connected';
                } catch (error) {
                    connectionStatus = 'error';
                    errorMessage = error.message;

                    // Check if it's an IP whitelist issue
                    if (error.message.includes('Access denied')) {
                        errorMessage = 'Database access denied - IP not whitelisted';
                    }
                }

                return {
                    ...company,
                    connectionStatus,
                    errorMessage
                };
            })
        );

        return res.status(200).json({
            success: true,
            companies: companiesWithStatus
        });
    } catch (error) {
        console.error('Get companies error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get specific company details
 */
export async function getCompanyById(req, res) {
    try {
        const { companyId } = req.params;
        const company = dbManager.getCompanyInfo(companyId);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        return res.status(200).json({
            success: true,
            company
        });
    } catch (error) {
        console.error('Get company error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Test database connection for a company
 */
export async function testCompanyConnection(req, res) {
    try {
        const { companyId } = req.params;
        const pool = dbManager.getPool(companyId);

        // Test query
        const rows = await dbManager.query(companyId, 'SELECT 1 as test');

        return res.status(200).json({
            success: true,
            message: `Connected to ${dbManager.getCompanyInfo(companyId).name}`,
            test: rows
        });
    } catch (error) {
        console.error('Test connection error:', error);
        return res.status(500).json({
            error: 'Connection failed',
            details: error.message
        });
    }
}

/**
 * Get company statistics
 */
export async function getCompanyStats(req, res) {
    try {
        const { companyId } = req.params;

        // Get basic stats from the company's database
        const [partiesCount] = await dbManager.query(
            companyId,
            'SELECT COUNT(*) as count FROM parties'
        );

        const [itemsCount] = await dbManager.query(
            companyId,
            'SELECT COUNT(*) as count FROM items'
        );

        const [transactionsCount] = await dbManager.query(
            companyId,
            'SELECT COUNT(*) as count FROM transactions'
        );

        return res.status(200).json({
            success: true,
            companyId: parseInt(companyId),
            companyName: dbManager.getCompanyInfo(companyId).name,
            stats: {
                totalParties: partiesCount.count || 0,
                totalItems: itemsCount.count || 0,
                totalTransactions: transactionsCount.count || 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get company configuration details from existing companies table
 * Fetches company-specific details like GSTIN, address, contact info
 */
export async function getCompanyConfig(req, res) {
    try {
        const { companyId } = req.params;
        const company = dbManager.getCompanyInfo(companyId);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Fetch from existing companies table
        const companies = await dbManager.query(
            companyId,
            'SELECT * FROM companies LIMIT 1'
        );

        if (!companies || companies.length === 0) {
            return res.status(404).json({
                error: 'Company data not found in database'
            });
        }

        const companyData = companies[0];

        // Fetch bank details
        const bankDetails = await dbManager.query(
            companyId,
            'SELECT * FROM bank_details LIMIT 1'
        );
        const bank = bankDetails.length > 0 ? bankDetails[0] : {};

        // Map the database fields to our expected config format
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
            contact_person: companyData.contact_person || '',

            // Logo URL from database
            logo_url: companyData.logo_url || getDefaultLogo(companyId),

            // Invoice settings (these will need to be added to companies table or use defaults)
            invoice_prefix: getInvoicePrefix(companyId),
            financial_year: '2025-26',

            // Branding colors based on company ID
            primary_color: getBrandingColors(companyId).primary,
            secondary_color: getBrandingColors(companyId).secondary,

            // Bank Details
            account_name: bank.account_name || '',
            account_no: bank.account_no || '',
            ifsc_code: bank.ifsc_code || '',
            branch: bank.branch || ''
        };

        return res.status(200).json({
            success: true,
            config: config
        });
    } catch (error) {
        console.error('Get company config error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}

/**
 * Get invoice prefix based on company ID
 */
function getInvoicePrefix(companyId) {
    const prefixes = {
        1: 'RKCT',     // RK Casting
        2: 'RKEP',     // RK Engineering
        3: 'GBH'       // Global Bharat
    };
    return prefixes[companyId] || 'INV';
}

/**
 * Get branding colors based on company ID
 */
function getBrandingColors(companyId) {
    const colors = {
        1: { primary: '#1e293b', secondary: '#10b981' },  // Slate → Emerald (RK Casting)
        2: { primary: '#0f172a', secondary: '#3b82f6' },  // Dark Slate → Blue (RK Engineering)
        3: { primary: '#312e81', secondary: '#a855f7' }   // Indigo → Purple (Global Bharat)
    };
    return colors[companyId] || { primary: '#1e293b', secondary: '#10b981' };
}

/**
 * Get default logo path based on company ID
 */
function getDefaultLogo(companyId) {
    const logos = {
        1: '/src/assets/logo.png',                 // RK Casting
        2: '/src/assets/logo.png',                 // RK Engineering
        3: '/src/assets/logo-global-bharat.png'    // Global Bharat
    };
    return logos[companyId] || '/src/assets/logo.png';
}
