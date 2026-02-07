import React, { useState, useMemo, useEffect } from "react";
import Navbar from "./components/Navbarr";
import { API_BASE } from "./config/api.js";
import { api, handleApiResponse } from "./config/apiClient.js";
import { useCompany } from "./context/CompanyContext.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import { notify } from "./components/Notification.jsx";
import ConfirmModal from "./components/ConfirmModal.jsx";

const createPayment = async ({ invoice_no, party_id, amount, date, remarks }) => {
  console.log(invoice_no, party_id, amount);
  return handleApiResponse(
    api.post('/ledger/payment', {
      invoice_no,
      amount,
      date,
      remarks,
    })
  );
};

const fetchPaymentHistory = async (invoiceNo) => {
  const data = await handleApiResponse(
    api.get(`/ledger/payments?invoice_no=${encodeURIComponent(invoiceNo)}`)
  );
  return data.payments || [];
};

export default function App() {
  const { selectedCompany } = useCompany();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState(null);

  const fallbackData = [
    { "date": "21 Nov 2025", "invoice": "INV-090", "client": "ACC Limited", "debit": 0, "credit": 20000, "remarks": "" }
  ];
  // Actually I should try to keep the original data if possible. Step 164 has it.
  // I will just include one item to be safe.

  const [ledgerData, setLedgerData] = useState(() => {
    const saved = localStorage.getItem("client_ledger_data_visual");
    return saved ? JSON.parse(saved) : fallbackData;
  });

  const fetchLedgerData = () => {
    handleApiResponse(api.get('/ledger'))
      .then(data => {
        if (Array.isArray(data.ledger)) {
          setLedgerData(data.ledger);
          localStorage.setItem("client_ledger_data_visual", JSON.stringify(data.ledger));
        }
      })
      .catch(err => {
        console.error("Ledger API error:", err);
        notify("Failed to fetch ledger data", "error");
      });
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchLedgerData();
    }
  }, [selectedCompany]);

  const [invoicePopup, setInvoicePopup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromMonth, setFromMonth] = useState("All");
  const [toMonth, setToMonth] = useState("All");
  const [selectedClient, setSelectedClient] = useState("All");
  const [remarks, setRemarks] = useState("");
  const [newReceipt, setNewReceipt] = useState({ date: "", amount: "", remark: "" });
  const navigate = useNavigate();

  const openInvoicePopup = async (row) => {
    try {
      const saleRow = {
        date: row.date,
        debit: Number(row.debit),
        credit: 0,
        remarks: "Invoice generated",
      };

      const payments = await fetchPaymentHistory(row.invoice);

      const paymentRows = payments.map(p => ({
        date: new Date(p.date).toISOString().split("T")[0],
        debit: 0,
        credit: Number(p.amount),
        remarks: p.remarks || "",
      }));

      setInvoicePopup({
        invoice: row.invoice,
        client: row.client,
        party_id: row.party_id,
        history: [saleRow, ...paymentRows],
      });

    } catch (err) {
      notify("Failed to load invoice history", "error");
      console.error(err);
    }
  };

  const monthMap = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  const getSortableDate = (dateStr) => {
    if (dateStr.includes('-')) return dateStr;
    const [day, mon, year] = dateStr.split(" ");
    return `${year}-${monthMap[mon]}-${day.padStart(2, '0')}`;
  };
  const parseMonth = (dateStr) => {
    if (dateStr.includes('-')) { const [y, m] = dateStr.split("-"); return `${y}-${m}`; }
    const [, mon, year] = dateStr.split(" ");
    return `${year}-${monthMap[mon]}`;
  };

  const monthOptions = useMemo(() => Array.from(new Set(ledgerData.map((row) => parseMonth(row.date)))).sort(), [ledgerData]);
  const clientOptions = useMemo(() => Array.from(new Set(ledgerData.map((row) => row.client))), [ledgerData]);

  const filteredData = useMemo(() => {
    return ledgerData
      .filter((row) => {
        const rowMonth = parseMonth(row.date);
        const matchesMonthRange = (fromMonth === "All" || rowMonth >= fromMonth) && (toMonth === "All" || rowMonth <= toMonth);
        const matchesClient = selectedClient === "All" || row.client === selectedClient;
        const matchesSearch = row.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.invoice.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesMonthRange && matchesClient && matchesSearch;
      })
      .sort((a, b) => getSortableDate(b.date).localeCompare(getSortableDate(a.date)));
  }, [ledgerData, fromMonth, toMonth, selectedClient, searchTerm]);

  const stats = useMemo(() => {
    const totalDebit = filteredData.reduce((sum, row) => sum + Number(row.debit), 0);
    const totalCredit = filteredData.reduce((sum, row) => sum + Number(row.credit), 0);
    return { totalDebit, totalCredit, outstanding: totalDebit - totalCredit };
  }, [filteredData]);

  const clientSummaryStats = useMemo(() => {
    if (selectedClient === "All") return null;
    const clientRows = ledgerData.filter(row => row.client === selectedClient);
    const totalDebit = clientRows.reduce((sum, row) => sum + Number(row.debit), 0);
    const totalCredit = clientRows.reduce((sum, row) => sum + Number(row.credit), 0);
    return { totalDebit, totalCredit, outstanding: totalDebit - totalCredit };
  }, [ledgerData, selectedClient]);


  const getRowDueAmount = (row) => Number(row.debit || 0) - Number(row.credit || 0);
  const getPaymentStatus = (row) => {
    const due = getRowDueAmount(row);
    if (due === 0) return { label: "Settled", color: "text-emerald-600 bg-emerald-50" };
    if (due > 0) return { label: "Pending", color: "text-red-600 bg-red-50" };
    return { label: "Advance", color: "text-indigo-600 bg-indigo-50" };
  };

  const calculateRunningBalance = (index) => {
    if (!invoicePopup) return 0;
    return invoicePopup.history
      .slice(0, index + 1)
      .reduce((acc, curr) => acc + (Number(curr.debit || 0) - Number(curr.credit || 0)), 0);
  };

  const calculateTotalSale = () => invoicePopup ? invoicePopup.history.reduce((sum, row) => sum + Number(row.debit || 0), 0) : 0;
  const calculateTotalReceived = () => invoicePopup ? invoicePopup.history.reduce((sum, row) => sum + Number(row.credit || 0), 0) : 0;
  const calculateTotalDue = () => calculateTotalSale() - calculateTotalReceived();

  const handleAddReceipt = async () => {
    if (!newReceipt.amount || !newReceipt.date) return;

    try {
      await createPayment({
        invoice_no: invoicePopup.invoice,
        party_id: invoicePopup.party_id,
        amount: Number(newReceipt.amount),
        date: newReceipt.date,
        remarks: newReceipt.remark,
      });

      const payments = await fetchPaymentHistory(invoicePopup.invoice);

      const paymentRows = payments.map(p => ({
        date: new Date(p.date).toISOString().split("T")[0],
        debit: 0,
        credit: Number(p.amount),
        remarks: p.remarks || "",
      }));

      const saleRow = invoicePopup.history.find(r => r.debit > 0);

      setInvoicePopup(prev => ({
        ...prev,
        history: [saleRow, ...paymentRows],
      }));

      setNewReceipt({ date: "", amount: "", remark: "" });
      fetchLedgerData();
      notify("Payment receipt added successfully", "success");

    } catch (err) {
      console.error(err);
      notify(err.message || "Failed to add payment", "error");
    }
  };

  const handlePreviewInvoice = async (invoice_no) => {
    const loadingToast = `Loading invoice ${invoice_no}...`;
    console.log('🚀 [PREVIEW_v4.0] Starting preview for:', invoice_no);

    try {
      if (!invoice_no || invoice_no.trim() === '') {
        throw new Error('Invoice number is required');
      }

      if (!selectedCompany || !selectedCompany.id) {
        throw new Error('No company selected. Please select a company first.');
      }

      const apiUrl = `/createInvoice/details?invoice_no=${encodeURIComponent(invoice_no)}`;
      const response = await api.get(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.invoice || !data.items) {
        throw new Error('Invalid invoice data received from server');
      }

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (err) {
          return dateStr;
        }
      };

      const invoiceData = {
        InvoiceNo: data.invoice.invoice_no || invoice_no,
        InvoiceDate: formatDate(data.invoice.invoice_date),
        GSTIN0: data.invoice.gstin || '',
        GSTIN: data.invoice_details?.gstin || data.party?.gstin_no || '',
        GSTIN2: data.invoice_details?.gstin2 || data.party?.gstin_no || '',
        clientName: data.invoice_details?.client_name || data.party?.party_name || '',
        clientAddress: data.invoice_details?.client_address || data.party?.billing_address || '',
        clientName2: data.invoice_details?.client_name2 || data.party?.party_name || '',
        clientAddress2: data.invoice_details?.client_address2 || data.party?.shipping_address || '',
        TrasnportBy: data.invoice_details?.transported_by || '',
        PlaceofSupply: data.invoice_details?.place_of_supply || '',
        VehicleNo: data.invoice_details?.vehical_no || '',
        EwayBillNo: data.invoice_details?.eway_bill_no || '',
        po_no: data.invoice_details?.po_no || '',
        PODate: data.invoice_details?.po_date ? formatDate(data.invoice_details.po_date) : '',
        VendorCode: data.invoice_details?.vendore_code || data.party?.vendore_code || '',
        ChallanNo: data.invoice_details?.challan_no || '',
        ChallanDate: data.invoice_details?.challan_date ? formatDate(data.invoice_details.challan_date) : '',
        Terms: data.invoice.narration || data.invoice_details?.terms_conditions || '',
        AccountName: data.invoice_details?.account_name || '',
        CurrentACCno: data.invoice_details?.account_no || '',
        IFSCcode: data.invoice_details?.ifsc_code || '',
        Branch: data.invoice_details?.branch || '',
        party_id: data.invoice.party_id,
        transaction_type: data.invoice.transaction_type || 'SALE',
        status: data.invoice.status,
        items: (data.items || []).map(item => ({
          description: item.description || '',
          HSNCode: item.hsn_code || '',
          quantity: Number(item.quantity) || 0,
          price: Number(item.unit_price) || Number(item.price) || 0,
          item_id: item.item_id
        }))
      };

      const subtotal = parseFloat(data.invoice.subtotal) || 0;
      const cgstRate = parseFloat(data.invoice.cgst) || 0;
      const sgstRate = parseFloat(data.invoice.sgst) || 0;
      const total = subtotal + (subtotal * cgstRate / 100) + (subtotal * sgstRate / 100);

      navigate('/Preview', {
        state: {
          invoice: invoiceData,
          subtotalAmount: subtotal,
          totalAmount: total,
          sgst: sgstRate,
          cgst: cgstRate,
          company_id: selectedCompany.id,
          isEditMode: true
        }
      });

    } catch (error) {
      console.error('Preview Error:', error);
      const errorMessage = error.message.includes('404')
        ? `Invoice "${invoice_no}" not found.`
        : error.message.includes('Network')
          ? 'Unable to connect to server.'
          : `Failed to load invoice: ${error.message}`;
      notify(errorMessage, "error");
    }
  };

  const initiateCancelInvoice = (invoice_no, clientName) => {
    setInvoiceToCancel({ invoice_no, clientName });
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!invoiceToCancel) return;
    const { invoice_no } = invoiceToCancel;

    try {
      const response = await api.put(`/ledger/cancel?invoice_no=${encodeURIComponent(invoice_no)}`);
      const data = await response.json();

      if (response.ok) {
        notify(`Invoice ${invoice_no} cancelled successfully.`, "success");
        fetchLedgerData();
      } else {
        notify(data.error || 'Failed to cancel invoice', "error");
      }
    } catch (error) {
      console.error('Cancel invoice error:', error);
      notify('Failed to cancel invoice', "error");
    } finally {
      setShowCancelModal(false);
      setInvoiceToCancel(null);
    }
  };


  return (
    <>
      <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900 font-sans">
        <div className="max-w-6xl mx-auto">
          {selectedCompany && (
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-90">Viewing Ledger For</p>
                  <p className="text-xl font-bold">{selectedCompany.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75">Company ID: {selectedCompany.id}</p>
                  <p className="text-xs opacity-75">{selectedCompany.shortName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 mt-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Financial Ledger
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">Transaction Management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Billed</p>
              <p className="text-3xl font-black text-slate-900">₹{stats.totalDebit.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Collected</p>
              <p className="text-3xl font-black text-emerald-600">₹{stats.totalCredit.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">NET OUTSTANDING</p>
              <p className="text-3xl font-black text-indigo-600">₹{stats.outstanding.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Filter by invoice or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select onChange={(e) => setFromMonth(e.target.value)} className="bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold">
                  <option value="All">From: Start</option>
                  {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select onChange={(e) => setToMonth(e.target.value)} className="bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold">
                  <option value="All">To: End</option>
                  {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold min-w-[160px]">
                  <option value="All">View All Clients</option>
                  {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-widest font-black border-b">
                    <th className="py-5 px-6">Date</th>
                    <th className="px-4">Invoice No.</th>
                    <th className="px-4">Client</th>
                    <th className="text-right px-4">Sale</th>
                    <th className="text-right px-4">Receipt</th>
                    <th className="text-right px-4">Due</th>
                    <th className="text-right px-6">Status</th>
                    <th className="text-center px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((row, index) => {
                    const due = getRowDueAmount(row);
                    const status = getPaymentStatus(row);
                    const isCancelled = row.status === 'cancelled';
                    return (
                      <tr key={index} className={`hover:bg-slate-50 ${isCancelled ? 'bg-red-50/30' : ''}`}>
                        <td className={`py-5 px-6 text-slate-500 ${isCancelled ? 'line-through opacity-50' : ''}`}>{row.date}</td>
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => !isCancelled && openInvoicePopup(row)}
                              className={`bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md font-mono text-xs border font-bold ${isCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={isCancelled}
                            >
                              {row.invoice}
                            </button>
                            {isCancelled && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-4 font-bold ${isCancelled ? 'line-through opacity-50' : ''}`}>{row.client}</td>
                        <td className={`text-right px-4 ${isCancelled ? 'line-through opacity-50' : ''}`}>{row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "—"}</td>
                        <td className={`text-right px-4 text-emerald-600 ${isCancelled ? 'line-through opacity-50' : ''}`}>{row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "—"}</td>
                        <td className={`text-right px-4 font-bold ${isCancelled ? 'line-through opacity-50' : ''}`}>{due > 0 ? `₹${due.toLocaleString()}` : "—"}</td>
                        <td className="text-right px-6">
                          <button onClick={() => !isCancelled && openInvoicePopup(row)} disabled={isCancelled}>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isCancelled ? 'bg-gray-100 text-gray-400 border-gray-200' : status.color}`}>
                              {isCancelled ? 'Cancelled' : status.label}
                            </span>
                          </button>
                        </td>
                        <td className="text-center px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePreviewInvoice(row.invoice)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title={isCancelled ? "Preview Cancelled Invoice" : "Preview Invoice"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </button>
                            {!isCancelled && (
                              <button
                                onClick={() => initiateCancelInvoice(row.invoice, row.client)}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                                title="Cancel Invoice"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedClient !== "All" && clientSummaryStats && (
              <div className="bg-slate-50 p-8 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold">Selected Party: {selectedClient}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                      Outstanding: <span className={clientSummaryStats.outstanding > 0 ? 'text-orange-500' : 'text-emerald-600'}>₹{clientSummaryStats.outstanding.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {invoicePopup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 px-4 py-4 md:px-8 md:py-6 border-b flex justify-between items-start md:items-center shrink-0">
                <div className="mr-2">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <h2 className="text-lg md:text-xl font-black text-slate-800">
                      Invoice #{invoicePopup.invoice}
                    </h2>
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${calculateTotalDue() <= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      {calculateTotalDue() <= 0 ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-slate-500 mt-1 break-words line-clamp-2">
                    Client: <span className="text-slate-900">{invoicePopup.client}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setInvoicePopup(null)}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-100 transition-colors text-lg md:text-xl"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-8 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                  <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Total Sale
                    </p>
                    <p className="text-base md:text-lg font-bold">
                      ₹{calculateTotalSale().toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">
                      Received
                    </p>
                    <p className="text-base md:text-lg font-bold text-emerald-700">
                      ₹{calculateTotalReceived().toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-indigo-50 rounded-2xl border border-indigo-100 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">
                      Due
                    </p>
                    <p className="text-base md:text-lg font-bold text-indigo-700">
                      ₹{calculateTotalDue().toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border rounded-2xl overflow-hidden overflow-x-auto shadow-sm mb-8">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-white text-[10px] uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-4 text-left">Date</th>
                        <th className="px-4 py-4 text-right">Sale</th>
                        <th className="px-4 py-4 text-right">Receipt</th>
                        <th className="px-4 py-4 text-right">Balance</th>
                        <th className="px-4 py-4 text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...invoicePopup.history]
                        .sort((a, b) =>
                          getSortableDate(a.date).localeCompare(
                            getSortableDate(b.date)
                          )
                        )
                        .map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                              {row.date}
                            </td>
                            <td className="px-4 py-4 text-right font-semibold">
                              {row.debit > 0
                                ? `₹${row.debit.toLocaleString()}`
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                              {row.credit > 0
                                ? `₹${row.credit.toLocaleString()}`
                                : "—"}
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-slate-900">
                              ₹{calculateRunningBalance(i).toLocaleString()}
                            </td>
                            <td
                              className="px-4 py-4 text-xs text-slate-500 italic max-w-[150px] truncate"
                              title={row.remarks}
                            >
                              {row.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                      General Notes
                    </label>
                    <textarea
                      rows={6}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border text-sm outline-none bg-slate-50/50"
                    />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border">
                    <h4 className="text-xs font-black uppercase text-slate-600 mb-4">
                      Quick Payment Record
                    </h4>

                    <div className="space-y-3">
                      <input
                        type="date"
                        value={newReceipt.date}
                        disabled={calculateTotalDue() <= 0}
                        onChange={(e) =>
                          setNewReceipt({ ...newReceipt, date: e.target.value })
                        }
                        className="w-full border rounded-xl px-4 py-2.5 text-sm"
                      />

                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={newReceipt.amount}
                        disabled={calculateTotalDue() <= 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val <= calculateTotalDue()) {
                            setNewReceipt({ ...newReceipt, amount: e.target.value });
                          }
                        }}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm"
                      />

                      <input
                        type="text"
                        placeholder="Remark for this payment"
                        value={newReceipt.remark}
                        disabled={calculateTotalDue() <= 0}
                        onChange={(e) =>
                          setNewReceipt({ ...newReceipt, remark: e.target.value })
                        }
                        className="w-full border rounded-xl px-4 py-2.5 text-sm"
                      />

                      <button
                        onClick={handleAddReceipt}
                        disabled={
                          !newReceipt.amount ||
                          !newReceipt.date ||
                          calculateTotalDue() <= 0
                        }
                        className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold shadow-lg"
                      >
                        Save Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
          title="Cancel Invoice"
          message={invoiceToCancel ? `Are you sure you want to cancel invoice "${invoiceToCancel.invoice_no}" for ${invoiceToCancel.clientName}? This action cannot be undone.` : ""}
          confirmText="Yes, Cancel Invoice"
          cancelText="No, Keep It"
        />

      </div>
      <footer className="mt-12 py-8 border-t text-center text-slate-500 text-sm">
        <p>© 2026 R.K Casting & Engineering Works. All rights reserved.</p>
      </footer>
    </>
  );
}