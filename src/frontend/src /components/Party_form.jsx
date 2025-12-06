import React from 'react'
import { useState } from 'react'
import Button from './Button.jsx'
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Party_form() {
    const [party, setParty] = useState({
        Name: "",
        Address: '',
        State: "",
        PinCode: "",
        GSTIN: "",
        ContactPerson: "",
        Phone: "",
        VendorCode: "",
        Type: "",
    });
    const notify = () => toast("Party Created Successfully!");
    const notify2 = () => toast("Error in Creating Party!");
    const navigate = useNavigate();

  return (
    <div className='max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-md'>
        <h1 className="text-2xl font-bold mb-6">Create Party</h1>
        <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          name="PartyName"
          placeholder="Party Name"
          className="border p-2 rounded"
          value={party.Name}
          onChange={(e) => setParty({ ...party, Name: e.target.value })}
        />
        <input
          name="Address"
          placeholder="Address"
          className="border p-2 rounded"
          value={party.Address}
          onChange={(e) => setParty({ ...party, Address: e.target.value })}
        />
        <input
          name="State"
          placeholder="State"
          className="border p-2 rounded"
          value={party.State}
          onChange={(e) => setParty({ ...party, State: e.target.value })}
        />
        <input
          name="PinCode"
          placeholder="Pin Code"
          className="border p-2 rounded"
          value={party.PinCode}
          onChange={(e) => setParty({ ...party, PinCode: e.target.value })}
        />
        <input
          name="GSTIN"
          placeholder="GSTIN Number"
          className="border p-2 rounded"
          value={party.GSTIN}
          onChange={(e) => setParty({ ...party, GSTIN: e.target.value })}
        />
        <input
          name="ContactPerson"
          placeholder="Contact Personn"
          className="border p-2 rounded"
          value={party.ContactPerson}
          onChange={(e) => setParty({ ...party, ContactPerson: e.target.value })}
        />
        <input
          name="Phone"
          placeholder="Phone Number"
          className="border p-2 rounded"
          value={party.Phone}
          onChange={(e) => setParty({ ...party, Phone: e.target.value })}
        />
        <input
          name="VendorCode"
          placeholder="Vendor Code"
          className="border p-2 rounded"
          value={party.VendorCode}
          onChange={(e) => setParty({ ...party, VendorCode: e.target.value })}
        />
        <input
          name="Type"
          placeholder="Type"
          className="border p-2 rounded shadow-md"
          value={party.Type}
          onChange={(e) => setParty({ ...party, Type: e.target.value })}
        />  
      </div>
      <div className='flex justify-end space-x-4'>
     <Button text="Save" color="green" onClick={() => {notify();notify2();}}/>
      <ToastContainer /> 
      <Button text='Create Invoice' color='blue' onClick={()=> navigate("/Invoice")}></Button>
      </div>
    </div>
  )
}

export default Party_form