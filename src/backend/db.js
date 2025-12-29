import pg from 'pg';
import dotenv from 'dotenv';
import dns from "dns";


dns.setDefaultResultOrder("ipv4first");

dotenv.config({path:"./.env"})

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL not set in environment');
}

const pool = new Pool(
    {
        connectionString,
        ssl: {rejectUnauthorized:false},
        max:10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    }
);

pool.on("error", () => {
    console.error("Unexpected pg error",err);
}
);

export default pool;
export async function query (text, params){
    return pool.query(text, params);
};