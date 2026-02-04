import { api, handleApiResponse } from "./config/apiClient.js";

// ... sample data comments ...

export default async function getPartyList() {
  try {
    const data = await handleApiResponse(api.get('/parties'));
    console.log(data);
    return data;
  } catch (err) {
    console.error("Network error:", err);
    alert("Network error: " + err.message);
  }
}