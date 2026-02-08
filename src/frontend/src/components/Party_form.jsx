import React from 'react'
import { useState, useEffect } from 'react'
import Button from './Button.jsx'
import { useNavigate } from 'react-router-dom';
import Link from "../link.jsx"
import { notify } from './Notification.jsx';
import { INDIAN_STATES } from '../constants/indian_states.js';

import { api, handleApiResponse } from '../config/apiClient.js';

function Party_form({ initialData = null, onSuccess, onCancel }) {
  const isEditMode = !!initialData;

  const initialPartyState = {
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
  };

  const [party, setParty] = useState(initialPartyState);

  useEffect(() => {
    if (initialData) {
      setParty(initialData);
    } else {
      setParty(initialPartyState);
    }
  }, [initialData]);

  const navigate = useNavigate();

  const LOCKED_FIELDS = ['party_name', 'gstin_no', 'billing_address', 'shipping_address', 'pin_code', 'supply_state_code', 'type'];

  const isFieldLocked = (fieldName) => isEditMode && LOCKED_FIELDS.includes(fieldName);

  const getInputClass = (fieldName) => {
    const baseClass = "border p-2 rounded w-full";
    return isFieldLocked(fieldName)
      ? `${baseClass} bg-gray-100 cursor-not-allowed text-gray-500`
      : `${baseClass} bg-white`;
  };

  return (
    <div className='max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-md relative'>
      {isEditMode && (
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          Cancel Edit
        </button>
      )}
      <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Party' : 'Create Party'}</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          name="party_name"
          placeholder="Party Name"
          className={getInputClass('party_name')}
          value={party.party_name}
          onChange={(e) => setParty({ ...party, party_name: e.target.value })}
          readOnly={isFieldLocked('party_name')}
        />
        <input
          name="billing_address"
          placeholder="Billing Address"
          className={getInputClass('billing_address')}
          value={party.billing_address}
          onChange={(e) => setParty({ ...party, billing_address: e.target.value })}
          readOnly={isFieldLocked('billing_address')}
        />
        <input
          name="shipping_address"
          placeholder="Shipping Address"
          className={getInputClass('shipping_address')}
          value={party.shipping_address}
          onChange={(e) => setParty({ ...party, shipping_address: e.target.value })}
          readOnly={isFieldLocked('shipping_address')}
        />
        <select
          name='supply_state_code'
          className={getInputClass('supply_state_code')}
          value={party.supply_state_code}
          onChange={(e) => setParty({ ...party, supply_state_code: e.target.value })}
          disabled={isFieldLocked('supply_state_code')}
        >
          <option value="">Select State Code</option>
          {INDIAN_STATES.map((state) => (
            <option key={state.code} value={state.code}>
              {state.code} - {state.name}
            </option>
          ))}
        </select>
        <input
          name="pin_code"
          placeholder="Pin Code"
          className={getInputClass('pin_code')}
          value={party.pin_code}
          onChange={(e) => setParty({ ...party, pin_code: e.target.value })}
          readOnly={isFieldLocked('pin_code')}
        />
        <input
          name="gstin_no"
          placeholder="GSTIN Number"
          className={getInputClass('gstin_no')}
          value={party.gstin_no}
          onChange={(e) => setParty({ ...party, gstin_no: e.target.value })}
          readOnly={isFieldLocked('gstin_no')}
        />
        <input
          name="contact_person"
          placeholder="Contact Person"
          className={getInputClass('contact_person')}
          value={party.contact_person}
          onChange={(e) => setParty({ ...party, contact_person: e.target.value })}
        />
        <input
          name="mobile_no"
          placeholder="Phone Number"
          className={getInputClass('mobile_no')}
          value={party.mobile_no}
          onChange={(e) => setParty({ ...party, mobile_no: e.target.value })}
        />
        <input
          name="vendore_code"
          placeholder="Vendor Code"
          className={getInputClass('vendore_code')}
          value={party.vendore_code}
          onChange={(e) => setParty({ ...party, vendore_code: e.target.value })}
        />
        <select
          name="type"
          className={getInputClass('type')}
          value={party.type}
          onChange={(e) => setParty({ ...party, type: e.target.value })}
          disabled={isFieldLocked('type')}
        >
          <option value="">Select Type</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div className='flex justify-end space-x-4'>
        <Button
          text={isEditMode ? "Update Party" : "Save"}
          color="green"
          onClick={async () => {
            try {
              if (!party.party_name || !party.type || !party.supply_state_code) {
                notify("Party Name, Type, and State Code are required", "warning");
                return;
              }

              if (isEditMode) {
                await handleApiResponse(api.put(`/parties/${party.party_id}`, party));
                notify("Party Updated Successfully!", "success");
                if (onSuccess) onSuccess();
              } else {
                await Link(party);
                notify("Party Created Successfully!", "success");
                setParty(initialPartyState);
                if (onSuccess) onSuccess();
              }
            } catch (error) {
              notify(error.message || "Failed to save party", "error");
            }
          }}
        />
        <Button text='Create Invoice' color='blue' onClick={() => navigate("/Invoice")}></Button>
      </div>
    </div>
  )
}

export default Party_form