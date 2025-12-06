export async function createParty(data) {
    try {
        const res = await fetch("http://localhost:5000/createParty", {
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

        console.log("Party created:", result.party);
    } catch (err) {
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}