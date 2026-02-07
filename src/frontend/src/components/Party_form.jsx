import React from 'react'
import { useState } from 'react'
import Button from './Button.jsx'
import { useNavigate } from 'react-router-dom';
import Link from "../link.jsx"
import { notify } from './Notification.jsx';

function Party_form() {
  const [party, setParty] = useState({
    party_name: "",
    gstin_no: '',
    type: "",
    billing_address: "",
    shipping_address: "",
    supply_state_code: "",
    vendore_code: "",
    pin_code: "",
    contact_person: "",
    mobile_no: "",
  });

  const navigate = useNavigate();

  return (
    <div className='max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-md '>
      <h1 className="text-2xl font-bold mb-6">Create Party</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          name="party_name"
          placeholder="Party Name"
          className="border p-2 rounded"
          value={party.party_name}
          onChange={(e) => setParty({ ...party, party_name: e.target.value })}
        />
        <input
          name="billing_address"
          placeholder="Billing Address"
          className="border p-2 rounded"
          value={party.billing_address}
          onChange={(e) => setParty({ ...party, billing_address: e.target.value })}
        />
        <input
          name="shipping_address"
          placeholder="Shipping Address"
          className="border p-2 rounded"
          value={party.shipping_address}
          onChange={(e) => setParty({ ...party, shipping_address: e.target.value })}
        />
        <input
          name='supply_state_code'
          placeholder="State"
          className="border p-2 rounded"
          value={party.supply_state_code}
          onChange={(e) => setParty({ ...party, supply_state_code: e.target.value })}
        />
        <input
          name="pin_code"
          placeholder="Pin Code"
          className="border p-2 rounded"
          value={party.pin_code}
          onChange={(e) => setParty({ ...party, pin_code: e.target.value })}
        />
        <input
          name="gstin_no"
          placeholder="GSTIN Number"
          className="border p-2 rounded"
          value={party.gstin_no}
          onChange={(e) => setParty({ ...party, gstin_no: e.target.value })}
        />
        <input
          name="contact_person"
          placeholder="Contact Person"
          className="border p-2 rounded"
          value={party.contact_person}
          onChange={(e) => setParty({ ...party, contact_person: e.target.value })}
        />
        <input
          name="mobile_no"
          placeholder="Phone Number"
          className="border p-2 rounded"
          value={party.mobile_no}
          onChange={(e) => setParty({ ...party, mobile_no: e.target.value })}
        />
        <input
          name="vendore_code"
          placeholder="Vendor Code"
          className="border p-2 rounded"
          value={party.vendore_code}
          onChange={(e) => setParty({ ...party, vendore_code: e.target.value })}
        />
        <input
          name="type"
          placeholder="Type"
          className="border p-2 rounded shadow-md"
          value={party.type}
          onChange={(e) => setParty({ ...party, type: e.target.value })}
        />
      </div>
      <div className='flex justify-end space-x-4'>
        <Button
          text="Save"
          color="green"
          onClick={async () => {
            try {
              if (!party.party_name || !party.type) {
                notify("Party Name and Type are required", "warning");
                return;
              }
              await Link(party);
              notify("Party Created Successfully!", "success");
            } catch (error) {
              notify(error.message || "Failed to create party", "error");
            }
          }}
        />
        <Button text='Create Invoice' color='blue' onClick={() => navigate("/Invoice")}></Button>
      </div>
    </div>
  )
}

export default Party_form