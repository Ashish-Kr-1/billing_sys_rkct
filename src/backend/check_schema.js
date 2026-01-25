import pool from "./db.js";

async function checkSchema() {
    try {
        const [rows] = await pool.query("DESCRIBE transactions;");
        console.log("Schema for 'transactions' table:");
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error("Error describing table:", err.message);
        process.exit(1);
    }
}

checkSchema();
