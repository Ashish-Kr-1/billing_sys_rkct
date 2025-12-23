import React from 'react'
import { useState } from 'react'

function Bank() {
  const [bank, setbank] = useState({
      AccountName: "R.K CASTING AND ENGINEERING WORKS",
      CurrentACCno: "08710210000724",
      IFSCcode: "UCBA0000871",
      Branch: "Moonidih | Branch Code - 0871",
  })
  function handleChange(e) {
    setbank({
      ...bank,
      [e.target.name]: e.target.value,
    });
  }
  return (
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
          value={bank.AccountName}
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
          value={bank.CurrentACCno}
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
          value={bank.IFSCcode}
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
          value={bank.Branch}
          onChange={handleChange}
   />
   </div>
   </div> 
    </div>
  )
}

export default Bank