
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QuotationTemplate from "./components/QuotationTemplate";
import { api, handleApiResponse } from "./config/apiClient";
import { useCompany } from "./context/CompanyContext";

export default function QuotationPreview() {

    const navigate = useNavigate();
    const { state } = useLocation();
    const { selectedCompany } = useCompany();
    const [companyConfig, setCompanyConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    const quotation = state.quotation;
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
        const element = document.getElementById("quotation-download");

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
        pdf.save("quotation.pdf");
    }

    async function saveQuotationToDB() {
        const payload = {
            quotation: {
                QuotationNo: quotation.QuotationNo,
                QuotationDate: quotation.QuotationDate,
                GSTIN: quotation.GSTIN,
                party_id: quotation.party_id || null,
                subtotal: subtotalAmount,
                cgst,
                sgst,
                Terms: quotation.Terms,
                status: 'Pending' // Default status
            },

            quotation_details: {
                transported_by: quotation.TrasnportBy,
                place_of_supply: quotation.PlaceofSupply,
                vehicle_no: quotation.VehicleNo,
                eway_bill_no: quotation.EwayBillNo,
                vendor_code: quotation.VendorCode,
                po_no: quotation.PONo,
                po_date: quotation.PODate,
                challan_no: quotation.ChallanNo,
                challan_date: quotation.ChallanDate,
                client_name: quotation.clientName,
                client_address: quotation.clientAddress,
                gstin: quotation.GSTIN,
                client_name2: quotation.clientName2,
                client_address2: quotation.clientAddress2,
                gstin2: quotation.GSTIN2,
                account_name: quotation.AccountName,
                account_no: quotation.CurrentACCno,
                ifsc_code: quotation.IFSCcode,
                branch: quotation.Branch,
                terms_conditions: quotation.Terms,
            },

            items: quotation.items,

            totals: {
                subtotal: subtotalAmount,
                cgst,
                sgst,
                totalAmount
            }
        };


        try {
            // Use handleApiResponse to manage token headers and error checking
            let data;
            if (state?.isEditMode) {
                // Assuming we implement PUT later
                alert("Update not implemented yet for Quotations.");
                // data = await handleApiResponse(api.put(`/createQuotation/${quotation.QuotationNo}`, payload));
            } else {
                data = await handleApiResponse(api.post('/createQuotation', payload));
                alert("Quotation Created Successfully!");
            }
            console.log("Quotation transaction result:", data);
        } catch (err) {
            console.error("Save quotation error:", err);
            // If duplicate key error on 'Create', it means it's already saved.
            if (!state?.isEditMode && err.message && err.message.includes("exists")) {
                console.log("Quotation already exists (idempotent save).");
                alert("Quotation already exists.");
            } else {
                alert(`Error saving quotation: ${err.message}`);
            }
        }
    }


    return (
        <div>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600 font-semibold">Loading quotation...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="overflow-auto pb-32">
                        <div className="min-w-[1024px] flex justify-center">
                            <QuotationTemplate
                                quotation={quotation}
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
                            onClick={() => navigate("/Quotation", {
                                state: {
                                    quotation,
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
                            onClick={() => saveQuotationToDB()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 text-sm"
                        >
                            <span>Save Quotation</span>
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
                            onClick={() => navigate("/Quotation")}
                        >
                            New
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
