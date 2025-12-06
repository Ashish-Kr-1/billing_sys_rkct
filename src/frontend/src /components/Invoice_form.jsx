import { useState } from "react";
import Button from './Button.jsx';
import invoice_header from "./invoice_header.jsx";

export default function InvoiceForm() {
  const [invoice, setInvoice] = useState({
    clientName: "",
    clientAddress: "",
    GSTIN: "",
    InvoiceDate: "",
    items: [{ description: "", HSNCode: "" ,  quantity:'', price: "" }],
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

  // SUBTOTAL CALCULATION
  const subtotalAmount = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const totalAmount = subtotalAmount; 

  return (
     <div className="flex justify-items-start ">
    <div className="max-w-3xl mx-4 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl mb-3 font-bold ">Bill To Party</h1>
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
          type="text"
          name="GSTIN"
          placeholder="GSTIN Number"
          className="border p-2 rounded"
          value={invoice.GSTIN}
          onChange={handleChange}
        />
      </div>
      <input
          name="clientAddress"
          placeholder="Client Address"
          className="border p-2 rounded w-full"
          value={invoice.clientAddress}
          onChange={handleChange}
        />

      {/* ITEMS SECTION */}
      <h2 className="text-2xl mt-2 font-semibold mb-2">Items</h2>

      {invoice.items.map((item, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 mb-3">
          <input
            placeholder="Name"
            className="border p-2 px-3.5  rounded "
            value={item.description}
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
            />
            <input
            placeholder="HSN Code"
            className="border p-2 px-3.5 rounded"
            value={item.description}
            onChange={(e) =>
              handleItemChange(index, "HSNCode", e.target.value)
}
          />
          <input
            type="number"
            className="border p-2 rounded"
            placeholder="Quantity"
            value={item.quantity}
            min={1}
            onChange={(e) =>
              handleItemChange(index, "quantity", Number(e.target.value))
            }
          />
          <input
            type="number"
            className="border p-2 rounded"
            placeholder="Price"
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
      <div className="mt-3">
        <div className="flex justify-end items-center ">
          <h2 className="font-bold mr-3.5"> SGST</h2>
          <input type="number"
            name="sgst"
            placeholder="SGST"
            className="border p-1 rounded w-16"/>
        </div>
         <div className="flex justify-end items-center ">
          <h2 className="font-bold mr-3.5"> CGST</h2>
          <input type="number"
            name="cgst"
            placeholder="CGST"
            className="border p-1 rounded w-16"/>
        </div>
           <div className="flex justify-end mt-6 items-center">
          <h1 className="text-xl font-bold  mr-3.5">Subtotal</h1>
          <p className="text-xl font-bold">₹ {subtotalAmount}</p>
          </div>
      </div>

      <div className=" mt-2 flex justify-end items-center">
        <h2 className="text-xl font-bold mr-3.5">Total Amount</h2>
        <p className="text-xl font-bold">₹ {totalAmount}</p>
      </div>
    </div>
    <div>
      <div className=" max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
         <h1 className=" font-bold text-sm md:text-xl lg:text-2xl mb-6">Invoice Templete </h1>
      </div>
    </div>
    </div>
  );
}
