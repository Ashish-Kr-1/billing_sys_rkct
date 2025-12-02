import React from 'react'

function abcd({text='txt' , placeholder='Enter Party Name' , className = ""}){
  return(
     <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>{text}</h1>
                <input type="text" placeholder={placeholder} className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>

  )
}

export default abcd