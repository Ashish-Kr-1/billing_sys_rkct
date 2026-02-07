import { api } from './config/apiClient';
import { notify } from './components/Notification';

/** Sample data
{
  "party": {
    "party_id": 1,
    "party_name": "ACC Limited",
    "gstin_no": "20AAACT1507C1ZB",
    "billing_address": "Department (Packing Plant) ACC Colony, Sindri, Dist. Dhanbad 828122",
    "shipping_address": "Department (Packing Plant) ACC Colony, Sindri, Dist. Dhanbad 828122"
  }
}
 */

export default async function getPartyDetails(id) {
  try {
    // API client automatically includes x-company-id header from selected company
    const data = await api.get(`/parties/${id}`);
    console.log(data);
    return data;
  } catch (err) {
    console.error("Network error:", err);
    notify("Network error: " + err.message, "error");
    throw err;
  }
}