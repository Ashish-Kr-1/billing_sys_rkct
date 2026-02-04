import React from 'react'
import Navbar from './components/Navbarr.jsx'
import Footer from './components/Footer.jsx'
import Party_form from './components/Party_form.jsx'
import Item_form from './components/Item_form.jsx'

function Create_Party() {
  return (
    <>
      <div className='rounded-2xl bg-[#004f43cc]'>
        <Party_form></Party_form>
        <Item_form />
        <Footer></Footer>
      </div>
    </>
  )
}

export default Create_Party