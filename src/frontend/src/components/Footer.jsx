import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

function Footer() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();

  return (
    <div>
      <div className='border-t-3 w-full border-[#004D43] text-white pt-5 bg-black  font-[Rubik] '>
        <h1 className='cursor-pointer hover:underline underline-offset-2 text-center'>
          &copy; {new Date().getFullYear()} {selectedCompany?.name || 'R.K Casting & Engineering Works'}. All rights reserved.
        </h1>
      </div>
    </div>
  )
}

export default Footer