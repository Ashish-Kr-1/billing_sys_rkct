import DefaultLogo from '../assets/logo.png';
import GlobalBharatLogo from '../assets/logo-global-bharat.png';
import { useNavigate } from "react-router-dom";
import { useCompany } from "../context/CompanyContext";
export default function InvoiceTemplate({ invoice, subtotalAmount, totalAmount, sgst, cgst, companyConfig }) {
  const navigate = useNavigate();

  // Helper function to get company logo
  const getCompanyLogo = () => {
    if (!companyConfig) return DefaultLogo;

    // Company 3 is Global Bharat
    if (companyConfig.company_id === 3) {
      return GlobalBharatLogo;
    }
    // Check if logo_url contains global-bharat
    if (companyConfig.logo_url?.includes('global-bharat')) {
      return GlobalBharatLogo;
    }

    // Default logo for other companies
    return DefaultLogo;
  };

  return (
    <div
      id="invoice-download"
      className="w-[999px]  py-2 mx-auto bg-white shadow-lg px-6"
      style={{ fontFamily: "Rubik", color: "#1A1A1A", minHeight: "1122px" }}
    >
      {/* HEADER */}
      <div> <p className="text-center underline font-serif " style={{ fontSize: "32px", color: "#0A4350", fontWeight: "600", }}>INVOICE</p></div>
      <div className="flex justify-center items-center gap-0 pb-2 border-b-4 " style={{ borderColor: "#0A4350" }}>
        <div className=''>
          <p className="" style={{ fontSize: "16px", color: "#0000FF", fontWeight: "600", }}>
            GSTIN: {companyConfig?.gstin || invoice.GSTIN0}
          </p>
          <img
            src={getCompanyLogo()}
            alt={companyConfig?.company_name || "Company Logo"}
            className=" w-52 h-auto mr-5"
          />
        </div>
        <div className="max-w-full pr-10">
          <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "1px" }}>
            {companyConfig?.company_name || 'M/S R.K Casting & Engineering Works'}
          </h1>
          <p style={{ fontSize: "12px", fontWeight: "600" }}>
            {companyConfig?.company_address || 'Plot No. 125, Khata No.19, Rakuwa No. 05, Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN : 828129'}
          </p>
          <p style={{ fontSize: "14px", fontWeight: "600" }}>
            Mobile No: {companyConfig?.mobile_no || '+91 6204583192'}
          </p>
          <p style={{ fontSize: "14px", fontWeight: "600" }}>
            Email Id: {companyConfig?.email || 'rkcastingmoonidih@gmail.com'}
          </p>
          {companyConfig?.cin_no && (
            <p style={{ fontSize: "14px", fontWeight: "600" }}>
              CIN No.: {companyConfig.cin_no}
            </p>
          )}
          {!companyConfig?.cin_no && (
            <p style={{ fontSize: "14px", fontWeight: "600" }}>
              T. License No. - SEA2135400243601
            </p>
          )}
        </div>
      </div>
      {/*Upper section*/}
      <div className="text-sm grid grid-cols-3 gap-0.5 border-b-2 mt-2">
        <p style={{ fontWeight: "700" }}>Invoice Number : {invoice.InvoiceNo}</p>
        <p style={{ fontWeight: "700" }}>Transported By : {invoice.TrasnportBy}</p>
        <p style={{ fontWeight: "700" }}> Vehicle Number : {invoice.VehicleNo}</p>
        <p style={{ fontWeight: "700" }}> Date : {invoice.InvoiceDate}</p>
        <p style={{ fontWeight: "700" }}> Place of Supply : {invoice.PlaceofSupply}</p>
        <p style={{ fontWeight: "700" }}> Eway Bill No. : {invoice.EwayBillNo}</p>
        <p style={{ fontWeight: "700" }}> PO No. : {invoice.po_no}</p>
        <p style={{ fontWeight: "700" }}> PO Date : {invoice.PODate}</p>
        <p style={{ fontWeight: "700" }}> Vendor Code : {invoice.VendorCode}</p>
        <p style={{ fontWeight: "700", marginBottom: "6px" }}> GatePass/Challan No. : {invoice.ChallanNo}</p>
        <p style={{ marginBottom: "6px" }}> {invoice.ChallanDate}</p>
      </div>


      {/* BILLING SECTION */}
      <div className='grid grid-cols-2 gap-3.5'>
        <div className="gap-10 mt-2 text-sm">
          <div className="border rounded-md text-sm p-3">
            <h2 className='flex items-center justify-center pb-2.5 rounded ' style={{ fontWeight: "700", marginBottom: "3px", backgroundColor: "#3E7373", color: "white" }}>BILLED TO PARTY </h2>
            <p className="font-bold text-sm">{invoice.clientName}</p>
            <p>{invoice.clientAddress}</p>
            <p style={{ fontWeight: "700", marginBottom: "6px" }}>GSTIN Number : {invoice.GSTIN}</p>
          </div>
        </div>
        <div className="gap-10 mt-2 text-sm ">
          <div className="border rounded-md p-3">
            <h2 className='text-center rounded pb-2.5' style={{ fontWeight: "700", marginBottom: "3px", backgroundColor: "#3E7373", color: "white" }}>SHIPPED TO PARTY </h2>
            <p className="font-bold text-md">{invoice.clientName2}</p>
            <p>{invoice.clientAddress2}</p>
            <p className="" style={{ fontWeight: "700", marginBottom: "6px" }}>GSTIN Number : {invoice.GSTIN2}</p>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full  mt-6 border-collapse ">
        <thead>
          <tr style={{ backgroundColor: "#0A4350", color: "white", height: "30px" }}>
            <th className="text-left pl-4 pb-2.5">DESCRIPTION</th>
            <th className='pb-2.5'>HSN</th>
            <th className='pb-2.5'>QTY</th>
            <th className='pb-2.5'>PRICE</th>
            <th className="pr-4 pb-2.5">AMOUNT</th>
          </tr>
        </thead>

        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #D9D9D9", height: "16px" }}>
              <td className="pl-4 pb-2.5">{item.description}</td>
              <td className="text-center pb-2.5">{item.HSNCode}</td>
              <td className="text-center pb-2.5">{item.quantity}</td>
              <td className="text-center pb-2.5">₹{item.price}</td>
              <td className="text-center pr-4 pb-2.5">₹{item.quantity * item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS SECTION */}
      <div className="mt-4 grid grid-cols-2 ">
        <div className="border rounded-2xl p-5" style={{ borderColor: "#D9D9D9" }}>
          <p className="text-xl font-bold"> Bank Details :- </p>
          <p className=" text-sm">{invoice.AccountName}</p>
          <p className=" text-sm">{invoice.CurrentACCno}</p>
          <p className=" text-sm">{invoice.IFSCcode}</p>
          <p className=" text-sm">{invoice.Branch}</p>
        </div>
        <div className='flex justify-end'>
          <div className="w-64 ">
            <div className="flex justify-around mb-2">
              <span>Subtotal</span>
              <span>₹{(subtotalAmount.toFixed(2))}</span>
            </div>

            <div className="flex justify-around mb-2">
              <span>SGST ({sgst}%)</span>
              <span>₹{((subtotalAmount * sgst) / 100).toFixed(2)}</span>
            </div>

            <div className="flex justify-around mb-2">
              <span>CGST ({cgst}%)</span>
              <span>₹{((subtotalAmount * cgst) / 100).toFixed(2)}</span>
            </div>

            <div
              className="flex justify-around mt-3 pt-3 border-t-2"
              style={{ borderColor: "#0A4350", fontWeight: "700", fontSize: "20px" }}
            >
              <span>Total Amount</span>
              <span>₹{Math.round(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-4 border rounded-md p-3">
        <h2 className="font-semibold mb-2">
          Terms &amp; Conditions
        </h2>
        <p className="text-sm whitespace-pre-line">
          {invoice.Terms || "No terms and conditions specified."}
        </p>
      </div>
    </div>
  );
}
