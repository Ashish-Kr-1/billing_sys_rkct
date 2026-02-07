
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import InvoiceTemplate from "./components/InvoiceTemplate";
import { api, handleApiResponse } from "./config/apiClient";
import { useCompany } from "./context/CompanyContext";
import { notify } from "./components/Notification";
import ConfirmModal from "./components/ConfirmModal";

export default function Preview() {

  const navigate = useNavigate();
  const { state } = useLocation();
  const { selectedCompany } = useCompany();
  const [companyConfig, setCompanyConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    const element = document.getElementById("invoice-download");

    // Temporarily hide the 'Download' buttons or other UI if they are inside, 
    // but here the element is just the invoice template.

    // Use scale 2 for better quality, but compress the output image
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false
    });

    // Use JPEG instead of PNG for significant size reduction
    // Quality 0.7-0.8 usually gives great results for text/scans
    const imgData = canvas.toDataURL("image/jpeg", 0.90);

    // Initialize jsPDF with compression
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate final image dimensions to fit the PDF
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add image with compression alias 'FAST' (adds slightly more compression)
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight, undefined, 'FAST');

    pdf.save(`Invoice-${invoice.InvoiceNo || 'draft'}.pdf`);
    notify("PDF Downloaded Successfully!", "success");
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
      }
    };


    try {
      // Check if invoice exists before trying to create a new one (Prevent Duplicate)
      if (!state?.isEditMode) {
        try {
          const checkRes = await api.get(`/createInvoice/details?invoice_no=${encodeURIComponent(invoice.InvoiceNo)}`);
          if (checkRes.ok) {
            notify("Invoice is already saved!", "info");
            return;
          }
        } catch (e) {
          // Ignore error (e.g. 404 Not Found), proceed to creation
        }
      }

      // Use handleApiResponse to manage token headers and error checking
      let data;
      if (state?.isEditMode) {
        data = await handleApiResponse(api.put(`/createInvoice/${invoice.InvoiceNo}`, payload));
        notify("Invoice Saved Successfully!", "success");
      } else {
        data = await handleApiResponse(api.post('/createInvoice', payload));
        notify("Invoice Saved Successfully!", "success");
      }
      console.log("Invoice transaction result:", data);
    } catch (err) {
      console.error("Save invoice error:", err);
      // If duplicate key error on 'Create' (fallback if pre-check fails appropriately)
      if (!state?.isEditMode && err.message && err.message.includes("exists")) {
        console.log("Invoice already exists (idempotent save).");
        notify("Invoice is already saved!", "info");
      } else {
        notify(`Error saving invoice: ${err.message}`, "error");
      }
    }
  }

  async function checkInvoiceAndNavigate() {
    const invoiceNo = invoice.InvoiceNo;

    try {
      // Check if invoice exists in database
      const response = await api.get(`/createInvoice/details?invoice_no=${encodeURIComponent(invoiceNo)}`);

      if (response.ok) {
        // Invoice exists - show confirm modal
        setShowDeleteModal(true);
      } else {
        // Invoice doesn't exist - just go back to edit normally
        navigate("/Invoice", {
          state: {
            invoice: { ...invoice, status: '' },
            subtotalAmount,
            totalAmount,
            sgst,
            cgst,
            isEditMode: state?.isEditMode,
            company_id: state?.company_id
          }
        });
      }
    } catch (err) {
      // Error (likely 404) - invoice doesn't exist, proceed normally
      console.log('Invoice not found in DB, proceeding to edit');
      navigate("/Invoice", {
        state: {
          invoice: { ...invoice, status: '' },
          subtotalAmount,
          totalAmount,
          sgst,
          cgst,
          isEditMode: state?.isEditMode,
          company_id: state?.company_id
        }
      });
    }
  }

  const performCancelAndNavigate = async () => {
    const invoiceNo = invoice.InvoiceNo;
    try {
      const response = await api.put('/api/ledger/cancel', { invoice_no: invoiceNo });
      const data = await response.json();

      if (response.ok) {
        notify(`Invoice "${invoiceNo}" cancelled. You can create a new one.`, "success");
        setShowDeleteModal(false);

        // Navigate to edit mode - invoice number will be fetched fresh
        navigate("/Invoice", {
          state: {
            invoice: { ...invoice, InvoiceNo: '', status: '' }, // Clear invoice number and status
            subtotalAmount,
            totalAmount,
            sgst,
            cgst,
            isEditMode: false, // Treat as new invoice
            company_id: state?.company_id
          }
        });
      } else {
        notify(data.error || 'Failed to cancel invoice. Please try again.', "error");
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error("Cancel error:", err);
      notify("An error occurred while canceling the invoice.", "error");
      setShowDeleteModal(false);
    }
  };

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

          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={performCancelAndNavigate}
            title="Warning: Invoice Already Saved"
            message={`Invoice "${invoice.InvoiceNo}" is already saved in the database.\n\nGoing back to edit will CANCEL this invoice so you can create a new version.\n\nAre you sure?`}
            confirmText="Cancel Invoice & Edit"
            cancelText="Keep Invoice"
          />
        </>
      )}
    </div>
  );
}
