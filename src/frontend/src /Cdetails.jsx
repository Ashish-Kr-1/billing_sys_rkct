import React from 'react'
import abcd from './abcd.jsx'

function Cdetails() {
  return (
    <div className='flex justify-items-normal items-center '>
    <div className='flex flex-col gap-8'>
      <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>Party Name </h1>
                <input type="text" placeholder = "Enter Party's Name" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>Address1</h1>
                <input type="text" placeholder = "address 1" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>Address 2</h1>
                <input type="text" placeholder = "address 2" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'> State </h1>
                <input type="text" placeholder = "name of State " className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>PIN CODE</h1>
                <input type="text" placeholder = "pin code " className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
    </div>
    <div className='flex flex-col gap-8 '>
      <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>Party Name </h1>
                <input type="text" placeholder = "Enter Party's Name" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>Address1</h1>
                <input type="text" placeholder = "Enter Party's Name" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>Address 2</h1>
                <input type="text" placeholder = "Enter Party's Name" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'> State </h1>
                <input type="text" placeholder = "Enter Party's Name" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
        <div className='w-160 h-10  flex items-center justify-evenly rounded-2xl bg-amber-100'>
                <h1 className='text-xl font-bold ml-4 flex justify-end'>PIN CODE</h1>
                <input type="text" placeholder = "Enter Party's Name" className='w-80 p-2 h-8 rounded-md  mt-1 '/>
        </div>
    </div>
    </div>
  )
}

export default Cdetails