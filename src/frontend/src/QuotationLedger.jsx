import React, { useState, useEffect, useMemo } from "react";

import { api, handleApiResponse } from "./config/apiClient.js";
import { useCompany } from "./context/CompanyContext.jsx";
import { useNavigate } from "react-router-dom";
import { notify } from "./components/Notification.jsx";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

export default function QuotationLedger() {
    const { selectedCompany } = useCompany();
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch quotations
    const fetchQuotations = async () => {
        setLoading(true);
        try {
            // Returns array of quotations from GET /createQuotation
            const data = await handleApiResponse(api.get('/createQuotation'));
            if (Array.isArray(data)) {
                setQuotations(data);
            } else {
                setQuotations([]);
                console.error("Unexpected response format:", data);
            }
        } catch (err) {
            console.error("Error fetching quotations:", err);
            // notify("Failed to fetch quotations", "error"); 
            // Silent fail or less intrusive? Nah, user needs to know.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCompany) {
            fetchQuotations();
        }
    }, [selectedCompany]);

    // Handle Status Update
    const updateStatus = async (quotationNo, newStatus) => {
        try {
            // The route is PUT /createQuotation/:id/status
            await handleApiResponse(api.put('/createQuotation/status', { quotation_no: quotationNo, status: newStatus }));
            notify(`Quotation ${quotationNo} marked as ${newStatus}`, "success");
            fetchQuotations(); // Refresh list
        } catch (err) {
            console.error("Error updating status:", err);
            notify(`Failed to update status: ${err.message}`, "error");
        }
    };

    // Filter Logic
    const filteredQuotations = useMemo(() => {
        return quotations.filter(q =>
            (q.quotation_no?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (q.party_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
    }, [quotations, searchTerm]);

    // Helpers
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'converted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 px-4 py-8 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Quotation Ledger</h1>
                            <p className="text-slate-500 mt-1">Manage and track your quotation pipeline</p>
                        </div>
                        <div>
                            <button
                                onClick={() => navigate('/Quotation')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
                            >
                                <FileText size={18} />
                                Create New Quotation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Quotations</p>
                        <p className="text-3xl font-black text-slate-900">{quotations.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Value</p>
                        <p className="text-3xl font-black text-amber-600">
                            ₹{quotations.filter(q => q.status === 'Pending').reduce((sum, q) => sum + Number(q.total_amount || 0), 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Converted Value</p>
                        <p className="text-3xl font-black text-emerald-600">
                            ₹{quotations.filter(q => q.status === 'Converted').reduce((sum, q) => sum + Number(q.total_amount || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>


                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 sticky top-20 z-10">
                    <input
                        type="text"
                        placeholder="Search by Quotation No or Client Name..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Quotation No</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">Loading quotations...</td>
                                    </tr>
                                ) : filteredQuotations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                            No quotations found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQuotations.map((q) => (
                                        <tr key={q.quotation_no} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(q.quotation_date)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-indigo-600 font-mono">{q.quotation_no}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">{q.party_name || q.client_name || "Unknown Client"}</td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">₹{Number(q.total_amount || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(q.status)}`}>
                                                    {q.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                                                    {/* Action Buttons */}
                                                    {q.status !== 'Converted' && (
                                                        <button
                                                            onClick={() => updateStatus(q.quotation_no, 'Converted')}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg tooltip border border-transparent hover:border-emerald-200 transition-all"
                                                            title="Mark as Converted"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {q.status !== 'Rejected' && (
                                                        <button
                                                            onClick={() => updateStatus(q.quotation_no, 'Rejected')}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all"
                                                            title="Mark as Rejected"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                    {q.status !== 'Pending' && (
                                                        <button
                                                            onClick={() => updateStatus(q.quotation_no, 'Pending')}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 transition-all"
                                                            title="Mark as Pending"
                                                        >
                                                            <Clock size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
