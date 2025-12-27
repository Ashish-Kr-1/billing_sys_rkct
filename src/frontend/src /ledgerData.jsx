export default async function ledgerData(){
    try{
        const res = await fetch("http://localhost:5000/ledger");
        const data = await res.json();        
        return data;
    }catch(err){
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}