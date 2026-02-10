import React from 'react';
import { useCompany } from '../context/CompanyContext';

function Footer() {
  const { selectedCompany } = useCompany();

  return (
    <footer className="mt-12 py-8 border-t border-slate-200 text-center text-slate-500 text-xs font-medium uppercase tracking-wider">
      <p>&copy; {new Date().getFullYear()} {selectedCompany?.name || 'R.K Casting & Engineering Works'}. All rights reserved.</p>
    </footer>
  );
}

export default Footer;