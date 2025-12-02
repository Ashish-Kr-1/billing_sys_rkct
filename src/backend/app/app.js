import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from "../src/db.js";
import dotenv from 'dotenv';
import path from 'path';

const app = express()
dotenv.config()

app.use(express.json())
app.use(cors())
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

app.listen(5000, () => {
    console.log("App has started on 5000");
});


