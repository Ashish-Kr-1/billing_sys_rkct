import express from 'express'; // Force deploy v2
import cors from 'cors';
import helmet from 'helmet';
import { dbManager } from "../db.js";
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import path from 'path';
import { authRouter, companyRouter, analyticsRouter, quotationRouter, userRouter } from '../routes/index.js';
import { setupQuotationTables } from '../setup_quotation_tables.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateParty, validateItem } from '../middleware/validators.js';

dotenv.config()

//edit
//edit again
const app = express()
const router = express.Router()
const routerB = express.Router()
const routerParty = express.Router()
const routerItems = express.Router()
const routerLedger = express.Router()
const routerTransaction = express.Router()
const r = express.Router()



// const validators = [
//   body('party_name').trim().notEmpty().withMessage('party_name required').isLength({ max: 200 }),
//   body('gstin_no').optional({ checkFalsy: true }).isLength({ max: 20 }).matches(/^[0-9A-Z]{15}$/).withMessage('GSTIN format (15 chars uppercase)'),
//   body('type').trim().notEmpty().isIn(['customer', 'supplier']).withMessage('type must be customer or supplier'),
//   body('billing_address').optional({ checkFalsy: true }).isLength({ max: 2000 }),
//   body('shipping_address').optional({ checkFalsy: true }).isLength({ max: 2000 }),
//   body('supply_state_code').optional({ checkFalsy: true }).isLength({ max: 10 }),
//   body('vendor_code').optional({ checkFalsy: true }).isLength({ max: 50 })
// ];

const allowedOrigins = [
  "http://localhost:5173",        // local dev (Vite)
  "http://localhost:5000",        // local/VPS backend
  "https://billing.rkcasting.in", // Production Frontend
  "https://www.billing.rkcasting.in",
  process.env.FRONTEND_URL,       // Dynamic from .env
  "*"                             // Allow all for testing
];

app.use(express.json())

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("CORS not allowed"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(helmet())

// Mount auth and company routes
app.use('/auth', authRouter);

// Protect all subsequent routes
app.use(authenticateUser);

// Middleware to select database pool based on Company ID
app.use((req, res, next) => {
  const companyId = req.headers['x-company-id'] || req.query.companyId;

  if (companyId) {
    try {
      req.db = dbManager.getPool(companyId);
      req.companyId = companyId;
    } catch (err) {
      console.warn(`Invalid Company ID requested: ${companyId}. Falling back to default.`);
      req.db = dbManager.getPool(1);
      req.companyId = 1;
    }
  } else {
    // Default to Company 1 (RK Casting) for backward compatibility
    req.db = dbManager.getPool(1);
    req.companyId = 1;
  }
  next();
});

app.use('/companies', companyRouter);
app.use('/analytics', analyticsRouter);
app.use('/createQuotation', quotationRouter); // Mounting at /createQuotation to match frontend ease, or cleaner /quotations
app.use('/users', userRouter); // Admin-only user management

//endpoint for api status
app.get('/health', async (req, res) => res.json({ status: 'ok' }));

//Check

//endpoint to test database
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT NOW()");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/parties', async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT party_id, party_name FROM parties WHERE is_deleted = 0 ORDER BY party_name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

// Update party details
app.put('/parties/:id', async (req, res) => {
  const partyId = req.params.id;
  const {
    party_name,
    gstin_no,
    type,
    billing_address,
    shipping_address,
    supply_state_code,
    vendore_code,
    pin_code,
    contact_person,
    mobile_no
  } = req.body;

  try {
    await req.db.query(
      `UPDATE parties SET 
        party_name = ?, 
        gstin_no = ?, 
        type = ?, 
        billing_address = ?, 
        shipping_address = ?, 
        supply_state_code = ?, 
        vendore_code = ?, 
        pin_code = ?, 
        contact_person = ?, 
        mobile_no = ?
       WHERE party_id = ?`,
      [
        party_name,
        gstin_no,
        type,
        billing_address,
        shipping_address,
        supply_state_code,
        vendore_code,
        pin_code,
        contact_person,
        mobile_no,
        partyId
      ]
    );
    res.json({ success: true, message: 'Party updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete party
app.delete('/parties/:id', async (req, res) => {
  const partyId = req.params.id;
  try {
    await req.db.query("UPDATE parties SET is_deleted = 1 WHERE party_id = ?", [partyId]);
    res.json({ success: true, message: 'Party deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/itemNames', async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT item_id, item_name FROM items WHERE is_deleted = 0 ORDER BY item_name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/transactions', async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT * FROM transactions");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/items', async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT * from items WHERE is_deleted = 0");
    res.json({ rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

// Get item details
app.get('/items/:id', async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT * FROM items WHERE item_id = ? AND is_deleted = 0", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update item
app.put('/items/:id', async (req, res) => {
  const itemId = req.params.id;
  const { item_name, hsn_code, unit, rate } = req.body;

  try {
    await req.db.query(
      `UPDATE items SET 
                item_name = ?, 
                hsn_code = ?, 
                unit = ?, 
                rate = ?
             WHERE item_id = ?`,
      [item_name, hsn_code, unit, rate, itemId]
    );
    res.json({ success: true, message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete item
app.delete('/items/:id', async (req, res) => {
  const itemId = req.params.id;
  try {
    await req.db.query("UPDATE items SET is_deleted = 1 WHERE item_id = ?", [itemId]);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function partyList(req, res) {
  const client = await req.db.getConnection(); // MySQL
  try {
    await client.beginTransaction();
    const [rows] = await client.query("SELECT party_id, party_name, supply_state_code FROM parties WHERE is_deleted = 0 ORDER BY party_name");
    res.json(rows);
    await client.commit();
  } catch (err) {
    await client.rollback();
    console.log("Party list error ", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

async function partyDetails(req, res) {
  const client = await req.db.getConnection();
  const partyId = parseInt(req.params.id, 10);

  if (!Number.isInteger(partyId)) {
    client.release();
    return res.status(400).json({ error: 'Invalid party id' });
  }

  try {
    await client.beginTransaction();

    const [rows] = await client.query(
      `
      SELECT
        party_id,
        party_name,
        gstin_no,
        type,
        billing_address,
        shipping_address,
        vendore_code,
        mobile_no,
        contact_person,
        supply_state_code
      FROM parties
      WHERE party_id = ? AND is_deleted = 0
      `,
      [partyId]
    );

    if (rows.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: 'Party not found' });
    }

    await client.commit();
    return res.json({ party: rows[0] });
  } catch (err) {
    await client.rollback();
    console.log("Party list error ", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

async function itemDetails(req, res) {
  const client = await req.db.getConnection();
  const itemId = parseInt(req.params.id, 10);

  if (!Number.isInteger(itemId)) {
    client.release();
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try {
    await client.beginTransaction();

    const [rows] = await client.query(
      `
      SELECT
        item_id,
        item_name,
        hsn_code,
        unit,
        rate
      FROM items
      WHERE item_id = ?
      `,
      [itemId]
    );

    if (rows.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: 'Item not found' });
    }

    await client.commit();
    return res.json({ item: rows[0] });
  } catch (err) {
    await client.rollback();
    console.log("Item list error ", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

async function getNextInvoiceNumber(req, res) {
  const client = await req.db.getConnection(); // MySQL
  try {
    await client.beginTransaction();

    // Use invoice prefix based on company ID (hardcoded mapping)
    const prefixMap = {
      1: 'RKC/TI',      // RK Casting
      2: 'RKEP',      // RK Engineering
      3: 'GBH'        // Global Bharat
    };

    const invoicePrefix = prefixMap[req.companyId] || 'RKCT';

    // Dynamic Financial Year
    const today = new Date();
    const month = today.getMonth(); // 0-11
    const year = today.getFullYear();

    let fyStart = year;
    if (month < 3) { // Jan, Feb, Mar belong to previous financial year start
      fyStart = year - 1;
    }

    const fyEnd = (fyStart + 1).toString().slice(-2);
    // Short year format: 25-26
    const fyStartShort = String(fyStart).slice(-2);
    const financialYear = `${fyStartShort}-${fyEnd}`;

    const prefix = `${invoicePrefix}/${financialYear}`;

    const [rows] = await client.query(`
    SELECT invoice_no
    FROM transactions
    WHERE invoice_no LIKE ?
    ORDER BY created_at DESC
    LIMIT 1
  `, [`${prefix}/%`]);

    let nextNumber = 1;
    if (req.companyId == 1 && financialYear === '25-26') {
      nextNumber = 269;
    }

    if (rows.length > 0) {
      const lastInvoiceNo = rows[0].invoice_no; // RKCT/2025-26/012
      const parts = lastInvoiceNo.split('/');
      const lastSegment = parts[parts.length - 1]; // ALWAYS take the last part
      const lastNumber = parseInt(lastSegment, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const formatted = `${prefix}/${String(nextNumber).padStart(3, '0')}`;

    await client.commit();
    return res.json({ InvoiceNo: formatted });
  } catch (err) {
    await client.rollback();
    console.error('invoice number error', err);
    // err.code '23505' is PG specific duplicate key. MySQL uses 1062
    if (err.errno === 1062) {
      return res.status(409).json({ error: 'Duplicate key' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

async function createPaymentHandler(req, res) {
  const { invoice_no, amount, date, remarks } = req.body;

  if (!invoice_no || !amount) {
    return res.status(400).json({
      error: "invoice_no, party_id and amount are required"
    });
  }

  const client = await req.db.getConnection();

  try {
    await client.beginTransaction();

    // 🔎 Ensure invoice exists (SALE entry)
    const [invoice] = await client.query(
      `
      SELECT party_id
      FROM transactions
      WHERE invoice_no = ?
        AND transaction_type = 'SALE'
      `,
      [invoice_no]
    );

    if (invoice.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: "Invoice not found" });
    }



    // ➕ Insert RECEIPT
    const insertSql = `
      INSERT INTO transactions (
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
        round_off,
        gst_percentage,
        gst_number,
        narration
      )
      VALUES (
        ?, ?, 'RECEIPT', ?,
        0, ?,
        0, 0, 0, 0, 0, 0,
        NULL,
        ?
      )
    `;

    const values = [
      date || new Date(),
      invoice_no,
      invoice[0].party_id,
      amount,
      remarks || `Payment against invoice ${invoice_no}`
    ];

    const [resHeader] = await client.query(insertSql, values);
    const paymentId = resHeader.insertId;

    const [rows] = await client.query("SELECT * FROM transactions WHERE transaction_id = ?", [paymentId]);

    await client.commit();
    res.status(201).json({ payment: rows[0] });

  } catch (err) {
    await client.rollback();
    console.error("createPayment error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

async function getInvoiceHistoryHandler(req, res) {
  const invoiceNo = req.query.invoice_no;

  if (!invoiceNo) {
    return res.status(400).json({ error: "Invoice number required" });
  }

  try {
    const [rows] = await req.db.query(
      `
      SELECT
        transaction_id,
        transaction_date,
        credit_amount,
        narration
      FROM transactions
      WHERE invoice_no = ?
        AND credit_amount > 0
      ORDER BY transaction_date ASC
      `,
      [invoiceNo]
    );

    const payments = rows.map(r => ({
      id: r.transaction_id,
      date: r.transaction_date,
      amount: Number(r.credit_amount),
      remarks: r.narration || ""
    }));

    return res.json({ payments });
  } catch (err) {
    console.error("Payment history error:", err);
    return res.status(500).json({ error: "Failed to fetch payment history" });
  }
}


app.get('/number', getNextInvoiceNumber);

async function createItemHandler(req, res) {
  const {
    item_name, hsn_code, unit, rate
  } = req.body;
  console.log(req.body)

  //if (!hsn_code) return res.status(400).json({ error: 'All fields are required' })

  const client = await req.db.getConnection();

  try {
    await client.beginTransaction();

    const INSERT_SQL = `INSERT INTO items
      (item_name, hsn_code, unit, rate)
      VALUES (?,?,?,?)`;

    const vals = [item_name, hsn_code, unit, rate]
    const [resHeader] = await client.query(INSERT_SQL, vals);

    // Manual result construction since we know input
    const result = { party: { item_name, hsn_code, unit, rate } };

    await client.commit();

    const status = res.status(201).json(result);
  } catch (err) {
    await client.rollback();
    console.error('create item error', err);
    if (err.errno === 1062) {
      return res.status(409).json({ error: 'Duplicate key' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

async function createPartyHandler(req, res) {
  const {
    party_name, gstin_no = null, type,
    billing_address = null, shipping_address = null,
    supply_state_code = null,
    vendore_code = null,
    pin_code = null,
    contact_person = null,
    mobile_no = null
  } = req.body;

  if (!party_name || !supply_state_code) {
    return res.status(400).json({ error: 'Party Name, Type, and State Code are required' });
  }

  // VALIDATION
  if (party_name.length > 255) return res.status(400).json({ error: 'Party Name too long (max 255)' });
  if (gstin_no && gstin_no.length > 20) return res.status(400).json({ error: 'GSTIN too long (max 20)' });
  if (type.length > 50) return res.status(400).json({ error: 'Type too long (max 50)' });
  if (supply_state_code && supply_state_code.length > 10) return res.status(400).json({ error: 'State Code too long (max 10)' });
  if (vendore_code && vendore_code.length > 50) return res.status(400).json({ error: 'Vendor Code too long (max 50)' });
  if (contact_person && contact_person.length > 150) return res.status(400).json({ error: 'Contact Person too long (max 150)' });
  if (mobile_no && mobile_no.length > 20) return res.status(400).json({ error: 'Mobile No too long (max 20)' });

  if (pin_code && (isNaN(pin_code) || pin_code.toString().length > 6)) return res.status(400).json({ error: 'Invalid Pin Code' });

  //const idempotencyKey = req.headers['idempotency-key']?.trim() || null;

  const client = await req.db.getConnection();
  try {
    // ... transaction code ...
    await client.beginTransaction();

    const insertSql = `INSERT INTO parties
      (party_name, gstin_no, type, billing_address, shipping_address, supply_state_code, vendore_code, pin_code, contact_person, mobile_no)
      VALUES (?,?,?,?,?,?,?,?,?,?)`;

    const vals = [party_name, gstin_no, type, billing_address, shipping_address, supply_state_code, vendore_code, pin_code, contact_person, mobile_no]
    const [resHeader] = await client.query(insertSql, vals);

    const result = {
      party: {
        party_name, gstin_no, type, billing_address, shipping_address, supply_state_code, vendore_code, pin_code, contact_person, mobile_no
      }
    };

    // store idempotency result (optional)
    // if (idempotencyKey) {
    //   await client.query(
    //     `INSERT INTO idempotency_store (key, response_body) VALUES (?, ?)`,
    //     [idempotencyKey, JSON.stringify(result)]
    //   );
    // }

    await client.commit();

    const status = res.status(201).json(result);
  } catch (err) {
    await client.rollback();
    console.error('createParty error', err);
    if (err.errno === 1062) {
      return res.status(409).json({ error: 'Duplicate key' });
    }
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  } finally {
    client.release();
  }
}

function formatLedgerDate(dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function ledgerData(req, res) {
  const client = await req.db.getConnection();
  try {
    console.log("Working");
    const [rows] = await client.query(`
      SELECT
        t.transaction_id,
        t.transaction_date,
        t.invoice_no,
        t.transaction_type,
        t.status,
        t.party_id,
        p.party_name,
        COALESCE(t.sell_amount, 0)   AS debit,
        (
           SELECT COALESCE(SUM(credit_amount), 0)
           FROM transactions t2
           WHERE t2.invoice_no = t.invoice_no
           AND t2.transaction_type = 'RECEIPT'
        ) AS credit
      FROM transactions t
      JOIN parties p ON p.party_id = t.party_id
      WHERE t.transaction_type = 'SALE'
      ORDER BY t.transaction_date ASC, t.transaction_id ASC
    `);

    const ledger = rows.map(r => ({
      date: formatLedgerDate(r.transaction_date),
      invoice: r.invoice_no,
      client: r.party_name,
      party_id: r.party_id,
      debit: Number(r.debit),
      credit: Number(r.credit),
      transaction_type: r.transaction_type,
      transaction_id: r.transaction_id,
      status: r.status || 'active'
    }));

    res.json({ ledger });
  } catch (err) {
    console.log("Ledger error ", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

async function createTransactionHandler(req, res) {
  const { invoice, invoice_details, items, totals } = req.body;

  const {
    InvoiceNo,
    InvoiceDate,
    party_id,
    transaction_type = "sale",
    subtotal,
    cgst,
    sgst,
    GSTIN,
    Terms
  } = invoice;

  // ✅ Validation (corrected)
  if (!InvoiceNo || !party_id || subtotal == null) {
    return res.status(400).json({
      error: "InvoiceNo, party_id and subtotal are required"
    });
  }

  const client = await req.db.getConnection();

  try {
    await client.beginTransaction();
    console.log("Tried");


    // ✅ Prevent duplicate invoice numbers
    const [dup] = await client.query(
      "SELECT transaction_id FROM transactions WHERE invoice_no = ?",
      [InvoiceNo]
    );

    if (dup.length > 0) {
      await client.rollback();
      return res.status(409).json({
        error: "Transaction with this invoice no already exists",
        transaction_id: dup[0].transaction_id
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

    // ✅ GST calculations
    const cgst_amount = (subtotal * cgstRate) / 100;
    const sgst_amount = (subtotal * sgstRate) / 100;
    const igst_amount = (subtotal * igstRate) / 100;

    const taxable_amount = subtotal;
    const gst_percentage = cgstRate + sgstRate + igstRate;

    const total_amount =
      taxable_amount + cgst_amount + sgst_amount + igst_amount;

    const round_off = Math.round(total_amount) - total_amount;

    const debit_amount =
      transaction_type === "SALE" ? total_amount + round_off : 0;

    const credit_amount =
      transaction_type === "PURCHASE" ? total_amount + round_off : 0;

    // ✅ Insert


    const insertSql = `
      INSERT INTO transactions (
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
        round_off,
        gst_percentage,
        gst_number,
        narration
      )
      VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )
    `;

    const values = [
      InvoiceDate || new Date(),
      InvoiceNo,
      transaction_type,
      party_id,
      debit_amount,
      credit_amount,
      taxable_amount,
      igst_amount,
      cgst_amount,
      sgst_amount,
      round_off,
      gst_percentage,
      GSTIN || null,
      Terms || `Invoice ${InvoiceNo}`
    ];

    const [txResult] = await client.query(insertSql, values);

    const transaction_id = txResult.insertId;

    const invoiceDetailsSql = `
  INSERT INTO invoice_details (
    invoice_no,
    invoice_date,
    transported_by,
    place_of_supply,
    vehical_no,
    eway_bill_no,
    vendore_code,
    po_no,
    po_date,
    challan_no,
    challan_date,
    account_name,
    account_no,
    ifsc_code,
    branch,
    terms_conditions,
    client_name,
    client_address,
    gstin,
    client_name2,
    client_address2,
    gstin2
  )
  VALUES (
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
  )
`;

    const invoiceDetailsValues = [
      InvoiceNo,
      InvoiceDate || new Date(),

      invoice_details.transported_by || null,
      invoice_details.place_of_supply || null,
      invoice_details.vehicle_no || null,
      invoice_details.eway_bill_no || null,
      invoice_details.vendor_code || null,

      invoice_details.po_no || null,
      invoice_details.po_date || null,
      invoice_details.challan_no || null,
      invoice_details.challan_date || null,

      invoice_details.account_name || null,
      invoice_details.account_no || null,
      invoice_details.ifsc_code || null,
      invoice_details.branch || null,
      invoice_details.terms_conditions || null,

      invoice_details.client_name || null,
      invoice_details.client_address || null,
      invoice_details.gstin || null,
      invoice_details.client_name2 || null,
      invoice_details.client_address2 || null,
      invoice_details.gstin2 || null
    ];

    await client.query(invoiceDetailsSql, invoiceDetailsValues);

    for (const item of items) {
      if (!item.item_id) {
        throw new Error(
          `Item must have item_id or HSNCode (invoice ${InvoiceNo})`
        );
      }

      await client.query(
        `
        INSERT INTO sell_summary (
          invoice_no,
          item_id,
          units_sold
        )
        VALUES (?,?,?)
        `,
        [
          InvoiceNo,
          item.item_id || null, // preferred FK
          Number(item.quantity) || 0
        ]
      );
    }

    await client.commit();

    return res.status(201).json({ success: true, transaction_id });

  } catch (err) {
    await client.rollback();
    console.error("createTransaction error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

/**
 * Get complete invoice details for editing
 */
async function getInvoiceDetailsHandler(req, res) {
  // FIXED: Handle both query param (new) and path param (legacy)
  const invoiceNo = req.query.invoice_no || req.params.invoice_no;

  if (!invoiceNo) {
    return res.status(400).json({ error: "Invoice number required" });
  }

  try {
    // Fetch transaction (main invoice)
    const [transactions] = await req.db.query(
      'SELECT * FROM transactions WHERE invoice_no = ?',
      [invoiceNo]
    );

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const transaction = transactions[0];

    // Fetch invoice_detail
    const [invoiceDetails] = await req.db.query(
      'SELECT * FROM invoice_details WHERE invoice_no = ?',
      [invoiceNo]
    );

    // Fetch items from sell_summary with item details
    const [sellSummary] = await req.db.query(
      `SELECT 
        ss.*,
        i.item_name as description,
        i.hsn_code,
        i.rate as unit_price
      FROM sell_summary ss
      LEFT JOIN items i ON ss.item_id = i.item_id
      WHERE ss.invoice_no = ?`,
      [invoiceNo]
    );

    // Fetch party details if party_id exists
    let party = null;
    if (transaction.party_id) {
      const [parties] = await req.db.query(
        'SELECT * FROM parties WHERE party_id = ?',
        [transaction.party_id]
      );
      party = parties[0] || null;
    }

    // Map to match frontend expected format
    const invoiceData = {
      invoice: {
        invoice_no: transaction.invoice_no,
        invoice_date: transaction.transaction_date,
        gstin: transaction.gst_number,
        party_id: transaction.party_id,
        transaction_type: transaction.transaction_type,
        subtotal: transaction.taxable_amount,
        cgst: transaction.cgst_amount > 0 ? (transaction.cgst_amount / transaction.taxable_amount * 100) : 0,
        sgst: transaction.sgst_amount > 0 ? (transaction.sgst_amount / transaction.taxable_amount * 100) : 0,
        terms: transaction.narration,
        status: transaction.status // Add status for frontend handling
      },
      invoice_details: invoiceDetails[0] || {},
      items: sellSummary.map(item => ({
        item_id: item.item_id,
        description: item.description,
        hsn_code: item.hsn_code,
        quantity: item.units_sold,
        unit_price: item.unit_price,
        price: item.unit_price // For compatibility
      })),
      party: party
    };

    return res.status(200).json({
      success: true,
      ...invoiceData
    });

  } catch (error) {
    console.error('Get invoice details error details:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}


const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`App has started on ${PORT}`);
  // Initialize Quotation Tables (if missing)
  await setupQuotationTables();
});

routerB.post('/', validateItem, createItemHandler);

router.post('/', validateParty, createPartyHandler);

routerTransaction.post("/", createTransactionHandler);
routerTransaction.get("/invoiceNo", getNextInvoiceNumber);
routerTransaction.get("/details", getInvoiceDetailsHandler);
// Fallback for legacy clients using path parameter
routerTransaction.get("/:invoice_no/details", getInvoiceDetailsHandler);

routerParty.get('/', partyList);
routerParty.get('/:id', partyDetails);

routerItems.get('/:id', itemDetails);

routerLedger.get('/', ledgerData);
routerLedger.post('/payment', createPaymentHandler);
routerLedger.get("/payments", getInvoiceHistoryHandler);
routerLedger.delete("/payment/:transactionId", deletePaymentHandler);

async function deletePaymentHandler(req, res) {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ error: "Transaction ID is required" });
  }

  const client = await req.db.getConnection();
  try {
    const [result] = await client.query(
      "DELETE FROM transactions WHERE transaction_id = ? AND transaction_type = 'RECEIPT'",
      [transactionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Payment not found or is not a receipt" });
    }

    res.json({ success: true, message: "Payment deleted successfully" });
  } catch (err) {
    console.error("Delete payment error:", err);
    res.status(500).json({ error: "Failed to delete payment" });
  } finally {
    client.release();
  }
}

// Cancel invoice endpoint
async function cancelInvoiceHandler(req, res) {
  const { invoice_no } = req.params;
  const user_id = req.user?.user_id; // From auth middleware

  if (!invoice_no) {
    return res.status(400).json({ error: 'Invoice number is required' });
  }

  const client = await req.db.getConnection();

  try {
    await client.beginTransaction();

    // Check if invoice exists and is not already cancelled
    const [existing] = await client.query(
      `SELECT status, invoice_no FROM transactions 
       WHERE invoice_no = ? AND transaction_type = 'SALE' LIMIT 1`,
      [invoice_no]
    );

    if (existing.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (existing[0].status === 'cancelled') {
      await client.rollback();
      return res.status(400).json({ error: 'Invoice is already cancelled' });
    }

    // Update invoice status to cancelled
    await client.query(
      `UPDATE transactions 
       SET status = 'cancelled', 
           cancelled_at = NOW(), 
           cancelled_by = ?
       WHERE invoice_no = ?`,
      [user_id, invoice_no]
    );

    await client.commit();

    res.json({
      success: true,
      message: 'Invoice cancelled successfully',
      invoice_no
    });

  } catch (err) {
    await client.rollback();
    console.error('Cancel invoice error:', err);
    return res.status(500).json({ error: 'Failed to cancel invoice' });
  } finally {
    client.release();
  }
}

// Reverse (un-cancel) invoice endpoint
async function reverseInvoiceHandler(req, res) {
  const { invoice_no } = req.params;
  const user_id = req.user?.user_id; // From auth middleware

  if (!invoice_no) {
    return res.status(400).json({ error: 'Invoice number is required' });
  }

  const client = await req.db.getConnection();

  try {
    await client.beginTransaction();

    // Check if invoice exists and is cancelled
    const [existing] = await client.query(
      `SELECT status, invoice_no FROM transactions 
       WHERE invoice_no = ? AND transaction_type = 'SALE' LIMIT 1`,
      [invoice_no]
    );

    if (existing.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (existing[0].status !== 'cancelled') {
      await client.rollback();
      return res.status(400).json({ error: 'Invoice is not cancelled' });
    }

    // Update invoice status to active (null is the default/active state)
    await client.query(
      `UPDATE transactions 
       SET status = NULL, 
           cancelled_at = NULL, 
           cancelled_by = NULL
       WHERE invoice_no = ?`,
      [invoice_no]
    );

    await client.commit();

    res.json({
      success: true,
      message: 'Invoice reversed successfully',
      invoice_no
    });

  } catch (err) {
    await client.rollback();
    console.error('Reverse invoice error:', err);
    return res.status(500).json({ error: 'Failed to reverse invoice' });
  } finally {
    client.release();
  }
}

// Delete Invoice Handler
async function deleteInvoiceHandler(req, res) {
  // ROBUST FIX: Check query, body, then params. 
  // This allows DELETE /createInvoice?invoice_no=RKCT/2025/001 (Safe)
  const invoice_no = req.query.invoice_no || req.body.invoice_no || req.params.invoice_no;

  if (!invoice_no) {
    return res.status(400).json({ error: 'Invoice number is required (pass as query param)' });
  }

  const client = await req.db.getConnection();

  try {
    await client.beginTransaction();

    // Check if invoice exists
    const [existing] = await client.query(
      `SELECT invoice_no FROM transactions 
       WHERE invoice_no = ? AND transaction_type = 'SALE' LIMIT 1`,
      [invoice_no]
    );

    if (existing.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Delete from sell_summary first (foreign key constraint)
    await client.query(
      `DELETE FROM sell_summary WHERE invoice_no = ?`,
      [invoice_no]
    );

    // Delete from invoice_details
    await client.query(
      `DELETE FROM invoice_details WHERE invoice_no = ?`,
      [invoice_no]
    );

    // Delete all transactions with this invoice number (SALE and RECEIPT)
    await client.query(
      `DELETE FROM transactions WHERE invoice_no = ?`,
      [invoice_no]
    );

    await client.commit();

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      invoice_no
    });

  } catch (err) {
    await client.rollback();
    console.error('Delete invoice error:', err);
    return res.status(500).json({ error: 'Failed to delete invoice' });
  } finally {
    client.release();
  }
}

// Wrapper for Cancel Handler to support Query Params
const safeCancelHandler = (req, res, next) => {
  // Inject query param into where the original function expects it
  if (req.query.invoice_no || req.body.invoice_no) {
    req.params.invoice_no = req.query.invoice_no || req.body.invoice_no;
  }
  return cancelInvoiceHandler(req, res, next);
};

// Wrapper for Reverse Handler to support Query Params
const safeReverseHandler = (req, res, next) => {
  // Inject query param into where the original function expects it
  if (req.query.invoice_no || req.body.invoice_no) {
    req.params.invoice_no = req.query.invoice_no || req.body.invoice_no;
  }
  return reverseInvoiceHandler(req, res, next);
};

// MOUNT ROUTES
// 1. DELETE /createInvoice?invoice_no=... (Robust)
routerTransaction.delete('/', deleteInvoiceHandler);
// 2. DELETE /createInvoice/:invoice_no (Legacy/Simple)
routerTransaction.delete('/:invoice_no', deleteInvoiceHandler);

// 3. PUT /ledger/cancel?invoice_no=... (Robust)
routerLedger.put('/cancel', safeCancelHandler);
// 4. PUT /ledger/cancel/:invoice_no (Legacy)
routerLedger.put('/cancel/:invoice_no', safeCancelHandler);

// 5. PUT /ledger/reverse?invoice_no=... (Robust)
routerLedger.put('/reverse', safeReverseHandler);
// 6. PUT /ledger/reverse/:invoice_no (Legacy)
routerLedger.put('/reverse/:invoice_no', safeReverseHandler);

// Fallback
app.put('/api/ledger/cancel', safeCancelHandler);
app.put('/api/ledger/reverse', safeReverseHandler);

console.log('🚀 BACKEND VERSION 2.0.0 - INVOICE CANCELLATION ENABLED');

app.use('/parties', routerParty);
app.use('/ledger', routerLedger);
app.use('/item_id', routerItems);
app.use('/createParty', router);
app.use('/createInvoice', routerTransaction);
app.use('/createItem', routerB);

// Update Invoice Handler (Admin Only)
async function updateInvoiceHandler(req, res) {
  // 🔒 Security: Only Admins can update in-place
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Only admins can update invoices." });
  }

  const { invoice_no } = req.params;
  const { invoice, invoice_details, items } = req.body;

  if (!invoice_no) {
    return res.status(400).json({ error: "Invoice number is required" });
  }

  const client = await req.db.getConnection();

  try {
    await client.beginTransaction();

    // 1. Verify Invoice Exists
    const [existing] = await client.query(
      "SELECT transaction_id, party_id FROM transactions WHERE invoice_no = ? AND transaction_type = 'SALE'",
      [invoice_no]
    );

    if (existing.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: "Invoice not found" });
    }

    // 2. Fetch Party State Code (for tax recalc)
    // Use the NEW party_id from body if provided, else keep existing
    const partyId = invoice.party_id || existing[0].party_id;

    const [partyRows] = await client.query("SELECT supply_state_code FROM parties WHERE party_id = ?", [partyId]);
    if (partyRows.length === 0) {
      await client.rollback();
      return res.status(404).json({ error: "Party not found" });
    }

    const stateCode = partyRows[0].supply_state_code;
    let cgstRate = 0, sgstRate = 0, igstRate = 0;

    const sc = String(stateCode || '').trim();
    if (sc === '20') { // Jharkhand
      cgstRate = 9;
      sgstRate = 9;
      igstRate = 0;
    } else {
      cgstRate = 0;
      sgstRate = 0;
      igstRate = 18;
    }

    // 3. Recalculate Totals
    const subtotal = Number(invoice.subtotal) || 0;
    const cgst_amount = (subtotal * cgstRate) / 100;
    const sgst_amount = (subtotal * sgstRate) / 100;
    const igst_amount = (subtotal * igstRate) / 100;
    const total_amount = subtotal + cgst_amount + sgst_amount + igst_amount;
    const round_off = Math.round(total_amount) - total_amount;
    const final_amount = Math.round(total_amount);

    // 4. Update Transactions Table
    await client.query(`
      UPDATE transactions SET
        transaction_date = ?,
        party_id = ?,
        taxable_amount = ?,
        cgst_amount = ?,
        sgst_amount = ?,
        igst_amount = ?,
        sell_amount = ?,
        round_off = ?,
        narration = ?
      WHERE invoice_no = ? AND transaction_type = 'SALE'
    `, [
      invoice.InvoiceDate,
      partyId,
      subtotal,
      cgst_amount,
      sgst_amount,
      igst_amount,
      final_amount,
      round_off,
      invoice.Terms,
      invoice_no
    ]);

    // 5. Update Invoice Details
    await client.query(`
      UPDATE invoice_details SET
        transported_by = ?, place_of_supply = ?, vehical_no = ?, eway_bill_no = ?, vendore_code = ?,
        po_no = ?, po_date = ?, challan_no = ?, challan_date = ?,
        account_name = ?, account_no = ?, ifsc_code = ?, branch = ?,
        terms_conditions = ?,
        client_name = ?, client_address = ?, gstin = ?,
        client_name2 = ?, client_address2 = ?, gstin2 = ?
      WHERE invoice_no = ?
    `, [
      invoice_details.transported_by, invoice_details.place_of_supply, invoice_details.vehicle_no, invoice_details.eway_bill_no, invoice_details.vendor_code,
      invoice_details.po_no, invoice_details.po_date, invoice_details.challan_no, invoice_details.challan_date,
      invoice_details.account_name, invoice_details.account_no, invoice_details.ifsc_code, invoice_details.branch,
      invoice_details.terms_conditions,
      invoice_details.client_name, invoice_details.client_address, invoice_details.gstin,
      invoice_details.client_name2, invoice_details.client_address2, invoice_details.gstin2,
      invoice_no
    ]);

    // 6. Update Items (Delete + Re-insert)
    await client.query("DELETE FROM sell_summary WHERE invoice_no = ?", [invoice_no]);

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(`
          INSERT INTO sell_summary (invoice_no, item_id, units_sold)
          VALUES (?, ?, ?)
        `, [
          invoice_no,
          item.item_id,
          Number(item.quantity) || 0
        ]);
      }
    }

    await client.commit();
    res.json({ success: true, message: "Invoice updated successfully", invoice_no });

  } catch (err) {
    await client.rollback();
    console.error("updateInvoiceHandler error:", err);
    res.status(500).json({ error: "Failed to update invoice" });
  } finally {
    client.release();
  }
}

routerTransaction.put('/:invoice_no', updateInvoiceHandler);