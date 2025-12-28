import logo from '../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full fixed top-0 z-50 bg-black text-white shadow-lg rounded-b-lg">
      <div className="px-5 md:pl-20 pr-10 py-4 flex justify-between items-center">

        {/* LOGO */}
        <div className="logo">
          <img
            src={logo}
            alt="Logo"
            className="w-32 cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex text-sm items-center gap-12">
          <button
            onClick={() => navigate('/Invoice')}
            className=" font-bold  hover:text-emerald-400 cursor-pointer"
          >
            New Invoice
          </button>
          <button
            onClick={() => navigate('/Ledger')}
            className="font-bold mx-3  hover:text-emerald-400 transition cursor-pointer"
          >
            Ledger
          </button>
          <button
            onClick={() => navigate('/Create_Party')}
            className="  font-semibold py-3.5 hover:text-emerald-400 cursor-pointer"
          > 
            Create Party & Item
          </button>
        </div>

        {/* MOBILE HAMBURGER */}
        <div className="md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="focus:outline-none"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-[#020617] px-5 py-4 space-y-3 border-t border-gray-800">
          <button
            onClick={() => {
              navigate('/')
              setOpen(false)
            }}
            className="block w-full text-left font-semibold py-2 hover:text-emerald-400"
          >
            Home
          </button>

          <button
            onClick={() => {
              navigate('/Invoice')
              setOpen(false)
            }}
            className="block w-full text-left font-semibold py-2 hover:text-emerald-400"
          >
            New Invoice
          </button>

          <button
            onClick={() => {
              navigate('/Ledger')
              setOpen(false)
            }}
            className="block w-full text-left font-semibold py-2 hover:text-emerald-400"
          >
            Ledger
          </button>

          <button
            onClick={() => {
              navigate('/Create_Party')
              setOpen(false)
            }}
            className="block w-full font-semibold py-3  hover:text-emerald-400"
          >
            Create Party & Item
          </button>
        </div>
      )}
    </div>
  )
}

export default Navbar
