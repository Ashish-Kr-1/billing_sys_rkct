import React from 'react'
import { useNavigate } from 'react-router-dom';
function Footer() {
  const navigate = useNavigate();
  return (
    <div>
      <div className='border-t-3 w-full border-[#004D43] text-white pt-5 bg-black mt-2 font-[Rubik] '>
        <h1 className='cursor-pointer hover:underline underline-offset-2 text-center'>&copy; 2026 RK Casting & Engineering Works. All rights reserved.</h1>
      </div>
    </div>
  )
}

export default Footer