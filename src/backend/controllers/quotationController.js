import { dbManager } from '../db.js';

// Helper to get database connection
const getClient = async (companyId) => {
    return await dbManager.getPool(companyId).getConnection();
};

export const createQuotationHandler = async (req, res) => {
    const { quotation, quotation_details, items, totals } = req.body;
    const companyId = req.companyId;

    const {
        QuotationNo,
        QuotationDate,
        party_id,
        subtotal,
        cgst,
        sgst,
        GSTIN,
        Terms,
        status = 'Pending'
    } = quotation;

    if (!QuotationNo || !party_id || subtotal == null) {
        return res.status(400).json({
            error: "QuotationNo, party_id and subtotal are required"
        });
    }

    const client = await getClient(companyId);

    try {
        await client.beginTransaction();

        // Check for duplicate
        const [dup] = await client.query(
            "SELECT quotation_id FROM quotations WHERE quotation_no = ?",
            [QuotationNo]
        );

        if (dup.length > 0) {
            // If editing, handle update (not implemented fully for simplicity, assume new or overwrite)
            // For now, if duplicate, return error
            await client.rollback();
            return res.status(409).json({
                error: "Quotation with this number already exists",
                quotation_id: dup[0].quotation_id
            });
        }

        const cgst_amount = (subtotal * Number(cgst)) / 100;
        const sgst_amount = (subtotal * Number(sgst)) / 100;
        const igst_amount = 0; // Assuming intra-state for now as per invoice form default
        const total_amount = subtotal + cgst_amount + sgst_amount;
        const gst_percentage = Number(cgst) + Number(sgst);

        // 1. Insert into quotations
        const [qResult] = await client.query(`
            INSERT INTO quotations (
                quotation_no, quotation_date, party_id, 
                subtotal, sgst_amount, cgst_amount, igst_amount, 
                total_amount, gst_percentage, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            QuotationNo, QuotationDate || new Date(), party_id,
            subtotal, sgst_amount, cgst_amount, igst_amount,
            total_amount, gst_percentage, status
        ]);

        // 2. Insert into quotation_details
        await client.query(`
            INSERT INTO quotation_details (
                quotation_no, transported_by, place_of_supply, vehicle_no, 
                eway_bill_no, vendor_code, po_no, po_date, 
                challan_no, challan_date, 
                account_name, account_no, ifsc_code, branch, 
                terms_conditions, 
                client_name, client_address, gstin, 
                client_name2, client_address2, gstin2
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            QuotationNo,
            quotation_details.transported_by || null,
            quotation_details.place_of_supply || null,
            quotation_details.vehicle_no || null,
            quotation_details.eway_bill_no || null,
            quotation_details.vendor_code || null,
            quotation_details.po_no || null,
            quotation_details.po_date || null,
            quotation_details.challan_no || null,
            quotation_details.challan_date || null,
            quotation_details.account_name || null,
            quotation_details.account_no || null,
            quotation_details.ifsc_code || null,
            quotation_details.branch || null,
            quotation_details.terms_conditions || null,
            quotation_details.client_name || null,
            quotation_details.client_address || null,
            quotation_details.gstin || null,
            quotation_details.client_name2 || null,
            quotation_details.client_address2 || null,
            quotation_details.gstin2 || null
        ]);

        // 3. Insert into quotation_items
        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(`
                    INSERT INTO quotation_items (
                        quotation_no, item_id, item_name, hsn_code, quantity, rate, amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    QuotationNo,
                    item.item_id || null,
                    item.description || null, // Mapping description to item_name
                    item.HSNCode || null,
                    item.quantity || 0,
                    item.price || 0,
                    (item.quantity || 0) * (item.price || 0)
                ]);
            }
        }

        await client.commit();
        res.status(201).json({ success: true, quotation_no: QuotationNo });

    } catch (err) {
        await client.rollback();
        console.error("createQuotation error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
};

export const getNextQuotationNumber = async (req, res) => {
    const companyId = req.companyId;
    const client = await getClient(companyId);

    try {
        await client.beginTransaction();

        // 1. Determine Prefix based on Company
        const prefixMap = {
            1: 'QT/RKCT',
            2: 'QT/RKEP',
            3: 'QT/GBH' // As requested
        };
        const basePrefix = prefixMap[companyId] || 'QT/RKCT';

        // 2. Calculate Dynamic Financial Year
        const today = new Date();
        const month = today.getMonth(); // 0-11
        const year = today.getFullYear();

        let fyStart = year;
        if (month < 3) { // Jan, Feb, Mar belong to previous financial year start
            fyStart = year - 1;
        }

        const fyEnd = (fyStart + 1).toString().slice(-2); // "26" for 2026
        const financialYear = `${fyStart}-${fyEnd}`; // "2025-26"

        // Full Prefix: QT/RKCT/2025-26
        const fullPrefix = `${basePrefix}/${financialYear}`;

        // 3. Find the last number
        const [rows] = await client.query(`
            SELECT quotation_no FROM quotations 
            WHERE quotation_no LIKE ? 
            ORDER BY created_at DESC LIMIT 1
        `, [`${fullPrefix}/%`]);

        let nextNum = 1;
        if (rows.length > 0) {
            const lastNo = rows[0].quotation_no; // e.g. QT/RKCT/2025-26/045
            const parts = lastNo.split('/');
            // Expecting [QT, RKCT, 2025-26, 045] -> length 4
            // But DT/GBH might be same length.
            // Safest way is to take the LAST segment
            const lastSegment = parts[parts.length - 1];
            if (!isNaN(lastSegment)) {
                nextNum = parseInt(lastSegment) + 1;
            }
        }

        const formatted = `${fullPrefix}/${String(nextNum).padStart(3, '0')}`;

        await client.commit();
        res.json({ QuotationNo: formatted });

    } catch (err) {
        await client.rollback();
        console.error("nextQuotationNumber error:", err);
        res.status(500).json({ error: "Internal error" });
    } finally {
        client.release();
    }
};

export const getAllQuotations = async (req, res) => {
    const companyId = req.companyId;
    const client = await getClient(companyId);

    try {
        const [rows] = await client.query(`
            SELECT q.*, p.party_name 
            FROM quotations q
            LEFT JOIN parties p ON q.party_id = p.party_id
            ORDER BY q.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("getAllQuotations error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
};

export const deleteQuotation = async (req, res) => {
    const { id } = req.params;
    const companyId = req.companyId;
    const client = await getClient(companyId);

    try {
        await client.beginTransaction();
        // Since we have ON DELETE CASCADE (hopefully), we just delete from quotations
        // If not, we should delete details/items first. 
        // Assuming CASCADE was set in init, but to be safe I'll delete children first manually or rely on FK.
        // Let's rely on standard delete, if it fails due to FK, I'll know I messed up the init.
        // Actually, in the previous init script I used ON DELETE CASCADE.

        await client.query('DELETE FROM quotations WHERE quotation_no = ?', [id]);

        await client.commit();
        res.json({ success: true });
    } catch (err) {
        await client.rollback();
        console.error("deleteQuotation error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
};
