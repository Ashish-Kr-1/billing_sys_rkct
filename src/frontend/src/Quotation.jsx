import Navbar from './components/Navbarr.jsx'
import Footer from './components/Footer.jsx'
import QuotationForm from './components/Quotation_form.jsx'
import { useLocation } from "react-router-dom";

function Quotation() {
  const { state } = useLocation();

  return (
    <>
      <div className='w-full rounded-2xl bg-[#004f43cc]'>
        <QuotationForm initialData={state || null} />
      </div>
      <Footer />
    </>
  );
}

export default Quotation;