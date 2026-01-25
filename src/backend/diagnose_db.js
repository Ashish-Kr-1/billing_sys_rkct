import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log("Testing connection specifically for u971268451_billing_system...");
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log("✅ SUCCESS: Connected to Hostinger MySQL!");
        await connection.end();
    } catch (error) {
        console.error("❌ FAILED: Connection rejected.");
        console.error("Error Code:", error.code);
        console.error("Message:", error.message);
        console.error("---------------------------------------------------");
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            const ipMatch = error.message.match(/@'([\d\.]+)'/);
            const detectedIp = ipMatch ? ipMatch[1] : 'UNKNOWN';
            console.error(`ACTION REQUIRED: Hostinger is blocking your IP address: ${detectedIp}`);
            console.error("1. Log in to hpanel.hostinger.com");
            console.error("2. Go to Databases -> Remote MySQL");
            console.error(`3. Add this IP to the list: ${detectedIp}`);
            console.error("4. Click 'Create' and try again.");
        }
    }
}

testConnection();
