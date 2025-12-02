import React from 'react'
import {useState} from 'react'
import Button from './button.jsx'
import { HandlePrint} from './button.jsx'
import CreateParty from './CreateParty.jsx'

function App() {
  const [open , setOpen] = useState(false)
  return (
   <div>
  <div className= ''>
    <CreateParty isopen={open} onClose={()=> setOpen(false)}/>
      
     <div className=' flex min-h-screen rounded-t-xl shadow-xl/30 w-auto h-150 bg-blue-200 items-center justify-center font-bold mt-10 ml-10 mr-10'>Invoice</div>
      
      <div className='w-auto h-12 rounded-b-xl ml-10 mr-10 bg-lime-300 flex items-center justify-around '  >
        <Button className='w-40'text='Create New Party' onClick={()=>setOpen(true)} ></Button>
        <Button text='Delete' color = "red"></Button>
        <Button onClick = {HandlePrint} text = "Print" color = "blue"></Button>
      </div>
      
  </div>
   </div>
  )
}

export default App