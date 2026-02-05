
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbarr.jsx';
import Footer from './components/Footer.jsx';
import QuotationForm from './components/QuotationForm.jsx';
import { api, handleApiResponse } from './config/apiClient.js';
import { Plus, Eye, Trash2, FileText, Download } from 'lucide-react';
import { useCompany } from './context/CompanyContext.jsx';

function Quotation() {
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [quotations, setQuotations] = useState([]);
  const { selectedCompany } = useCompany();

  useEffect(() => {
    fetchQuotations();
  }, [selectedCompany, view]);

  const fetchQuotations = () => {
    handleApiResponse(api.get('/quotations'))
      .then(data => setQuotations(data))
      .catch(err => console.error("Error fetching quotations", err));
  };

  const deleteQuotation = async (id) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      await handleApiResponse(api.delete(`/quotations/${id}`));
      fetchQuotations();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete");
    }
  };

  return (
    <>
      {/* 
        This div wraps content similar to Invoice.jsx but provides list view first
      */}
      <div className="min-h-screen bg-slate-50 pb-20">
        {view === 'create' ? (
          <QuotationForm
            onSuccess={() => setView('list')}
            onCancel={() => setView('list')}
          />
        ) : (
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Quotations</h1>
                <p className="text-slate-500">Manage and track your quotations</p>
              </div>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-emerald-200"
              >
                <Plus size={20} /> New Quotation
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quotation No</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Party</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {quotations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                          <FileText size={48} className="mx-auto mb-3 opacity-20" />
                          <p>No quotations found</p>
                        </td>
                      </tr>
                    ) : (
                      quotations.map((q) => (
                        <tr key={q.quotation_no} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{q.quotation_no}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{new Date(q.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{q.party_name}</td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">₹{Number(q.total_amount).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => deleteQuotation(q.quotation_no)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
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
        )}
      </div>
      <Footer />
    </>
  )
}

export default Quotation