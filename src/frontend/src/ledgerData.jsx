import { api, handleApiResponse } from "./config/apiClient.js";

export default async function ledgerData() {
    try {
        const data = await handleApiResponse(api.get('/ledger'));
        return data;
    } catch (err) {
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}