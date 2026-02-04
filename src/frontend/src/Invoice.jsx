import Navbar from './components/Navbarr.jsx'
import Footer from './components/Footer.jsx'
import InvoiceForm from './components/Invoice_form.jsx'
import { useLocation } from "react-router-dom";

function Invoice() {
  const { state } = useLocation();

  return (
    <>
      <div className='w-full rounded-2xl bg-[#004f43cc]'>
        <InvoiceForm initialData={state} />
      </div>
      <Footer />
    </>
  );
}

export default Invoice;
