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
            await client.rollback();
            return res.status(409).json({
                error: "Quotation with this number already exists",
                quotation_id: dup[0].quotation_id
            });
        }

        // ✅ Fetch Party State Code for Auto-Tax Calculation
        const [partyRows] = await client.query("SELECT supply_state_code FROM parties WHERE party_id = ?", [party_id]);

        if (partyRows.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: "Party not found" });
        }

        const stateCode = partyRows[0].supply_state_code;
        let cgstRate = 0, sgstRate = 0, igstRate = 0;

        // RULE: If State Code is '20' (Jharkhand), CGST=9%, SGST=9%. Else IGST=18%.
        const sc = String(stateCode || '').trim();
        if (sc === '20') {
            cgstRate = 9;
            sgstRate = 9;
            igstRate = 0;
        } else {
            cgstRate = 0;
            sgstRate = 0;
            igstRate = 18;
        }

        const cgst_amount = (subtotal * cgstRate) / 100;
        const sgst_amount = (subtotal * sgstRate) / 100;
        const igst_amount = (subtotal * igstRate) / 100;
        const total_amount = subtotal + cgst_amount + sgst_amount + igst_amount;
        const gst_percentage = cgstRate + sgstRate + igstRate;

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
                client_name2, client_address2, gstin2,
                validity_days, rfq_no, rfq_date, contact_person, contact_no, email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            quotation_details.gstin2 || null,
            quotation_details.validity_days || null,
            quotation_details.rfq_no || null,
            quotation_details.rfq_date || null,
            quotation_details.contact_person || null,
            quotation_details.contact_no || null,
            quotation_details.email || null
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

        if (companyId == 1) {
            // Special format for Company 1: RKC/222
            const prefix = 'RKC';
            const [rows] = await client.query(`
                SELECT quotation_no FROM quotations 
                WHERE quotation_no LIKE ? AND quotation_no NOT LIKE ?
                ORDER BY created_at DESC LIMIT 1
            `, [`${prefix}/%`, `${prefix}/%/%`]);

            let nextNum = 222;
            if (rows.length > 0) {
                const lastNo = rows[0].quotation_no; // RKC/222
                const parts = lastNo.split('/');
                const lastSegment = parts[parts.length - 1];
                const parsed = parseInt(lastSegment, 10);
                if (!isNaN(parsed)) {
                    nextNum = parsed + 1;
                }
            }
            const formatted = `${prefix}/${nextNum}`;

            await client.commit();
            return res.json({ QuotationNo: formatted });
        }

        // Standard logic for other companies
        // 1. Determine Prefix based on Company
        const prefixMap = {
            2: 'QT/RKEP',
            3: 'QT/GBH'
        };
        const basePrefix = prefixMap[companyId] || 'QT/Unknown';

        // 2. Calculate Dynamic Financial Year
        const today = new Date();
        const month = today.getMonth(); // 0-11
        const year = today.getFullYear();

        let fyStart = year;
        if (month < 3) { // Jan, Feb, Mar belong to previous financial year start
            fyStart = year - 1;
        }

        const fyEnd = (fyStart + 1).toString().slice(-2);
        const financialYear = `${fyStart}-${fyEnd}`;

        const fullPrefix = `${basePrefix}/${financialYear}`;

        const [rows] = await client.query(`
            SELECT quotation_no FROM quotations 
            WHERE quotation_no LIKE ? 
            ORDER BY created_at DESC LIMIT 1
        `, [`${fullPrefix}/%`]);

        let nextNum = 1;
        if (rows.length > 0) {
            const lastNo = rows[0].quotation_no;
            const parts = lastNo.split('/');
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

export const updateQuotationStatus = async (req, res) => {
    // Use body instead of params to safely handle IDs with slashes (e.g. QT/RKCT/...)
    const { quotation_no, status } = req.body;
    const companyId = req.companyId;

    if (!quotation_no || !status) {
        return res.status(400).json({ error: "quotation_no and status are required" });
    }

    const client = await getClient(companyId);

    try {
        await client.beginTransaction();
        const [result] = await client.query(
            "UPDATE quotations SET status = ? WHERE quotation_no = ?",
            [status, quotation_no]
        );

        if (result.affectedRows === 0) {
            await client.rollback();
            return res.status(404).json({ error: "Quotation not found" });
        }

        await client.commit();
        res.json({ success: true, message: "Status updated successfully" });
    } catch (err) {
        await client.rollback();
        console.error("updateQuotationStatus error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
};

export const updateQuotationHandler = async (req, res) => {
    const { quotation, quotation_details, items } = req.body;
    const quotationNo = req.params.quotation_no || quotation?.QuotationNo;
    const companyId = req.companyId;

    if (!quotationNo) {
        return res.status(400).json({ error: "Quotation number is required" });
    }

    const client = await getClient(companyId);

    try {
        await client.beginTransaction();

        // Check if quotation exists
        const [existing] = await client.query(
            "SELECT quotation_no FROM quotations WHERE quotation_no = ?",
            [quotationNo]
        );

        if (existing.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: "Quotation not found" });
        }

        // Fetch Party State Code for Auto-Tax Calculation
        const [partyRows] = await client.query(
            "SELECT supply_state_code FROM parties WHERE party_id = ?",
            [quotation.party_id]
        );

        if (partyRows.length === 0) {
            await client.rollback();
            return res.status(404).json({ error: "Party not found" });
        }

        const stateCode = partyRows[0].supply_state_code;
        let cgstRate = 0, sgstRate = 0, igstRate = 0;

        const sc = String(stateCode || '').trim();
        if (sc === '20') {
            cgstRate = 9;
            sgstRate = 9;
            igstRate = 0;
        } else {
            cgstRate = 0;
            sgstRate = 0;
            igstRate = 18;
        }

        const subtotal = quotation.subtotal;
        const cgst_amount = (subtotal * cgstRate) / 100;
        const sgst_amount = (subtotal * sgstRate) / 100;
        const igst_amount = (subtotal * igstRate) / 100;
        const total_amount = subtotal + cgst_amount + sgst_amount + igst_amount;
        const gst_percentage = cgstRate + sgstRate + igstRate;

        // Update quotation
        await client.query(`
            UPDATE quotations SET
                quotation_date = ?,
                party_id = ?,
                subtotal = ?,
                sgst_amount = ?,
                cgst_amount = ?,
                igst_amount = ?,
                total_amount = ?,
                gst_percentage = ?
            WHERE quotation_no = ?
        `, [
            quotation.QuotationDate || new Date(),
            quotation.party_id,
            subtotal,
            sgst_amount,
            cgst_amount,
            igst_amount,
            total_amount,
            gst_percentage,
            quotationNo
        ]);

        // Update quotation_details
        await client.query(`
            UPDATE quotation_details SET
                transported_by = ?,
                place_of_supply = ?,
                vehicle_no = ?,
                eway_bill_no = ?,
                vendor_code = ?,
                po_no = ?,
                po_date = ?,
                challan_no = ?,
                challan_date = ?,
                account_name = ?,
                account_no = ?,
                ifsc_code = ?,
                branch = ?,
                terms_conditions = ?,
                client_name = ?,
                client_address = ?,
                gstin = ?,
                client_name2 = ?,
                client_address2 = ?,
                gstin2 = ?,
                validity_days = ?,
                rfq_no = ?,
                rfq_date = ?,
                contact_person = ?,
                contact_no = ?,
                email = ?
            WHERE quotation_no = ?
        `, [
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
            quotation_details.gstin2 || null,
            quotation_details.validity_days || null,
            quotation_details.rfq_no || null,
            quotation_details.rfq_date || null,
            quotation_details.contact_person || null,
            quotation_details.contact_no || null,
            quotation_details.email || null,
            quotationNo
        ]);

        // Delete existing items and re-insert
        await client.query("DELETE FROM quotation_items WHERE quotation_no = ?", [quotationNo]);

        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(`
                    INSERT INTO quotation_items (
                        quotation_no, item_id, item_name, hsn_code, quantity, rate, amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    quotationNo,
                    item.item_id || null,
                    item.description || null,
                    item.HSNCode || null,
                    item.quantity || 0,
                    item.price || 0,
                    (item.quantity || 0) * (item.price || 0)
                ]);
            }
        }

        await client.commit();
        res.json({ success: true, message: "Quotation updated successfully", quotation_no: quotationNo });

    } catch (err) {
        await client.rollback();
        console.error("updateQuotation error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
};

export const getQuotationDetailsHandler = async (req, res) => {
    // Handle both query param (new) and path param (legacy)
    const quotationNo = req.query.quotation_no || req.params.quotation_no;

    if (!quotationNo) {
        return res.status(400).json({ error: "Quotation number required" });
    }

    const companyId = req.companyId;
    const client = await getClient(companyId);

    try {
        // Fetch quotation (main record)
        const [quotations] = await client.query(
            'SELECT * FROM quotations WHERE quotation_no = ?',
            [quotationNo]
        );

        if (!quotations || quotations.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Quotation not found'
            });
        }

        const quotation = quotations[0];

        // Fetch quotation_details
        const [quotationDetails] = await client.query(
            'SELECT * FROM quotation_details WHERE quotation_no = ?',
            [quotationNo]
        );

        // Fetch items from quotation_items with item details
        const [quotationItems] = await client.query(
            `SELECT 
                qi.*,
                i.item_name as description,
                i.hsn_code,
                qi.rate as unit_price
            FROM quotation_items qi
            LEFT JOIN items i ON qi.item_id = i.item_id
            WHERE qi.quotation_no = ?`,
            [quotationNo]
        );

        // Fetch party details if party_id exists
        let party = null;
        if (quotation.party_id) {
            const [parties] = await client.query(
                'SELECT * FROM parties WHERE party_id = ?',
                [quotation.party_id]
            );
            party = parties[0] || null;
        }

        // Map to match frontend expected format
        const quotationData = {
            quotation: {
                quotation_no: quotation.quotation_no,
                quotation_date: quotation.quotation_date,
                gstin: quotation.gst_number || '',
                party_id: quotation.party_id,
                subtotal: quotation.subtotal,
                cgst: quotation.cgst_amount > 0 ? (quotation.cgst_amount / quotation.subtotal * 100) : 0,
                sgst: quotation.sgst_amount > 0 ? (quotation.sgst_amount / quotation.subtotal * 100) : 0,
                igst: quotation.igst_amount > 0 ? (quotation.igst_amount / quotation.subtotal * 100) : 0,
                status: quotation.status
            },
            quotation_details: quotationDetails[0] || {},
            items: quotationItems.map(item => ({
                item_id: item.item_id,
                description: item.item_name || item.description,
                hsn_code: item.hsn_code,
                quantity: item.quantity,
                unit_price: item.rate,
                price: item.rate
            })),
            party: party
        };

        return res.status(200).json({
            success: true,
            ...quotationData
        });

    } catch (error) {
        console.error('Get quotation details error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    } finally {
        client.release();
    }
};
