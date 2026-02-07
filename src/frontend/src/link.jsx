import { api, handleApiResponse } from "./config/apiClient.js";

// ... comments ...

export default async function createParty(data) {

    try {
        const result = await handleApiResponse(api.post('/createParty', data));

        console.log("Party created:", result.party);
    } catch (err) {
        console.error("Network error:", err);
        throw err;
    }
}