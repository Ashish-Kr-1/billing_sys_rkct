import { API_BASE } from "./config/api.js";
/** sample data
 * 
 [
  {
    "party_id": 1,
    "party_name": "ACC Limited"
  },
  {
    "party_id": 4,
    "party_name": "ACC Limited"
  },
  {
    "party_id": 10,
    "party_name": "Acme Traders"
  },
  {
    "party_id": 12,
    "party_name": "Acme2 Traders"
  },
  {
    "party_id": 11,
    "party_name": "Acme2 Traders"
  },
  {
    "party_id": 13,
    "party_name": "Acme4 Traders"
  },
  {
    "party_id": 5,
    "party_name": "Adept Mining Pvt. Ltd."
  },
  {
    "party_id": 2,
    "party_name": "Adept Mining Pvt. Ltd."
  },
  {
    "party_id": 6,
    "party_name": "Bharat Coking Coal Limited"
  },
  {
    "party_id": 3,
    "party_name": "Bharat Coking Coal Limited"
  },
  {
    "party_id": 8,
    "party_name": "Hydra Cement Works"
  },
  {
    "party_id": 7,
    "party_name": "Pune Steel Suppliers"
  },
  {
    "party_id": 14,
    "party_name": "Test Party"
  }
]
 */


export default async function getPartyList(){
    try{
        const res = await fetch(`${API_BASE}/parties`);
        const data = await res.json();
        console.log(data);
        party_name = []
        party_id = []
        return data;
    }catch(err){
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}