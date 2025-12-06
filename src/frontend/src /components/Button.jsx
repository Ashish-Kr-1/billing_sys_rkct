import React from "react";
import { ToastContainer, toast } from 'react-toastify';
  
const colorClasses = {
  green: "bg-green-400 hover:bg-green-700 shadow-lg ",
  blue: "bg-blue-400 hover:bg-blue-700 shadow-lg ",
  red: "bg-red-400 hover:bg-red-700 shadow-lg ",
};

function Button({ color = "green", text = "Create", onClick, className = "" }) {
  const selected = colorClasses[color] || colorClasses.green; 
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer w-auto text-sm md:text-sm p-1.5 items-center justify-center rounded-xl font-bold text-white ${selected} ${className}`}
    >
      {text}
    </button>
  );
}

export default Button;


const HandlePrint = () =>{
    window.print();
}
export { HandlePrint };