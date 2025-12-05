import { useState } from "react";
import Button from './Button.jsx';

export default function InvoiceForm() {
  const [invoice, setInvoice] = useState({
    clientName: "",
    clientEmail: "",
    invoiceDate: "",
    dueDate: "",
    items: [{ description: "", quantity: 1, price: 0 }],
  });

  // HANDLE BASIC INPUTS
  function handleChange(e) {
    setInvoice({
      ...invoice,
      [e.target.name]: e.target.value,
    });
  }

  // HANDLE LINE ITEMS
  function handleItemChange(index, field, value) {
    const updatedItems = [...invoice.items];
    updatedItems[index][field] = value;
    setInvoice({ ...invoice, items: updatedItems });
  }

  // ADD ITEM
  function addItem() {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { description: "", quantity: 1, price: 0 }],
    });
  }

  // REMOVE ITEM
  function removeItem(index) {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: updatedItems });
  }

  // TOTAL CALCULATION
  const totalAmount = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>

      {/* BASIC INFO */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          name="clientName"
          placeholder="Client Name"
          className="border p-2 rounded"
          value={invoice.clientName}
          onChange={handleChange}
        />
        <input
          name="clientEmail"
          placeholder="Client Email"
          className="border p-2 rounded"
          value={invoice.clientEmail}
          onChange={handleChange}
        />
        <input
          type="date"
          name="invoiceDate"
          className="border p-2 rounded"
          value={invoice.invoiceDate}
          onChange={handleChange}
        />
        <input
          type="date"
          name="dueDate"
          className="border p-2 rounded"
          value={invoice.dueDate}
          onChange={handleChange}
        />
      </div>

      {/* ITEMS SECTION */}
      <h2 className="text-xl font-semibold mb-2">Items</h2>

      {invoice.items.map((item, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 mb-3">
          <input
            placeholder="Description"
            className="border p-2 rounded col-span-2"
            value={item.description}
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
          />
          <input
            type="number"
            className="border p-2 rounded"
            value={item.quantity}
            min={1}
            onChange={(e) =>
              handleItemChange(index, "quantity", Number(e.target.value))
            }
          />
          <input
            type="number"
            className="border p-2 rounded"
            value={item.price}
            min={0}
            onChange={(e) =>
              handleItemChange(index, "price", Number(e.target.value))
            }
          />
          <div className="flex items-center">
           <Button color="red" text ='Remove' onClick={() =>removeItem(index)} className=""/>
            </div>
        </div>
      ))}

      <button
        onClick={addItem}
        className="bg-blue-500  text-white font-['Rubik'] px-4 py-2 rounded hover:bg-blue-700 shadow-lg shadow-cyan-500/50"
      >
        + Add Item
      </button>

      {/* TOTAL */}
      <div className="mt-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">Total:</h2>
        <p className="text-xl font-bold">₹ {totalAmount.toFixed(2)}</p>
      </div>
    </div>
  );
}
