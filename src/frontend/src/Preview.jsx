import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import InvoiceTemplate from "./components/InvoiceTemplate";
import InvoicePDF from "./components/InvoicePDF";
import { api, handleApiResponse } from "./config/apiClient";
import { useCompany } from "./context/CompanyContext";
import { notify } from "./components/Notification";
import DefaultLogo from './assets/logo.png';
import GlobalBharatLogo from './assets/logo-global-bharat.png';
import RkCastingLogo from './assets/logo-rkprivate-limited.png';

export default function Preview() {

  const navigate = useNavigate();
  const { state } = useLocation();
  const { selectedCompany } = useCompany();
  const [companyConfig, setCompanyConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Guard clause if state is missing
  if (!state || !state.invoice) {
    useEffect(() => {
      navigate('/Invoice');
    }, [navigate]);
    return null;
  }

  const invoice = state.invoice;
  const subtotalAmount = state.subtotalAmount;
  const totalAmount = state.totalAmount;
  const sgst = state.sgst;
  const cgst = state.cgst;
  const igst = state.igst;
  const showTax = state.showTax !== false;

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
        notify("Failed to load company configuration", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyConfig();
  }, [state, selectedCompany]);

  async function downloadPDF() {
    try {
      // Helper function to get logo path (exactly as in InvoiceTemplate)
      const getLogoPath = () => {
        if (!companyConfig) return DefaultLogo;
        const compId = Number(companyConfig.company_id || companyConfig.id);
        if (compId === 3) return GlobalBharatLogo;
        if (compId === 1) return RkCastingLogo;
        if (companyConfig?.logo_url?.includes('global-bharat')) return GlobalBharatLogo;
        return DefaultLogo;
      };

      // Create PDF blob using @react-pdf/renderer
      const blob = await pdf(
        <InvoicePDF
          invoice={invoice}
          subtotalAmount={subtotalAmount}
          totalAmount={totalAmount}
          sgst={sgst}
          cgst={cgst}
          igst={igst}
          showTax={showTax}
          companyConfig={companyConfig}
          logoUrl={getLogoPath()}
        />
      ).toBlob();

      // Create download link and trigger it
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.InvoiceNo || 'draft'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notify("PDF Downloaded Successfully!", "success");
    } catch (error) {
      console.error("PDF generation error:", error);
      notify("Failed to generate PDF", "error");
    }
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
        igst,
        Terms: invoice.Terms,
      },

      invoice_details: {
        transported_by: invoice.TrasnportBy,
        place_of_supply: invoice.PlaceofSupply,
        vehicle_no: invoice.VehicleNo,
        eway_bill_no: invoice.EwayBillNo,
        vendor_code: invoice.VendorCode,
        po_no: invoice.po_no, // UPDATED: Matches Invoice_form state name
        po_date: invoice.PODate,
        challan_no: invoice.ChallanNo,
        challan_date: invoice.ChallanDate,
        client_name: invoice.clientName,
        client_address: invoice.clientAddress,
        gstin: invoice.GSTIN, // FIXED: gstIn -> gstin
        client_name2: invoice.clientName2,
        client_address2: invoice.clientAddress2,
        gstin2: invoice.GSTIN2, // FIXED: gstIn2 -> gstin2
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
        igst,
      }
    };


    try {
      // Use handleApiResponse to manage token headers and error checking
      let data;
      if (state?.isEditMode) {
        data = await handleApiResponse(api.put(`/createInvoice/${encodeURIComponent(invoice.InvoiceNo)}`, payload));
        notify("Invoice Saved Successfully!", "success");
      } else {
        // POST will create new invoice or update if it already exists
        data = await handleApiResponse(api.post('/createInvoice', payload));
        notify("Invoice Saved Successfully!", "success");
      }
      console.log("Invoice transaction result:", data);
    } catch (err) {
      console.error("Save invoice error:", err);
      notify(`Error saving invoice: ${err.message}`, "error");
    }
  }

  function checkInvoiceAndNavigate() {
    // Simply navigate back to edit without canceling invoice
    navigate("/Invoice", {
      state: {
        invoice: { ...invoice, status: '' },
        subtotalAmount,
        totalAmount,
        sgst,
        cgst,
        igst,
        isEditMode: state?.isEditMode,
        company_id: state?.company_id
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-slate-600">Loading company configuration...</div>
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
                igst={igst}
                showTax={showTax}
                companyConfig={companyConfig}
              />
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 flex flex-wrap justify-center gap-2 md:gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
            <button
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 transition-colors text-sm"
              onClick={checkInvoiceAndNavigate}
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
