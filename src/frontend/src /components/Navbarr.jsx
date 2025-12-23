import logo from '../assets/logo.png'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate();
  return (
    <div className='w-full fixed px-5 md:px-30 rounded-b-xl py-6 flex justify-between items-center bg-black text-white shadow-lg '>
      <div className='logo ps-8 md:ps-0.5'> <img className="w-24"src={logo} alt="Logo" /></div>
       <div className='flex text-sm justify-end items-center '>
        <button onClick ={() => navigate("/")} className='cursor-pointer text-sm text-white font-bold ml-2 mr-2'> Home </button>
        <button onClick ={() => navigate("/Ledger")} className='cursor-pointer text-sm text-white font-bold ml-2 mr-2'> Ledger </button>
       </div> 
    </div>
  )
}

export default Navbar