import React from "react";

const colorClasses = {
  green: "bg-green-400 hover:bg-green-700 shadow-lg shadow-cyan-500/50",
  blue: "bg-blue-400 hover:bg-blue-700 shadow-lg shadow-cyan-500/50",
  red: "bg-red-400 hover:bg-red-700 shadow-lg shadow-red-500/50",
};

function Button({ color = "green", text = "Create", onClick, className = "" }) {
  const selected = colorClasses[color] || colorClasses.green;

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-20 h-8 rounded-xl font-bold text-white ${selected} ${className}`}
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