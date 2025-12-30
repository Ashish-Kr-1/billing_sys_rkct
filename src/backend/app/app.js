import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from "../db.js";
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import path from 'path';

dotenv.config()

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
  "http://localhost:5000",        // if used
  "https://billing.rkcasting.in",
  "https://billing-sys-rkct.onrender.com"  // production frontend
];

app.use(express.json())

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman, curl
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


//endpoint to test database
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/parties', async (req, res) => {
  try {
    const result = await pool.query("SELECT party_id, party_name FROM parties ORDER BY party_name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})


app.get('/itemNames', async (req, res) => {
  try {
    const result = await pool.query("SELECT item_id, item_name FROM items ORDER BY item_name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM transactions");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/items', async (req, res) => {
  try {
    const result = await pool.query("SELECT * from items");
    res.json(result);
    console.log(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

async function partyList(req, res){
  const client = await pool.connect();
  try{
    await client.query("BEGIN");
    const result = await pool.query("SELECT party_id, party_name FROM parties ORDER BY party_name");
    res.json(result.rows);
  }catch(err){
    await client.query('ROLLBACK').catch(() => { });
    console.log("Party list error ".err);
    if(err.code=='23505')
      return res.status(409).json({error: "Duplicate key"});
    return res.status(500).json({error: "Internal server error"});
  }finally{
    client.release();
  }
}

async function partyDetails(req, res){
  const client = await pool.connect();
  const partyId = parseInt(req.params.id, 10);

  if (!Number.isInteger(partyId)) {
    return res.status(400).json({ error: 'Invalid party id' });
  }

  try{
    await client.query("BEGIN");

    const { rows } = await pool.query(
      `
      SELECT
        party_id,
        party_name,
        gstin_no,
        billing_address,
        shipping_address
      FROM parties
      WHERE party_id = $1
      `,
      [partyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }

    return res.json({ party: rows[0] });
  }catch(err){
    await client.query('ROLLBACK').catch(() => { });
    console.log("Party list error ".err);
    if(err.code=='23505')
      return res.status(409).json({error: "Duplicate key"});
    return res.status(500).json({error: "Internal server error"});
  }finally{
    client.release();
  }
}

async function itemDetails(req, res){
  const client = await pool.connect();
  const itemId = parseInt(req.params.id, 10);

  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try{
    await client.query("BEGIN");

    const { rows } = await pool.query(
      `
      SELECT
        item_id,
        item_name,
        hsn_code,
        unit,
        rate
      FROM items
      WHERE item_id = $1
      `,
      [itemId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json({ item: rows[0] });
  }catch(err){
    await client.query('ROLLBACK').catch(() => { });
    console.log("Item list error ".err);
    if(err.code=='23505')
      return res.status(409).json({error: "Duplicate key"});
    return res.status(500).json({error: "Internal server error"});
  }finally{
    client.release();
  }
}

async function getNextInvoiceNumber(req, res){
  const client = await pool.connect();
  try{
    await client.query("BEGIN");
    const prefix = 'RK'; 

  const result = await pool.query(`
    SELECT invoice_no
    FROM transactions
    WHERE invoice_no LIKE $1
    ORDER BY created_at DESC
    LIMIT 1
  `, [`${prefix}/%`]);

  let nextNumber = 1;

  if (result.rows.length > 0) {
    const lastInvoiceNo = result.rows[0].invoice_no; // RK/012
    const lastNumber = parseInt(lastInvoiceNo.split('/')[1], 10);
    nextNumber = lastNumber + 1;
  }

  const formatted = `${prefix}/${String(nextNumber).padStart(3, '0')}`;

  return res.json({ InvoiceNo: formatted });
  }catch(err){
    await client.query('ROLLBACK').catch(() => { });
    console.error('invoice number error', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Duplicate key' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }finally{
    client.release();
  }
}

app.get('/number', getNextInvoiceNumber);

async function createItemHandler(req, res) {
  const {
    item_name, hsn_code, unit, rate
  } = req.body;
  console.log(req.body)

  //if (!hsn_code) return res.status(400).json({ error: 'All fields are required' })

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const dup = await client.query("SELECT item_id from items WHERE hsn_code = $1", [hsn_code]);
    if (dup.rowCount > 0) {
      await client.query("ROLLBACK")
      return res.status(409).json({ error: 'Item with this hsn code already exists', item_id: dup.rows[0].item_id });
    }

    const INSERT_SQL = `INSERT INTO items
      (item_name, hsn_code, unit, rate)
      VALUES ($1,$2,$3,$4)
      RETURNING item_name, hsn_code, unit, rate`;

    const vals = [item_name, hsn_code, unit, rate]
    const { rows } = await client.query(INSERT_SQL, vals);

    const result = { party: rows[0] };

    await client.query('COMMIT');

    const status = res.status(201).json(result);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
    console.error('create item error', err);
    if (err.code === '23505') {
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If you want to prevent duplicates by GSTIN:
    if (gstin_no) {
      const dup = await client.query('SELECT party_id FROM parties WHERE gstin_no = $1', [gstin_no]);
      if (dup.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Party with this GSTIN already exists', party_id: dup.rows[0].party_id });
      }
    }

    const insertSql = `INSERT INTO parties
      (party_name, gstin_no, type, billing_address, shipping_address, supply_state_code, vendore_code, pin_code, contact_person, mobile_no)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING party_name, gstin_no, type, billing_address, shipping_address, supply_state_code, vendore_code, pin_code, contact_person, mobile_no`;

    const vals = [party_name, gstin_no, type, billing_address, shipping_address, supply_state_code, vendore_code, pin_code, contact_person, mobile_no]
    const { rows } = await client.query(insertSql, vals);

    const result = { party: rows[0] };

    // store idempotency result (optional)
    // if (idempotencyKey) {
    //   await client.query(
    //     `INSERT INTO idempotency_store (key, response_body) VALUES ($1, $2)`,
    //     [idempotencyKey, JSON.stringify(result)]
    //   );
    // }

    await client.query('COMMIT');

    const status = res.status(201).json(result);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
    console.error('createParty error', err);
    if (err.code === '23505') {
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

async function ledgerData(req, res){
  const client = await pool.connect();
  try{
    console.log("Working");
    const { rows } = await pool.query(`
      SELECT
        t.transaction_id,
        t.transaction_date,
        t.invoice_no,
        t.transaction_type,
        p.party_name,
        COALESCE(t.sell_amount, 0)   AS debit,
        COALESCE(t.credit_amount, 0) AS credit
      FROM transactions t
      JOIN parties p ON p.party_id = t.party_id
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
  }catch(err){
    await client.query('ROLLBACK').catch(() => { });
    console.log("Ledger error ".err);
    return res.status(500).json({error: "Internal server error"});
  }finally{
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

  const client = await pool.connect();

  try {

    await client.query("BEGIN");
    console.log("Tried");


    // ✅ Prevent duplicate invoice numbers
    const dup = await client.query(
      "SELECT transaction_id FROM transactions WHERE invoice_no = $1",
      [InvoiceNo]
    );

    if (dup.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Transaction with this invoice no already exists",
        transaction_id: dup.rows[0].transaction_id
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
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
      RETURNING transaction_id
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

    const txResult = await client.query(insertSql, values);

    const transaction_id = txResult.transaction_id;

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
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
    $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
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
      if (!item.item_id ) {
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
        VALUES ($1,$2,$3)
        `,
        [
          InvoiceNo,
          item.item_id || null, // preferred FK
          Number(item.quantity) || 0
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({ success: true, transaction_id });

  } catch (err) {
    await client.query("ROLLBACK");
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

app.use('/parties',routerParty);
app.use('/ledger', routerLedger);
app.use('/item_id',routerItems);
app.use('/createParty', router);
app.use('/createItem', routerB);
app.use('/createInvoice', routerTransaction);