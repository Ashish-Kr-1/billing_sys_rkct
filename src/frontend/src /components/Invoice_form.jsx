import { useState, useEffect } from "react";
import Button from './Button.jsx';
import Invoice_header from './Invoice_header.jsx';
import { useNavigate } from "react-router-dom";


export default function InvoiceForm({ initialData }) {
  const [invoice, setInvoice] = useState(
    initialData?.invoice ||{
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
    Terms:"",
     AccountName: "R.K CASTING AND ENGINEERING WORKS",
      CurrentACCno: "08710210000724",
      IFSCcode: "UCBA0000871",
      Branch: "Moonidih | Branch Code - 0871",
    items: [{ description: "", HSNCode: "" ,  quantity:'', price: "" }],
  });

  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState("");

 useEffect(() => {
  fetch("http://localhost:5000/parties")
    .then(res => res.json())
    .then(data => setParties(data))
    .catch(err => console.error(err));
}, []);
    


   //HANDLE Select Party from Backend
   function handlePartySelect(partyId) {
  setSelectedPartyId(partyId);

  const party = parties.find(p => p.party_id === Number(partyId));
  if (!party) return;

  // Fetch full details
  fetch(`http://localhost:5000/parties/${partyId}`)
    .then(res => res.json())
    .then(data => {
      const p = data.party;

      setInvoice(prev => ({
        ...prev,
        clientName: p.party_name,
        clientName2: p.party_name,
        clientAddress: p.billing_address,
        clientAddress2: p.shipping_address,
        GSTIN: p.gstin_no,
        GSTIN2: p.gstin_no,
      }));
    })
    .catch(err => console.error(err));
}




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
 const [sgst, setSgst] = useState(initialData?.sgst || 0);
const [cgst, setCgst] = useState(initialData?.cgst || 0);

  
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
        <div className="flex flex-col md:flex-row md:justify-around md:items-center border gap-2 md:gap-4">
        <h1 className="font-bold font-['Rubik']">
         Invoice Date
        </h1>

       <input
          type="date"
          name="InvoiceDate"
          placeholder="Invoice Date"
          className="w-full md:w-auto rounded px-2 py-1"
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
        <div className="flex flex-col md:flex-row md:justify-around md:items-center border gap-2 md:gap-4">
  <h1 className="font-bold font-['Rubik']">
    PO Date
  </h1>

  <input
    type="date"
    name="PODate"
    placeholder="PO Date"
    className="w-full md:w-auto p-2 rounded "
    value={invoice.PODate}
    onChange={handleChange}
  />
</div>

                  <div className="flex flex-wrap md:flex-nowrap items-center border gap-2 md:gap-4">
  <h1 className="font-bold font-['Rubik']">
    Gatepass/Challan No.
  </h1>

  <input
    type="text"
    name="ChallanNo"
    placeholder="Challan Number"
    className="flex-1 min-w-[140px] p-2 rounded "
    value={invoice.ChallanNo}
    onChange={handleChange}
  />

  <input
    type="date"
    name="ChallanDate"
    placeholder="Challan Date"
    className="flex-1 min-w-[140px] p-2 rounded "
    value={invoice.ChallanDate}
    onChange={handleChange}
  />
</div>

      </div>
      <h1 className="text-2xl mb-3 font-bold ">Bill To Party</h1>
      {/* BASIC INFO */}
         <div className="mb-4">
       <label className="font-bold block mb-1">Select Party</label>
     <select
           value={selectedPartyId}
           onChange={(e) => handlePartySelect(e.target.value)}
           className="border p-2 rounded w-full"
         >
           <option value="">-- Select Party --</option>
           {parties.map(party => (
             <option key={party._id} value={party._id}>
               {party.party_name}
             </option>
           ))}
         </select>
</div>

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
          <p className="text-xl font-bold">₹ {subtotalAmount}</p>
          </div>
      </div>

      <div className=" mt-2 flex justify-end items-center">
        <h2 className="text-xl font-bold mr-3.5">Total Amount</h2>
        <p className="text-xl font-bold">₹ {totalAmount.toFixed(2)}</p>
      </div>
        <div className='border-t mt-1.5'>
  <h1 className="text-center sm:text-lg font-bold mb-2 underline">
    BANK DETAILS
  </h1>
  <div className='grid grid-cols-2 gap-4'> 
    <div className='grid grid-cols-2 '>
    <h2 className=" sm:text-lg font-bold text-center ">Account Name</h2>
    <input
        type="text"
          name="AccountName"
          placeholder="Account Name "
          className="border p-2 rounded "
          value={invoice.AccountName}
          onChange={handleChange}
   />
   </div>
   <div className='grid grid-cols-2'>
    <h2 className="text-base sm:text-lg font-bold text-center">Current Account No.</h2>
    <input
        type="text"
          name="CurrentACCno"
          placeholder="Current Account no "
          className="border p-2 rounded"
          value={invoice.CurrentACCno}
          onChange={handleChange}
   />
   </div>
    <div className='grid grid-cols-2'>
    <h2 className="text-base sm:text-lg font-bold  text-center">IFSC CODE </h2>
    <input
        type="text"
          name="IFSCcode"
          placeholder="IFSC code "
          className="border p-2 rounded "
          value={invoice.IFSCcode}
          onChange={handleChange}
   />
   </div>
   <div className='grid grid-cols-2'>
    <h2 className="text-base sm:text-lg font-bold  text-center">Branch</h2>
    <input
        type="text"
          name="Branch"
          placeholder="Branch"
          className="border p-2 rounded"
          value={invoice.Branch}
          onChange={handleChange}
        />
              </div>
              </div> 
               </div>
                      <div className="mt-4 border rounded-md p-3">
             <h2 className="font-semibold mb-2">
               Terms &amp; Conditions
             </h2>
             <textarea
               name="Terms"
               rows={4}
               className="w-full border rounded-md p-2 text-sm resize-y"
               placeholder="Enter terms and conditions here..."
               value={invoice.Terms}
               onChange={handleChange}
             />
           </div>

      <div className=" max-w-3xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
         <button className=" mx-32 md:mx-80 rounded-md font-bold cursor-progress " onClick={() => navigate("/Preview",{ state: { invoice, subtotalAmount, totalAmount, sgst, cgst,} })}> Preview </button>
      </div>
   </div>
    </div>
  );
}
