import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configurations for all 3 companies
const DB_CONFIGS = {
    1: {
        // RK Casting and Engineering Works
        host: process.env.DB_HOST || 'srv687.hstgr.io',
        user: 'u971268451_billing_system',
        password: process.env.DB_PASSWORD || 'RKbilling@123',
        database: 'u971268451_Billing_System',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    2: {
        // RKCASTING ENGINEERING PVT. LTD.
        host: process.env.DB_HOST || 'srv687.hstgr.io',
        user: 'u971268451_work_billing',
        password: process.env.DB_PASSWORD || 'RKbilling@123',
        database: 'u971268451_RkWorkBilling',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    3: {
        // Global Bharat
        host: process.env.DB_HOST || 'srv687.hstgr.io',
        user: 'u971268451_global_billing',
        password: process.env.DB_PASSWORD || 'RKbilling@123',
        database: 'u971268451_GlobalBilling',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }
};

// Company metadata
export const COMPANIES = {
    1: {
        id: 1,
        name: 'RK Casting and Engineering Works',
        shortName: 'RK Casting',
        database: 'u971268451_Billing_System'
    },
    2: {
        id: 2,
        name: 'RKCASTING ENGINEERING PVT. LTD.',
        shortName: 'RK Engineering',
        database: 'u971268451_RkWorkBilling'
    },
    3: {
        id: 3,
        name: 'Global Bharat',
        shortName: 'Global Bharat',
        database: 'u971268451_GlobalBilling'
    }
};

/**
 * Database Manager for Multi-Tenant System
 * Manages connection pools for all 3 company databases
 */
class DatabaseManager {
    constructor() {
        this.pools = {};
        this.initializePools();
    }

    /**
     * Initialize connection pools for all companies
     */
    initializePools() {
        Object.keys(DB_CONFIGS).forEach(companyId => {
            try {
                this.pools[companyId] = mysql.createPool(DB_CONFIGS[companyId]);
                console.log(`✅ Pool created for Company ${companyId}: ${COMPANIES[companyId].name}`);
            } catch (error) {
                console.error(`❌ Failed to create pool for Company ${companyId}:`, error);
            }
        });

        // Test all connections
        this.testAllConnections();
    }

    /**
     * Test connections to all databases
     */
    async testAllConnections() {
        for (const companyId of Object.keys(this.pools)) {
            try {
                const conn = await this.pools[companyId].getConnection();
                console.log(`✅ Connected to ${COMPANIES[companyId].name}`);
                conn.release();
            } catch (error) {
                console.error(`❌ Connection failed for ${COMPANIES[companyId].name}:`, error.message);
            }
        }
    }

    /**
     * Get connection pool for specific company
     * @param {number|string} companyId - Company ID (1, 2, or 3)
     * @returns {Pool} MySQL connection pool
     */
    getPool(companyId) {
        const id = parseInt(companyId);

        if (!this.pools[id]) {
            throw new Error(`Invalid company ID: ${companyId}. Must be 1, 2, or 3.`);
        }

        return this.pools[id];
    }

    /**
     * Execute query on specific company's database
     * @param {number} companyId - Company ID
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query results
     */
    async query(companyId, sql, params = []) {
        const pool = this.getPool(companyId);
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    /**
     * Get company information
     * @param {number} companyId - Company ID
     * @returns {Object} Company metadata
     */
    getCompanyInfo(companyId) {
        const id = parseInt(companyId);
        return COMPANIES[id] || null;
    }

    /**
     * Get all companies
     * @returns {Array} List of all companies
     */
    getAllCompanies() {
        return Object.values(COMPANIES);
    }

    /**
     * Close all connection pools
     */
    async closeAllPools() {
        for (const companyId of Object.keys(this.pools)) {
            try {
                await this.pools[companyId].end();
                console.log(`✅ Closed pool for Company ${companyId}`);
            } catch (error) {
                console.error(`❌ Error closing pool for Company ${companyId}:`, error);
            }
        }
    }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Default export for backward compatibility (Company 1)
export default dbManager.getPool(1);

// Named exports
export { dbManager, DB_CONFIGS };

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Closing database connections...');
    await dbManager.closeAllPools();
    process.exit(0);
});