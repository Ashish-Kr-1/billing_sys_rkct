import { dbManager } from '../db.js';

/**
 * Get analytics data for a specific company
 * This endpoint fetches real transaction data from the company's database
 */
export async function getCompanyAnalytics(req, res) {
    try {
        const { companyId } = req.params;

        // Validate company ID
        if (!dbManager.getCompanyInfo(companyId)) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Fetch all required data from the company's database
        const analyticsData = await fetchAnalyticsData(companyId);

        return res.status(200).json({
            success: true,
            companyId: parseInt(companyId),
            companyName: dbManager.getCompanyInfo(companyId).name,
            data: analyticsData
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        return res.status(500).json({
            error: 'Failed to fetch analytics',
            details: error.message
        });
    }
}

/**
 * Helper function to fetch all analytics data
 */
async function fetchAnalyticsData(companyId) {
    // Fetch transactions
    const transactions = await dbManager.query(
        companyId,
        `SELECT
transaction_id,
    transaction_date,
    invoice_no,
    transaction_type,
    party_id,
    sell_amount,
    credit_amount,
    taxable_amount,
    igst_amount,
    cgst_amount,
    sgst_amount,
    gst_percentage,
    narration
    FROM transactions
    ORDER BY transaction_date DESC`
    );

    // Fetch parties
    const parties = await dbManager.query(
        companyId,
        `SELECT
party_id,
    party_name,
    gstin_no,
    type,
    billing_address,
    supply_state_code,
    mobile_no
    FROM parties
    ORDER BY party_name`
    );

    // Fetch items
    const items = await dbManager.query(
        companyId,
        `SELECT
item_id,
    item_name,
    hsn_code,
    unit,
    rate
    FROM items
    ORDER BY item_name`
    );

    // Fetch invoice details
    const invoiceDetails = await dbManager.query(
        companyId,
        `SELECT
invoice_no,
    invoice_date,
    place_of_supply,
    po_no,
    client_name
    FROM invoice_details
    ORDER BY invoice_date DESC`
    );

    // Fetch sell summary for product performance
    const sellSummary = await dbManager.query(
        companyId,
        `SELECT
ss.invoice_no,
    ss.item_id,
    ss.units_sold,
    i.rate as unit_price,
    i.item_name,
    i.hsn_code
    FROM sell_summary ss
    JOIN items i ON ss.item_id = i.item_id
    ORDER BY ss.invoice_no DESC`
    );

    // Fetch quotations
    const quotations = await dbManager.query(
        companyId,
        `SELECT
    quotation_no,
    quotation_date,
    party_id,
    total_amount,
    status,
    created_at
    FROM quotations
    ORDER BY quotation_date DESC`
    );

    return {
        transactions: transactions || [],
        parties: parties || [],
        items: items || [],
        invoiceDetails: invoiceDetails || [],
        sellSummary: sellSummary || [],
        quotations: quotations || []
    };
}

/**
 * Get summary statistics for a company
 */
export async function getCompanySummary(req, res) {
    try {
        const { companyId } = req.params;

        if (!dbManager.getCompanyInfo(companyId)) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Get counts
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

        // Get revenue summary
        const [revenueSummary] = await dbManager.query(
            companyId,
            `SELECT
SUM(sell_amount) as total_revenue,
    SUM(credit_amount) as total_collections,
    SUM(sell_amount - credit_amount) as outstanding
      FROM transactions
      WHERE transaction_type = 'SALE'`
        );

        return res.status(200).json({
            success: true,
            companyId: parseInt(companyId),
            summary: {
                totalParties: partiesCount?.count || 0,
                totalItems: itemsCount?.count || 0,
                totalTransactions: transactionsCount?.count || 0,
                totalRevenue: parseFloat(revenueSummary?.total_revenue) || 0,
                totalCollections: parseFloat(revenueSummary?.total_collections) || 0,
                outstanding: parseFloat(revenueSummary?.outstanding) || 0
            }
        });

    } catch (error) {
        console.error('Get summary error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get aggregated analytics for all companies for comparison
 */
export async function getAllCompaniesAnalytics(req, res) {
    try {
        const companies = dbManager.getAllCompanies();

        const results = await Promise.all(companies.map(async (comp) => {
            try {
                // Reuse the existing helper to get transactions
                const data = await fetchAnalyticsData(comp.id);
                return {
                    companyId: comp.id,
                    name: comp.shortName || comp.name,
                    transactions: data.transactions || []
                };
            } catch (err) {
                console.error(`Error fetching for company ${comp.id}: `, err);
                return { companyId: comp.id, name: comp.name, transactions: [] };
            }
        }));

        return res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Global analytics error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


