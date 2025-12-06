import React from 'react'
import logo from '../assets/react.svg'
import { ChevronDown } from 'lucide-react'

function Navbar() {
  return (
    <div className='w-full fixed px-5 md:px-30 rounded-b-xl py-6 flex justify-between items-center bg-black text-white shadow-lg '>
      <div className='logo ps-12 md:ps-0.5'> <img className="max-w-svh"src={logo} alt="Logo" /></div>
       <div className='flex text-sm justify-between items-center '>
        {["Services", "About Us", "Contact Us"].map((item,index) => (
          <button key={index} className={`mx-4 rounded-md cursor-pointer font-semibold text-md hover:bg-amber-400`}>{item}</button>
        ))}
       </div> 

    </div>
  )
}

export default Navbar