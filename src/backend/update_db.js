import { dbManager } from './db.js';

async function updateDb() {
  try {
    console.log("Updating Company 1...");
    await dbManager.query(1, "UPDATE companies SET mobile_no = '+919288020166'");
    console.log("Successfully updated RK Casting database.");
    
    // Also updating company 2 just in case they want it for both RK Casting and RK Eng
    // await dbManager.query(2, "UPDATE companies SET mobile_no = '+919288020166'");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

updateDb();
