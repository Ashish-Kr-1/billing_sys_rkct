import React from 'react'
import Navbar from './components/Navbarr.jsx'
import Footer from './components/footer.jsx'
import Party_form from './components/Party_form.jsx'

function Create_Party() {
  return (
    <>
       <Navbar/>
            <div className='pt-40 mb-12 shadow-2xl bg-amber-50 shadow-[#004d4341] rounded-4xl p-8'></div>
            <div className='pt-30 rounded-2xl bg-[#004f43cc]'>
            <Party_form></Party_form>
            <Footer></Footer>    
         </div>
    </>
  )
}

export default Create_Party