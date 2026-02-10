import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

function Footer() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();

  return (
    <div className="pt-8 mt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
      <p className="text-xs text-gray-500 text-center md:text-left">
        &copy; {new Date().getFullYear()} {selectedCompany?.name || 'R.K Casting & Engineering Works'}. All rights reserved.
      </p>
    </div>
  )
}

export default Footer