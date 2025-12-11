export default function InvoiceTemplate({ invoice, subtotalAmount, totalAmount, sgst, cgst }) {
  return (
    <div
      id="invoice-download"
      className="w-[820px] mt-32 py-12 mx-auto bg-white shadow-lg p-6👉"
      style={{ fontFamily: "Rubik", color: "#1A1A1A" }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center pb-8 border-b-4" style={{ borderColor: "#0A4350" }}>
        <div>
             <p className="text-center"style={{ fontSize: "32px", color: "#0A4350", fontWeight: "600" , }}>INVOICE</p>
             <p className="font-['Rubik']"style={{ fontSize: "20px", color: "#0A4350", fontWeight: "600" , }}>GSTIN :20DAMPK8203A1ZB</p>
          <h1 className="font-['Rubik']"style={{ fontSize: "32px", fontWeight: "800", color: "#0A4350", letterSpacing: "1px" }}>
            M/S R.K Casting & Engineering Works
          </h1>
          <p style={{ fontSize: "12px", color: "#0A4350", fontWeight: "600" }}>
            Plot No. 125, Khata No.19, Rakuwa No. 05,
            Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN : 828129 </p>
          <p style={{ fontSize: "14px", color: "#0A4350", fontWeight: "600" }}>
            Mobile No : +91 6204583192</p>
           <p style={{ fontSize: "14px", color: "#0A4350", fontWeight: "600" }}>
           Email Id : rkcastingmoonidih@gmail.com</p>

           <p style={{ fontSize: "14px", color: "#0A4350", fontWeight: "600" }}>
             T. License No. - SEA2135400243601</p>
          
        </div>

        {/* RIGHT HEADER */}
        <div className="text-center">
          <p style={{ fontSize: "20px", fontWeight: "700", color: "#0A4350" }}>
          </p>
          <p style={{ fontSize: "14px", marginTop: "4px" }}>
            {invoice.InvoiceDate || "10/12/2025"}
          </p>
        </div>
      </div>
      .....

      {/* BILLING SECTION */}
      <div className="gap-10 mt-8">
        <div>
          <h2 style={{ fontWeight: "700", marginBottom: "6px", color: "#0A4350" }}>BILLED TO PARTY :</h2>
          <p className="font-bold text-md">{invoice.clientName}</p>
          <p>{invoice.clientAddress}</p>
          <p style={{ fontWeight: "700", marginBottom: "6px" }}>GSTIN Number : {invoice.GSTIN}</p>
        </div>
      </div>
          <div className= " gap-10 mt-8">
        <div>
          <h2 style={{ fontWeight: "700", marginBottom: "6px", color: "#0A4350" }}>SHIPPED TO PARTY :</h2>
          <p className="font-bold text-md">{invoice.clientName2}</p>
          <p>{invoice.clientAddress2}</p>
          <p className=""style={{ fontWeight: "700", marginBottom: "6px" }}>GSTIN Number : {invoice.GSTIN2}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full mt-12 border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#0A4350", color: "white", height: "50px" }}>
            <th className="text-left pl-4">DESCRIPTION</th>
            <th>HSN</th>
            <th>QTY</th>
            <th>PRICE</th>
            <th className="pr-4">AMOUNT</th>
          </tr>
        </thead>

        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #D9D9D9", height: "42px" }}>
              <td className="pl-4">{item.description}</td>
              <td className="text-center">{item.HSNCode}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-center">₹{item.price}</td>
              <td className="text-center pr-4">₹{item.quantity * item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS SECTION */}
      <div className="mt-10 flex justify-end">
        <div className="w-64">
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

      {/* FOOTER */}
      <div className="mt-14 pt-8 border-t border-b pb-8" style={{ borderColor: "#D9D9D9" }}>
        <p className="text-xl font-bold"> Bank Details :- </p>
        <p className=" text-sm">Account Name : R.K CASTING AND ENGINEERING WORKS</p>
        <p className=" text-sm">Current Account Number : 08710210000724</p>
        <p className=" text-sm">IFSC Code : UCBA0000871</p>
        <p className=" text-sm">Branch : Moonidih | Branch Code - 0871</p>
      </div>
    </div>
  );
}
