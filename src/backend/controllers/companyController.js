import { dbManager } from '../db.js';

/**
 * Get all available companies
 */
export async function getAllCompanies(req, res) {
    try {
        const companies = dbManager.getAllCompanies();

        return res.status(200).json({
            success: true,
            companies
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
