import { api, handleApiResponse } from "./config/apiClient.js";

// ... comments ...

export default async function createItem(data) {
    try {
        const result = await handleApiResponse(api.post('/createItem', data));

        console.log("Item created:", result.item);
    } catch (err) {
        console.error("Network error:", err);
        throw err;
    }
}