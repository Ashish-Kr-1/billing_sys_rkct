import { useState } from "react";
import Button from './Button.jsx';
import Invoice_header from './Invoice_header.jsx';
import { useNavigate } from "react-router-dom";

export default function InvoiceForm() {
  const [invoice, setInvoice] = useState({
    clientName: "",
    clientName2: "",
    clientAddress2: "",
    clientAddress: "",
    GSTIN2:"",
    GSTIN: "",
    InvoiceDate: "",
    InvoiceNo: "",
    PODate:"",
    TrasnportBy: "",
    PlaceofSupply : "",
    PONo:"",
    VehicleNo:"",
    EwayBillNo:"",
    VendorCode:"",
    ChallanNo:"",
    ChallanDate:"",
    items: [{ description: "", HSNCode: "" ,  quantity:'', price: "" }],
  });

  const navigate = useNavigate();

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

  // TOTAL CALCULATION
  const [sgst,setSgst]= useState(0);
  const [cgst,setCgst]= useState(0);
  
  const totalAmount = subtotalAmount + (subtotalAmount * sgst) /100 + (subtotalAmount * cgst)/100;


  return (

 <div className=" flex justify-center items-center">
    <div className="max-w-6xl p-6 bg-white rounded-xl shadow-md">
      <Invoice_header></Invoice_header>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
        type="text"
          name="InvoiceNo"
          placeholder="Invoice Number "
          className="border p-2 rounded"
          value={invoice.InvoiceNo}
          onChange={handleChange}
        />
        <input
          type="text"
          name="TrasnportBy"
          placeholder=" Trasnport By"
          className="border p-2 rounded"
          value={invoice.TrasnportBy}
          onChange={handleChange}
        />
        <div className="flex justify-around items-center border">
          <h1 className="font-bold textfont-['Rubik'] rounded-md">Invoice Date </h1>
         <input
          type="Date"
          name="InvoiceDate"
          placeholder="Invoice Date"
          className=" p-2 rounded"
          value={invoice.InvoiceDate}
          onChange={handleChange}
        />
        </div>
        <input
          type="text"
          name="VehicleNo"
          placeholder="Vehicle Number"
          className="border p-2 rounded"
          value={invoice.VehicleNo}
          onChange={handleChange}
        />
         <input
          type="text"
          name="PlaceofSupply"
          placeholder="Place of Supply"
          className="border p-2 rounded"
          value={invoice.PlaceofSupply}
          onChange={handleChange}
        />
         <input
          type="text"
          name="EwayBillNo"
          placeholder="Eway Bill Number"
          className="border p-2 rounded"
          value={invoice.EwayBillNo}
          onChange={handleChange}
        />
        <input
          type="text"
          name="PONo"
          placeholder="PO Number"
          className="border p-2 rounded"
          value={invoice.PONo}
          onChange={handleChange}
        />
        <input
          type="text"
          name="VenderCode"
          placeholder="Vendor Code"
          className="border p-2 rounded"
          value={invoice.VendorCode}
          onChange={handleChange}
        />
        <div className="flex justify-around items-center border">
          <h1 className="font-bold textfont-['Rubik'] rounded-md"> PO Date </h1>
         <input
          type="Date"
          name="PODate"
          placeholder="PO Date"
          className="p-2 rounded"
          value={invoice.PODate}
          onChange={handleChange}
        />
        </div>
        <div className="flex justify-around items-center border">
          <h1 className="font-bold textfont-['Rubik'] rounded-md">Gatepass/Challan No. </h1>
          <input
          type="text"
          name="ChallanNo"
          placeholder="Challan Number"
          className="p-2 rounded"
          value={invoice.ChallanNo}
          onChange={handleChange}/>
         <input
          type="Date"
          name="ChallanDate"
          placeholder="Challan Date"
          className="p-2 rounded"
          value={invoice.ChallanDate}
          onChange={handleChange}
        />
        </div>
      </div>
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
         <h1 className="text-2xl mt-3 mb-3 font-bold ">Ship To Party</h1>
         <div className="grid grid-cols-2 gap-4 mb-6">
        <input
        type="text"
          name="clientName2"
          placeholder="Client Name"
          className="border p-2 rounded"
          value={invoice.clientName2}
          onChange={handleChange}
        />
        <input
          type="text"
          name="GSTIN2"
          placeholder="GSTIN Number"
          className="border p-2 rounded"
          value={invoice.GSTIN2}
          onChange={handleChange}
        />
      </div>
         <input
          name="clientAddress2"
          placeholder="Client Address"
          className="border p-2 rounded w-full"
          value={invoice.clientAddress2}
          onChange={handleChange}
        />


      {/* ITEMS SECTION */}
      <h2 className="text-2xl mt-2 font-semibold mb-2">Items</h2>

      {invoice.items.map((item, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 mb-3">
          <input
            placeholder="Name"
            className="border p-2 px-3.5 rounded "
            value={item.description}
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
            />
            <input
            placeholder="HSN Code"
            className="border p-2 px-3.5 rounded"
            value={item.HSNCode}
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
          <div className="flex items-center mr-16">
           <Button color="red" text ='Remove'  onClick={() =>removeItem(index)} className=""/>
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
            min={0}
            onChange={(e)=>setSgst(e.target.value)}
            placeholder="SGST %"
            className="border p-1 rounded w-24"/>
        </div>
         <div className="flex justify-end items-center ">
          <h2 className="font-bold mr-3.5"> CGST</h2>
          <input type="number"
            name="cgst"
            placeholder="CGST %"
            min={0}
            onChange={(e)=>setCgst(e.target.value)}
            className="border p-1 rounded w-24"/>
        </div>
           <div className="flex justify-end mt-6 items-center">
          <h1 className="text-xl font-bold  mr-3.5">Subtotal</h1>
          <p className="text-xl font-bold">₹ {Math.round(subtotalAmount)}</p>
          </div>
      </div>

      <div className=" mt-2 flex justify-end items-center">
        <h2 className="text-xl font-bold mr-3.5">Total Amount</h2>
        <p className="text-xl font-bold">₹ {Math.round(totalAmount)}</p>
      </div>
      <div className=" max-w-3xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
         <button className=" mx-32 md:mx-80 rounded-md font-bold cursor-progress " onClick={() => navigate("/Preview",{ state: { invoice, subtotalAmount, totalAmount, sgst, cgst } })}> Preview </button>
      </div>
   </div>
    </div>
  );
}
