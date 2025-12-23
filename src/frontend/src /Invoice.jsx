import Navbar from './components/Navbarr.jsx'
import Footer from './components/Footer.jsx'
import InvoiceForm from './components/Invoice_form.jsx'
import { useLocation } from "react-router-dom";

function Invoice() {
  const { state } = useLocation();

  return (
    <>
      <Navbar />
      <div className='pt-40 mb-12 shadow-2xl bg-amber-50 rounded-4xl p-8'></div>

      <div className='pt-30 w-full rounded-2xl bg-[#004f43cc]'>
        <InvoiceForm initialData={state} />
      </div>

      <Footer />
    </>
  );
}

export default Invoice;
