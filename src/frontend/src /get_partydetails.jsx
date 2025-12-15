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

export default async function getPartyDetails(id){
    try{
        const res = await fetch("http://localhost:5000/parties/",id);
        const data = await res.json();
        console.log(data);
        return data;
    }catch(err){
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}