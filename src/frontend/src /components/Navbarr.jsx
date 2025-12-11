import React from 'react'
import logo from '../assets/react.svg'
import { ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate();
  return (
    <div className='w-full fixed px-5 md:px-30 rounded-b-xl py-6 flex justify-between items-center bg-black text-white shadow-lg '>
      <div className='logo ps-8 md:ps-0.5'> <img className="max-w-svh"src={logo} alt="Logo" /></div>
       <div className='flex text-sm justify-end items-center '>
        <button onClick ={() => navigate("/Home")} className='cursor-pointer text-sm text-white font-bold ml-2 mr-2'> Home </button>
        {["Services", "About Us", "Contact Us"].map((item,index) => (
          <button key={index} className={`mx-1 rounded-md cursor-pointer font-semibold text-sm hover:bg-amber-400`}>{item}</button>
        ))}
       </div> 

    </div>
  )
}

export default Navbar