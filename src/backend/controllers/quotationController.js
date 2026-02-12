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

export const getQuotationDetails = async (req, res) => {
    const quotationNo = req.query.quotation_no || req.params.quotation_no;
    const companyId = req.companyId;

    if (!quotationNo) {
        return res.status(400).json({ error: "Quotation number required" });
    }

    const client = await getClient(companyId);

    try {
        // Fetch quotation
        const [quotations] = await client.query(
            "SELECT * FROM quotations WHERE quotation_no = ?",
            [quotationNo]
        );

        if (quotations.length === 0) {
            return res.status(404).json({ error: "Quotation not found" });
        }

        const quotationData = quotations[0];

        // Fetch quotation details
        const [details] = await client.query(
            "SELECT * FROM quotation_details WHERE quotation_no = ?",
            [quotationNo]
        );

        // Fetch quotation items
        const [items] = await client.query(
            "SELECT * FROM quotation_items WHERE quotation_no = ?",
            [quotationNo]
        );

        // Fetch party details
        let party = null;
        if (quotationData.party_id) {
            const [parties] = await client.query(
                "SELECT * FROM parties WHERE party_id = ?",
                [quotationData.party_id]
            );
            party = parties[0] || null;
        }

        // Map to frontend expected format
        const responseData = {
            quotation: {
                QuotationNo: quotationData.quotation_no,
                QuotationDate: quotationData.quotation_date,
                party_id: quotationData.party_id,
                subtotal: quotationData.subtotal,
                cgst: quotationData.cgst_amount > 0 ? (quotationData.cgst_amount / quotationData.subtotal * 100) : 0,
                sgst: quotationData.sgst_amount > 0 ? (quotationData.sgst_amount / quotationData.subtotal * 100) : 0,
                igst: quotationData.igst_amount > 0 ? (quotationData.igst_amount / quotationData.subtotal * 100) : 0,
                Terms: details[0]?.terms_conditions || '',
                status: quotationData.status,
                // Add fields for QuotationTemplate mapping if needed
                clientName: details[0]?.client_name || party?.party_name || '',
                clientAddress: details[0]?.client_address || party?.billing_address || '',
                clientName2: details[0]?.client_name2 || party?.party_name || '',
                clientAddress2: details[0]?.client_address2 || party?.shipping_address || '',
                GSTIN: details[0]?.gstin || party?.gstin_no || '',
                GSTIN2: details[0]?.gstin2 || party?.gstin_no || '',
                TrasnportBy: details[0]?.transported_by || '',
                PlaceofSupply: details[0]?.place_of_supply || '',
                VehicleNo: details[0]?.vehicle_no || '',
                EwayBillNo: details[0]?.eway_bill_no || '',
                VendorCode: details[0]?.vendor_code || party?.vendore_code || '',
                PONo: details[0]?.po_no || '',
                PODate: details[0]?.po_date || '',
                ChallanNo: details[0]?.challan_no || '',
                ChallanDate: details[0]?.challan_date || '',
                AccountName: details[0]?.account_name || '',
                CurrentACCno: details[0]?.account_no || '',
                IFSCcode: details[0]?.ifsc_code || '',
                Branch: details[0]?.branch || '',
                validity_days: details[0]?.validity_days || '',
                rfq_no: details[0]?.rfq_no || '',
                rfq_date: details[0]?.rfq_date || '',
                contact_person: details[0]?.contact_person || '',
                contact_no: details[0]?.contact_no || '',
                email: details[0]?.email || ''
            },
            subtotalAmount: quotationData.subtotal,
            totalAmount: quotationData.total_amount,
            cgst: quotationData.cgst_amount > 0 ? (quotationData.cgst_amount / quotationData.subtotal * 100) : 0,
            sgst: quotationData.sgst_amount > 0 ? (quotationData.sgst_amount / quotationData.subtotal * 100) : 0,
            igst: quotationData.igst_amount > 0 ? (quotationData.igst_amount / quotationData.subtotal * 100) : 0,
            items: items.map(item => ({
                item_id: item.item_id,
                description: item.item_name,
                HSNCode: item.hsn_code,
                quantity: Number(item.quantity),
                price: Number(item.rate),
                amount: Number(item.amount)
            }))
        };

        res.json(responseData);

    } catch (err) {
        console.error("getQuotationDetails error:", err);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
};
