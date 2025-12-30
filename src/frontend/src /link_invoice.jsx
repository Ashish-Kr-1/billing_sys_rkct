import { API_BASE } from "./config/api.js";

//import createParty from "../link"
//createParty(data)

/**const fakeParty = {
    party_name: "Acme2 Traders",
    gstin_no: "27ABCDE1235F2Z1",
    type: "supplier",
    billing_address: "101 Main St, Mumbai",
    shipping_address: "Warehouse 5, Pune",
    supply_state_code: "01",
    vendore_code: "2345",
    pin_code: "411001",
    contact_person: "Raj",
    mobile_no: "9876543210"
  }**/

export default async function createInvoice(data) {

    try {
        const res = await fetch(`${API_BASE}/createInvoice`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        });

        const result = await res.json;

        if (!res.ok) {
            console.error("Server error:", result);
            alert(result.error || "Something went wrong");
            return;
        }

        console.log("Invoice created:", result.party);
    } catch (err) {
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}