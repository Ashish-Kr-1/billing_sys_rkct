//import createItem from "../link"
//createItem(data)

/**const fakeItem = {
  item_name: "Blue Bell",
  hsn_code: "0045",
  unit: "pair",
  rate: "101"
  }**/

export default async function createItem(data) {
    try {
        const res = await fetch("http://localhost:5000/createItem", {
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

        console.log("Item created:", result.item);
    } catch (err) {
        console.error("Network error:", err);
        alert("Network error: " + err.message);
    }
}