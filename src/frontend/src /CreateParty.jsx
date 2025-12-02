import React from 'react'
import Button from './button';
import Cdetails from './Cdetails';

function CreateParty({isopen , onClose}) {
    if (!isopen) return null;
        return (
        <div className='fixed inset-0 bg-stone-300 '> 
        <div className='font-bold text-lg flex justify-center mt-20 ml-20 mr-20 rounded-t-xl bg-amber-200'><h1>Create New Party</h1></div>
            <div className='flex justify-center  ml-20 mr-20 bg-white p-4 shadow-lg  h-133'>
                 <Cdetails/>
            </div> 
            <div className=' bg-amber-200 flex items-center justify-around ml-20 mr-20 h-10 rounded-b-xl'>
             <Button text='Save'color='blue'></Button>
             <Button className = ""onClick = {onClose} text ='Close' color='red'></Button>
            </div>     
               </div> 
           )
}

export default CreateParty