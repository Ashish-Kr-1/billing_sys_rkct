
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import InvoiceTemplate from "./components/InvoiceTemplate";
import { api, handleApiResponse } from "./config/apiClient";

export default function Preview() {

  const navigate = useNavigate();
  const { state } = useLocation();

  const invoice = state.invoice;
  const subtotalAmount = state.subtotalAmount;
  const totalAmount = state.totalAmount;
  const sgst = state.sgst;
  const cgst = state.cgst;

  async function downloadPDF() {
    const element = document.getElementById("invoice-download");

    const canvas = await html2canvas(element, {
      scale: 1.2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });
    //

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();

    pdf.addImage(imgData, "PNG", 0, 0, width, 0);
    pdf.save("invoice.pdf");

    await saveInvoiceToDB();
  }

  async function saveInvoiceToDB() {
    const payload = {
      invoice: {
        InvoiceNo: invoice.InvoiceNo,
        InvoiceDate: invoice.InvoiceDate,
        GSTIN: invoice.GSTIN,
        party_id: invoice.party_id || null,
        transaction_type: invoice.transaction_type || "SALE",
        subtotal: subtotalAmount,
        cgst,
        sgst,
        Terms: invoice.Terms,
      },

      invoice_details: {
        transported_by: invoice.TrasnportBy,
        place_of_supply: invoice.PlaceofSupply,
        vehicle_no: invoice.VehicleNo,
        eway_bill_no: invoice.EwayBillNo,
        vendor_code: invoice.VendorCode,
        po_date: invoice.PODate,
        challan_no: invoice.ChallanNo,
        challan_date: invoice.ChallanDate,
        client_name: invoice.clientName,
        client_address: invoice.clientAddress,
        gstIn: invoice.GSTIN,
        client_name2: invoice.clientName2,
        client_address2: invoice.clientAddress2,
        gstIn2: invoice.GSTIN2,
        account_name: invoice.AccountName,
        account_no: invoice.CurrentACCno,
        ifsc_code: invoice.IFSCcode,
        branch: invoice.Branch,
        terms_conditions: invoice.Terms,
      },

      items: invoice.items,

      totals: {
        subtotal: subtotalAmount,
        cgst,
        sgst,
      }
    };


    try {
      // Use handleApiResponse to manage token headers and error checking
      const data = await handleApiResponse(api.post('/createInvoice', payload));
      console.log("Invoice saved:", data);
    } catch (err) {
      console.error("Save invoice error:", err);
      // alert("Invoice saved partially (PDF ok, DB failed)"); // Optional: notify user
    }
  }


  return (
    <div>
      <InvoiceTemplate
        invoice={invoice}
        subtotalAmount={subtotalAmount}
        totalAmount={totalAmount}
        sgst={sgst}
        cgst={cgst}
      />
      <div className="flex justify-around">
        <button onClick={downloadPDF} className="mt-6 px-6 py-3 bg-blue-600 hover:bg-[#3d8ecb] text-white rounded">
          Download PDF
        </button>
        <button
          className="mt-6 px-6 py-3 bg-[#1F5E6C] hover:bg-[#1f6c53] text-white rounded"
          onClick={() => navigate("/Invoice", { state: { invoice, subtotalAmount, totalAmount, sgst, cgst, } })}
        >
          Edit
        </button>
        <button
          className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded"
          onClick={() => navigate("/Invoice")}
        >
          New Invoice
        </button>

      </div>
    </div>
  );
}
