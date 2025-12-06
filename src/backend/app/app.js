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

// const validators = [
//   body('party_name').trim().notEmpty().withMessage('party_name required').isLength({ max: 200 }),
//   body('gstin_no').optional({ checkFalsy: true }).isLength({ max: 20 }).matches(/^[0-9A-Z]{15}$/).withMessage('GSTIN format (15 chars uppercase)'),
//   body('type').trim().notEmpty().isIn(['customer', 'supplier']).withMessage('type must be customer or supplier'),
//   body('billing_address').optional({ checkFalsy: true }).isLength({ max: 2000 }),
//   body('shipping_address').optional({ checkFalsy: true }).isLength({ max: 2000 }),
//   body('supply_state_code').optional({ checkFalsy: true }).isLength({ max: 10 }),
//   body('vendor_code').optional({ checkFalsy: true }).isLength({ max: 50 })
// ];

app.use(express.json())
app.use(cors({ origin: "http://localhost:5173" }));
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
    const result = await pool.query("SELECT * from parties");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})


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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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


app.listen(5000, () => {
  console.log("App has started on 5000");
});



router.post('/', createPartyHandler);

app.use('/createParty', router);
