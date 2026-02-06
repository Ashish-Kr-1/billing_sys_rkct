
import { dbManager } from './db.js';

const SCHEMA = {
    quotations: `
        CREATE TABLE IF NOT EXISTS quotations (
            quotation_id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_no VARCHAR(50) UNIQUE NOT NULL,
            quotation_date DATE NOT NULL,
            party_id INT NOT NULL,
            subtotal DECIMAL(15, 2) DEFAULT 0.00,
            cgst_amount DECIMAL(15, 2) DEFAULT 0.00,
            sgst_amount DECIMAL(15, 2) DEFAULT 0.00,
            igst_amount DECIMAL(15, 2) DEFAULT 0.00,
            total_amount DECIMAL(15, 2) DEFAULT 0.00,
            gst_percentage DECIMAL(5, 2) DEFAULT 0.00,
            status VARCHAR(20) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (party_id) REFERENCES parties(party_id)
        );
    `,
    quotation_details: `
        CREATE TABLE IF NOT EXISTS quotation_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_no VARCHAR(50) NOT NULL,
            transported_by VARCHAR(100),
            place_of_supply VARCHAR(100),
            vehicle_no VARCHAR(50),
            eway_bill_no VARCHAR(50),
            vendor_code VARCHAR(50),
            po_no VARCHAR(50),
            po_date DATE,
            challan_no VARCHAR(50),
            challan_date DATE,
            account_name VARCHAR(100),
            account_no VARCHAR(50),
            ifsc_code VARCHAR(20),
            branch VARCHAR(100),
            terms_conditions TEXT,
            client_name VARCHAR(200),
            client_address TEXT,
            gstin VARCHAR(50),
            client_name2 VARCHAR(200),
            client_address2 TEXT,
            gstin2 VARCHAR(50),
            FOREIGN KEY (quotation_no) REFERENCES quotations(quotation_no) ON DELETE CASCADE
        );
    `,
    quotation_items: `
        CREATE TABLE IF NOT EXISTS quotation_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_no VARCHAR(50) NOT NULL,
            item_id INT,
            item_name VARCHAR(255),
            hsn_code VARCHAR(50),
            quantity DECIMAL(10, 2),
            rate DECIMAL(15, 2),
            amount DECIMAL(15, 2),
            FOREIGN KEY (quotation_no) REFERENCES quotations(quotation_no) ON DELETE CASCADE
        );
    `
};

export async function setupQuotationTables() {
    console.log('🔄 Starting Quotation Tables Setup...');

    // Iterate through all 3 company databases
    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
        try {
            const client = await dbManager.getPool(companyId).getConnection();

            try {
                await client.beginTransaction();

                // 1. Create quotations table
                await client.query(SCHEMA.quotations);

                // 2. Create quotation_details table
                await client.query(SCHEMA.quotation_details);

                // 3. Create quotation_items table
                await client.query(SCHEMA.quotation_items);

                await client.commit();

            } catch (err) {
                await client.rollback();
                console.error(`❌ Detailed error for Company ${companyId}:`, err);
            } finally {
                client.release();
            }

        } catch (err) {
            console.error(`❌ Failed setup for Company ${companyId}:`, err.message);
        }
    }
    console.log('✨ Quotation Tables Ready.');
}
