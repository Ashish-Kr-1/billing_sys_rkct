
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import InvoiceTemplate from "./components/InvoiceTemplate";
import { api, handleApiResponse } from "./config/apiClient";
import { useCompany } from "./context/CompanyContext";

export default function Preview() {

  const navigate = useNavigate();
  const { state } = useLocation();
  const { selectedCompany } = useCompany();
  const [companyConfig, setCompanyConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const invoice = state.invoice;
  const subtotalAmount = state.subtotalAmount;
  const totalAmount = state.totalAmount;
  const sgst = state.sgst;
  const cgst = state.cgst;

  // Fetch company configuration
  useEffect(() => {
    const fetchCompanyConfig = async () => {
      setLoading(true);
      try {
        // Use company_id from state (for edit mode) or selectedCompany
        const companyId = state?.company_id || selectedCompany?.id;

        if (companyId) {
          const data = await handleApiResponse(
            api.get(`/companies/${companyId}/config`)
          );
          setCompanyConfig(data.config);
        }
      } catch (error) {
        console.error('Error fetching company config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyConfig();
  }, [state, selectedCompany]);

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
      let data;
      if (state?.isEditMode) {
        data = await handleApiResponse(api.put(`/createInvoice/${invoice.InvoiceNo}`, payload));
        alert("Invoice Updated Successfully!");
      } else {
        data = await handleApiResponse(api.post('/createInvoice', payload));
        // Only alert if it's a new creation, to be polite. Or just silent.
        // But user complained "not working", so Feedback is key.
        // However, on Download, silent is better usually. 
        // But for now, let's log it.
        alert("Invoice Created Successfully!");
      }
      console.log("Invoice transaction result:", data);
    } catch (err) {
      console.error("Save invoice error:", err);
      // If duplicate key error on 'Create', it means it's already saved. Not a fatal error for 'Download'.
      if (!state?.isEditMode && err.message && err.message.includes("exists")) {
        console.log("Invoice already exists (idempotent save).");
      } else {
        alert(`Error saving invoice: ${err.message}`);
      }
    }
  }


  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-semibold">Loading invoice...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-auto pb-32">
            <div className="min-w-[1024px] flex justify-center">
              <InvoiceTemplate
                invoice={invoice}
                subtotalAmount={subtotalAmount}
                totalAmount={totalAmount}
                sgst={sgst}
                cgst={cgst}
                companyConfig={companyConfig}
              />
            </div>
          </div >

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 flex flex-wrap justify-center gap-2 md:gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
            <button
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition-colors text-sm"
              onClick={() => navigate("/Invoice", {
                state: {
                  invoice,
                  subtotalAmount,
                  totalAmount,
                  sgst,
                  cgst,
                  isEditMode: state?.isEditMode,
                  company_id: state?.company_id
                }
              })}
            >
              Back to Edit
            </button>

            <button
              onClick={() => saveInvoiceToDB()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 text-sm"
            >
              <span>Save Invoice</span>
            </button>

            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 text-sm"
            >
              <span>Download PDF</span>
            </button>

            <div className="w-px bg-slate-300 mx-1 hidden md:block"></div>

            <button
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
              onClick={() => navigate("/Invoice")}
            >
              New
            </button>
          </div>
        </>
      )}
    </div>
  );
}
