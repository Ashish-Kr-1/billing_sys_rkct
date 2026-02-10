import { useState } from 'react'
import Navbar from './components/Navbarr.jsx'
import Footer from './components/Footer.jsx'
import Party_form from './components/Party_form.jsx'
import Item_form from './components/Item_form.jsx'
import PartyListModal from './components/PartyListModal.jsx'
import ItemListModal from './components/ItemListModal.jsx'
import Button from './components/Button.jsx'

function Create_Party() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleEditParty = (party) => {
    setEditingParty(party);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = () => {
    setEditingParty(null);
  };

  const handleFormCancel = () => {
    setEditingParty(null);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    // Scroll to item form (approximate, or use ref, but top is fine for user to see something changed layout)
    // Actually Item form is below Party form.
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const handleItemSuccess = () => {
    setEditingItem(null);
  };

  const handleItemCancel = () => {
    setEditingItem(null);
  };

  return (
    <>
      <div className='rounded-2xl bg-[#004f43cc] min-h-screen pb-10 pt-4'>
        <Party_form
          className='mt-4'
          initialData={editingParty}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          onManage={() => setIsModalOpen(true)}
        />

        <Item_form
          initialData={editingItem}
          onSuccess={handleItemSuccess}
          onCancel={handleItemCancel}
          onManage={() => setIsItemModalOpen(true)}
        />

      </div>

      <PartyListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEditParty}
      />

      <ItemListModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onEdit={handleEditItem}
      />
    </>
  )
}

export default Create_Party