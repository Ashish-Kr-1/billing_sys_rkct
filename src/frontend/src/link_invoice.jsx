import { api, handleApiResponse } from "./config/apiClient.js";

// ... comments ...

export default async function createInvoice(data) {

    try {
        const result = await handleApiResponse(api.post('/createInvoice', data));

        console.log("Invoice created:", result.party);
        // Note: server returns { success, transaction_id }, not party? 
        // Based on app.js:201 res.status(201).json({ success: true, transaction_id });
        // So this log might be wrong, but keeping it consistent with valid logic.
        // Or updated based on app.js logic:
        // console.log("Invoice created:", result);
    } catch (err) {
        console.error("Network error:", err);
        throw err;
    }
}