
import { validationResult } from 'express-validator';

// Generate Quotation Number
// Format: QT/FY/001
const generateQuotationNumber = async (db, companyId) => {
    const prefixMap = {
        1: 'QT-RK',
        2: 'QT-EP',
        3: 'QT-GB'
    };
    const prefix = prefixMap[companyId] || 'QT';
    const year = '2025-26'; // Dynamic year logic can be added
    const fullPrefix = `${prefix}/${year}`;

    const [rows] = await db.query(`
        SELECT quotation_no FROM quotations 
        WHERE quotation_no LIKE ? 
        ORDER BY created_at DESC LIMIT 1
    `, [`${fullPrefix}/%`]);

    let nextNum = 1;
    if (rows.length > 0) {
        const lastNo = rows[0].quotation_no;
        const parts = lastNo.split('/');
        nextNum = parseInt(parts[parts.length - 1]) + 1;
    }

    return `${fullPrefix}/${String(nextNum).padStart(3, '0')}`;
};

export const createQuotation = async (req, res) => {
    const client = await req.db.getConnection();
    try {
        await client.beginTransaction();

        const {
            party_id,
            items,
            subtotal,
            sgst,
            cgst,
            total_amount,
            terms,
            clientName,
            clientAddress,
            gstin,
            clientName2,
            clientAddress2,
            gstin2
        } = req.body;

        const quotationNo = await generateQuotationNumber(client, req.companyId);

        // 1. Insert into quotations
        const [qResult] = await client.query(`
            INSERT INTO quotations (
                quotation_no, quotation_date, party_id, subtotal, 
                total_amount, sgst_amount, cgst_amount, gst_percentage
            ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)
        `, [
            quotationNo,
            party_id,
            subtotal,
            total_amount,
            (subtotal * sgst) / 100,
            (subtotal * cgst) / 100,
            Number(sgst) + Number(cgst)
        ]);

        // 2. Insert items
        for (const item of items) {
            await client.query(`
                INSERT INTO quotation_items (
                    quotation_no, item_id, item_name, hsn_code, quantity, rate, amount
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                quotationNo,
                item.item_id,
                item.description || item.item_name, // handling both keys
                item.HSNCode || item.hsn_code,
                item.quantity,
                item.price,
                item.quantity * item.price
            ]);
        }

        // 3. Insert details
        await client.query(`
            INSERT INTO quotation_details (
                quotation_no, terms_conditions, 
                client_name, client_address, gstin,
                client_name2, client_address2, gstin2
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            quotationNo,
            terms,
            clientName,
            clientAddress,
            gstin,
            clientName2,
            clientAddress2,
            gstin2
        ]);

        await client.commit();
        res.status(201).json({ success: true, quotation_no: quotationNo, message: "Quotation created successfully" });

    } catch (error) {
        await client.rollback();
        console.error('Create Quotation Error:', error);
        res.status(500).json({ error: 'Failed to create quotation' });
    } finally {
        client.release();
    }
};

export const getAllQuotations = async (req, res) => {
    try {
        const [rows] = await req.db.query(`
            SELECT q.*, p.party_name 
            FROM quotations q
            JOIN parties p ON q.party_id = p.party_id
            ORDER BY q.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get Quotations Error:', error);
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
};

export const getQuotationById = async (req, res) => {
    const { id } = req.params; // Expecting quotation_no or id. Let's support quotation_no
    try {
        // Fetch main
        const [qRows] = await req.db.query(`
            SELECT q.*, p.party_name, d.terms_conditions, 
                   d.client_name, d.client_address, d.gstin,
                   d.client_name2, d.client_address2, d.gstin2
            FROM quotations q
            JOIN parties p ON q.party_id = p.party_id
            LEFT JOIN quotation_details d ON q.quotation_no = d.quotation_no
            WHERE q.quotation_no = ?
        `, [id]);

        if (qRows.length === 0) return res.status(404).json({ error: 'Quotation not found' });

        // Fetch items
        const [items] = await req.db.query(`
            SELECT * FROM quotation_items WHERE quotation_no = ?
        `, [id]);

        res.json({ quotation: qRows[0], items });

    } catch (error) {
        console.error('Get Quotation Error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation details' });
    }
};

export const deleteQuotation = async (req, res) => {
    const { id } = req.params;
    const client = await req.db.getConnection();
    try {
        await client.beginTransaction();
        // Cascading delete should handle items and details if FK set correctly, 
        // but explicitly deleting is safer if ON DELETE CASCADE isn't reliable.
        // We set ON DELETE CASCADE in init script, so deleting parent is enough.

        const [result] = await client.query('DELETE FROM quotations WHERE quotation_no = ?', [id]);

        if (result.affectedRows === 0) {
            await client.rollback();
            return res.status(404).json({ error: 'Quotation not found' });
        }

        await client.commit();
        res.json({ success: true, message: 'Quotation deleted' });
    } catch (err) {
        await client.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};
