import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from "../db.js";
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import path from 'path';
import bcrypt from "bcrypt";
import {
  initAuthTable,
  createUser,
  findUserByIdentifier,
  updatePassword
} from "./auth.db.js";


dotenv.config()

const app = express()

// ✅ INIT AUTH TABLE ON STARTUP
await initAuthTable();
console.log("✅ Auth table initialized");

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

//endpoint for api status
app.get('/health', async (req, res) => res.json({ status: 'ok' }));

//Check

//endpoint to test database
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW()");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/parties', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT party_id, party_name FROM parties ORDER BY party_name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})


app.get('/itemNames', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT item_id, item_name FROM items ORDER BY item_name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM transactions");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/items', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * from items");
    res.json({ rows }); // Frontend might expect { rows: [] } structure based on previous code or just array? 
    // Previous code: res.json(result); which sends the whole PG object { command, rowCount, rows: [] }.
    // Frontend likely uses data.rows.
    console.log(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

async function partyList(req, res) {
  const client = await pool.getConnection(); // MySQL
  try {
    await client.beginTransaction();
    const [rows] = await client.query("SELECT party_id, party_name FROM parties ORDER BY party_name");
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
  const client = await pool.getConnection();
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
        billing_address,
        shipping_address
      FROM parties
      WHERE party_id = ?
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
  const client = await pool.getConnection();
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
  const client = await pool.getConnection(); // MySQL
  try {
    await client.beginTransaction();
    const prefix = 'RKCT/2025-26';

    const [rows] = await client.query(`
    SELECT invoice_no
    FROM transactions
    WHERE invoice_no LIKE ?
    ORDER BY created_at DESC
    LIMIT 1
  `, [`${prefix}/%`]);

    let nextNumber = 1;

    if (rows.length > 0) {
      const lastInvoiceNo = rows[0].invoice_no; // RKCT/2025-26/012
      const lastNumber = parseInt(lastInvoiceNo.split('/')[2], 10);
      nextNumber = lastNumber + 1;
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

  const client = await pool.getConnection();

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
    const [rows] = await pool.query(
      `
      SELECT
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

  const client = await pool.getConnection();

  try {
    await client.beginTransaction();

    const [dup] = await client.query("SELECT item_id from items WHERE hsn_code = ?", [hsn_code]);
    if (dup.length > 0) {
      await client.rollback()
      return res.status(409).json({ error: 'Item with this hsn code already exists', item_id: dup[0].item_id });
    }

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

  if (!party_name || !type) {
    return res.status(400).json({ error: 'party_name and type are required' });
  }

  //const idempotencyKey = req.headers['idempotency-key']?.trim() || null;

  const client = await pool.getConnection();
  try {
    await client.beginTransaction();

    // If you want to prevent duplicates by GSTIN:
    if (gstin_no) {
      const [dup] = await client.query('SELECT party_id FROM parties WHERE gstin_no = ?', [gstin_no]);
      if (dup.length > 0) {
        await client.rollback();
        return res.status(409).json({ error: 'Party with this GSTIN already exists', party_id: dup[0].party_id });
      }
    }

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
    return res.status(500).json({ error: 'Internal server error' });
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
  const client = await pool.getConnection();
  try {
    console.log("Working");
    const [rows] = await client.query(`
      SELECT
        t.transaction_id,
        t.transaction_date,
        t.invoice_no,
        t.transaction_type,
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
      debit: Number(r.debit),
      credit: Number(r.credit),
      transaction_type: r.transaction_type,
      transaction_id: r.transaction_id
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

  const client = await pool.getConnection();

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

    // ✅ GST calculations
    const cgst_amount = (subtotal * Number(cgst)) / 100;
    const sgst_amount = (subtotal * Number(sgst)) / 100;
    const igst_amount = 0;

    const taxable_amount = subtotal;
    const gst_percentage = Number(cgst) + Number(sgst);

    const total_amount =
      taxable_amount + cgst_amount + sgst_amount;

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


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App has started on ${PORT}`);
});

routerB.post('/', createItemHandler);

router.post('/', createPartyHandler);

routerTransaction.post("/", createTransactionHandler);
routerTransaction.get("/invoiceNo", getNextInvoiceNumber);

routerParty.get('/', partyList);
routerParty.get('/:id', partyDetails);

routerItems.get('/:id', itemDetails);

routerLedger.get('/', ledgerData);
routerLedger.post('/payment', createPaymentHandler);

routerLedger.get("/payments", getInvoiceHistoryHandler);

app.use('/parties', routerParty);
app.use('/ledger', routerLedger);
app.use('/item_id', routerItems);
app.use('/createParty', router);
app.use('/createItem', routerB);
app.use('/createInvoice', routerTransaction);
// ==========================
// AUTH ROUTES
// ==========================

// SIGNUP
app.post("/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await createUser(username, email, hash);
    res.json({ message: "Account created" });
  } catch (err) {
    if (err.errno === 1062) {
      return res.status(409).json({ message: "User already exists" });
    }
    console.error("Signup error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// LOGIN
app.post("/auth/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// RESET PASSWORD
app.post("/auth/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const updated = await updatePassword(email, hash);

    if (!updated) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Reset password error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
