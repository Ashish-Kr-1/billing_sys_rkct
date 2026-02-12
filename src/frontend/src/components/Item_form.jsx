import React, { useState, useEffect } from 'react'
import Button from './Button.jsx'
import { useNavigate } from 'react-router-dom';
import LinkItem from "../link_item.jsx"
import { notify } from './Notification.jsx';
import { api, handleApiResponse } from '../config/apiClient.js';

function Item_form({ initialData = null, onSuccess, onCancel, onManage }) {
  const isEditMode = !!initialData;

  const initialItemState = {
    item_name: "",
    hsn_code: "",
    unit: "",
    rate: ""
  };

  const [item, setItem] = useState(initialItemState);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    setIsCloning(false);
    if (initialData) {
      setItem(initialData);
    } else {
      setItem(initialItemState);
    }
  }, [initialData]);

  const isActuallyEditing = isEditMode && !isCloning;

  const navigate = useNavigate();

  const LOCKED_FIELDS = ['item_name', 'hsn_code'];

  const isFieldLocked = (fieldName) => isActuallyEditing && LOCKED_FIELDS.includes(fieldName);

  const getInputClass = (fieldName) => {
    const baseClass = "border p-2 rounded w-full";
    return isFieldLocked(fieldName)
      ? `${baseClass} bg-gray-100 cursor-not-allowed text-gray-500`
      : `${baseClass} bg-white`;
  };

  return (
    <div className='max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-md mt-8 relative'>
      {isEditMode && (
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          Cancel Edit
        </button>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isActuallyEditing ? 'Edit Item' : 'Create Item'}</h1>
        {onManage && !isEditMode && (
          <Button text="Manage Items" color="blue" onClick={onManage} />
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          name="item_name"
          placeholder="Item Name"
          className={getInputClass('item_name')}
          value={item.item_name}
          onChange={(e) => setItem({ ...item, item_name: e.target.value })}
          readOnly={isFieldLocked('item_name')}
        />
        <input
          name="hsn_code"
          placeholder="HSN code"
          className={getInputClass('hsn_code')}
          value={item.hsn_code}
          onChange={(e) => setItem({ ...item, hsn_code: e.target.value })}
          readOnly={isFieldLocked('hsn_code')}
        />
        <input
          name="unit"
          placeholder="Unit"
          className={getInputClass('unit')}
          value={item.unit}
          onChange={(e) => setItem({ ...item, unit: e.target.value })}
        />
        <input
          name='rate'
          placeholder="Rate"
          className={getInputClass('rate')}
          value={item.rate}
          onChange={(e) => setItem({ ...item, rate: e.target.value })}
        />
      </div>
      <div className='flex justify-end space-x-4'>
        <Button
          text={isActuallyEditing ? "Update Item" : "Save"}
          color="green"
          onClick={async () => {
            try {
              if (!item.item_name) {
                notify("Item Name is required", "warning");
                return;
              }

              if (isActuallyEditing) {
                await handleApiResponse(api.put(`/items/${item.item_id}`, item));
                notify("Item Updated Successfully!", "success");
                if (onSuccess) onSuccess();
              } else {
                // Strip item_id when cloning or creating fresh
                const { item_id, ...newItemData } = item;
                await LinkItem(newItemData);
                notify("Item Created Successfully!", "success");
                setItem(initialItemState);
                if (onSuccess) onSuccess();
              }
            } catch (error) {
              notify(error.message || "Failed to save item", "error");
            }
          }}
        />
        {isEditMode && !isCloning ? (
          <Button
            text="Create New Item"
            color="blue"
            onClick={() => setIsCloning(true)}
          />
        ) : (
          <Button text='Create Invoice' color='blue' onClick={() => navigate("/Invoice")}></Button>
        )}
      </div>
    </div>
  )
}

export default Item_form