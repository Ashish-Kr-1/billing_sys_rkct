import { API_BASE } from "./config/api.js";
export default async function ledgerData(){
    try{
        const res = await fetch(`${API_BASE}/ledger`);
        const data = await res.json();        
        return data;
    }catch(err){
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}