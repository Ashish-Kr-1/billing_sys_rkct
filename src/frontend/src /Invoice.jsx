import React from 'react'
import Navbar from './components/Navbarr.jsx'
import Footer from './components/Footer.jsx'
import InvoiceForm from './components/Invoice_form.jsx'

function Invoice() {
  return (
    <>
    <Navbar></Navbar>
    <div className='pt-40 mb-12 shadow-2xl bg-amber-50 shadow-[#004d4341] rounded-4xl p-8'></div>
    <div className='pt-30 rounded-2xl bg-[#004f43cc] '>
    <InvoiceForm></InvoiceForm>
     <Footer></Footer>  
    </div>

    </>
  )
}

export default Invoice