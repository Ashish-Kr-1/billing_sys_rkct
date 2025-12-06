import React from 'react'
import { useNavigate } from 'react-router-dom';
function Footer() {
    const navigate = useNavigate();
  return (
    <div>
        <div className='border-t-3 w-full border-[#004D43] text-white pt-5 bg-black mt-26 font-[Rubik]'>
            <div className='flex justify-end border-t pt-3.5 border-white'>
                 <button onClick ={() => navigate("/Invoice")} className='cursor-pointer text-md text-white font-bold'>New Invoice </button>
                 <button onClick ={() => navigate("/Create_Party")} className='cursor-pointer text-md text-white font-bold ml-20 mr-28'> Create Party</button>
                 <button onClick ={() => navigate("/")} className='cursor-pointer text-md text-white font-bold ml-20 mr-28'> Home </button>
            </div>
            
            <h1 className='cursor-pointer hover:underline underline-offset-2'>&copy; 2021 RK Casting & Engineering Works. All rights reserved.</h1>
            </div>
    </div>
  )
}

export default Footer