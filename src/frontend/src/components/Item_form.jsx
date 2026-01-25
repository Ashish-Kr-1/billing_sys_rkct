import React from 'react'
import { useState } from 'react'
import Button from './Button.jsx'
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LinkItem from "../link_item.jsx"

function item_form() {
  const [item, setItem] = useState({
    item_name: "",
    hsn_code: "",
    unit: "",
    rate: ""
  });

  const notify = () => toast("Item Created Successfully!");
  const navigate = useNavigate();

  return (
    <div className='max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-md mt-28'>
      <h1 className="text-2xl font-bold mb-6">Create Item</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          name="item_name"
          placeholder="Item Name"
          className="border p-2 rounded"
          value={item.item_name}
          onChange={(e) => setItem({ ...item, item_name: e.target.value })}
        />
        <input
          name="hsn_code"
          placeholder="HSN code"
          className="border p-2 rounded"
          value={item.hsn_code}
          onChange={(e) => setItem({ ...item, hsn_code: e.target.value })}
        />
        <input
          name="unit"
          placeholder="Unit"
          className="border p-2 rounded"
          value={item.unit}
          onChange={(e) => setItem({ ...item, unit: e.target.value })}
        />
        <input
          name='rate'
          placeholder="Rate"
          className="border p-2 rounded"
          value={item.rate}
          onChange={(e) => setItem({ ...item, rate: e.target.value })}
        />
      </div>
      <div className='flex justify-end space-x-4'>
        <Button text="Save" color="green" onClick={() => { notify(); LinkItem(item); }} />
        <ToastContainer className={"font-bold"} />
        <Button text='Create Invoice' color='blue' onClick={() => navigate("/Invoice")}></Button>
      </div>
    </div>
  )
}

export default item_form