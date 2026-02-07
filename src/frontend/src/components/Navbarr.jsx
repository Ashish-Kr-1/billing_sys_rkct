import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import {
  Menu, X, LogOut, User, Building2,
  FileText, BarChart2, BookOpen, Users
} from 'lucide-react';
import logo from '../assets/logo.png';
import { api, handleApiResponse } from '../config/apiClient.js';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { selectedCompany } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [companyConfig, setCompanyConfig] = useState(null);

  const isActive = (path) => location.pathname === path;

  // Fetch company configuration for branding
  useEffect(() => {
    if (selectedCompany) {
      handleApiResponse(api.get(`/companies/${selectedCompany.id}/config`))
        .then(data => setCompanyConfig(data.config))
        .catch(err => console.error('Error fetching company config:', err));
    }
  }, [selectedCompany]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'New Invoice', path: '/Invoice', icon: FileText },
    { name: 'Quotations', path: '/QuotationLedger', icon: FileText },
    { name: 'Analytics', path: '/Analytics', icon: BarChart2 },
    { name: 'Ledger', path: '/Ledger', icon: BookOpen },
    { name: 'Parties', path: '/Create_Party', icon: Users },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="hidden md:block">
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Billing<span className="text-emerald-500">System</span></h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">v1.1</span>
              </div>
              {selectedCompany && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate max-w-[150px]">
                    {selectedCompany.shortName || selectedCompany.name}
                  </p>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-bold text-white"
                    style={{
                      background: companyConfig?.secondary_color
                        ? `linear-gradient(135deg, ${companyConfig.primary_color}, ${companyConfig.secondary_color})`
                        : 'linear-gradient(135deg, #1e293b, #10b981)'
                    }}
                  >
                    C{selectedCompany.id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <button
                  key={link.name}
                  onClick={() => navigate(link.path)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                      ? 'bg-slate-800 text-emerald-400 shadow-sm ring-1 ring-slate-700'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={16} className={active ? "text-emerald-400" : "text-slate-400"} />
                  {link.name}
                </button>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-white">{user?.username || 'User'}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Admin'}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <span className="text-xs font-black text-white">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-2xl py-2 border border-slate-100 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold truncate">{user?.username}</p>
                    </div>

                    <button
                      onClick={() => { navigate('/select-company'); setProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-600 font-medium"
                    >
                      <Building2 size={16} /> Switch Company
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 absolute w-full shadow-2xl animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <span className="text-sm font-black text-white">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user?.username}</p>
                <p className="text-xs text-slate-400">{selectedCompany?.name || 'No Company Selected'}</p>
              </div>
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.name}
                  onClick={() => { navigate(link.path); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Icon size={18} />
                  {link.name}
                </button>
              );
            })}

            <div className="h-px bg-slate-800 my-2"></div>

            <button
              onClick={() => { navigate('/select-company'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Building2 size={18} /> Switch Company
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
