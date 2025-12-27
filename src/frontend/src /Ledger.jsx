import React, { useState, useMemo, useEffect } from "react";

// --- Gemini API Configuration ---
const apiKey = "AIzaSyCHp3nnknE7_iI3cLxuDfWXrysoxRIq6-o";
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("API Limit reached");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      if (i === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

export default function App() {
  // 🔹 INITIAL DATA (Fallback if no local storage)
  const initialData = [
    { date: "21 Nov 2025", invoice: "INV-090", client: "ACC Limited", debit: 0, credit: 20000, balance: 20000 },
    { date: "28 Nov 2025", invoice: "INV-091", client: "ACC Limited", debit: 15000, credit: 0, balance: 5000 },
    { date: "10 Dec 2025", invoice: "INV-101", client: "ABC Pvt Ltd", debit: 12000, credit: 0, balance: 12000 },
    { date: "12 Dec 2025", invoice: "INV-102", client: "XYZ Industries", debit: 15000, credit: 15000, balance: 0 },
    { date: "20 Dec 2025", invoice: "INV-103", client: "ACC Limited", debit: 30000, credit: 0, balance: 25000 },
    { date: "05 Jan 2026", invoice: "INV-110", client: "ABC Pvt Ltd", debit: 0, credit: 12000, balance: 13000 },
    { date: "15 Jan 2026", invoice: "INV-111", client: "XYZ Industries", debit: 18000, credit: 0, balance: 31000 },
    { date: "17 Jan 2026", invoice: "INV-112", client: "XYZ Industries", debit: 18000, credit: 15000, balance: 46000 },
    { date: "21 Dec 2025", invoice: "INV-104", client: "ACC Limited", debit: 30000, credit: 30000, balance: 25000 },
  ];

  // 🔹 STATE
  const [ledgerData] = useState(() => {
    const saved = localStorage.getItem("client_ledger_data_visual");
    return saved ? JSON.parse(saved) : initialData;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [fromMonth, setFromMonth] = useState("All");
  const [toMonth, setToMonth] = useState("All");
  const [selectedClient, setSelectedClient] = useState("All");
  const [aiInsight, setAiInsight] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [draftEmail, setDraftEmail] = useState(null);

  // 🔹 HELPERS
  const monthMap = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  
  const getSortableDate = (dateStr) => {
    if (dateStr.includes('-')) return dateStr;
    const [day, mon, year] = dateStr.split(" ");
    return `${year}-${monthMap[mon]}-${day.padStart(2, '0')}`;
  };

  const parseMonth = (dateStr) => {
    if (dateStr.includes('-')) {
        const [y, m] = dateStr.split("-");
        return `${y}-${m}`;
    }
    const [, mon, year] = dateStr.split(" ");
    return `${year}-${monthMap[mon]}`;
  };

  const monthOptions = useMemo(
    () => Array.from(new Set(ledgerData.map((row) => parseMonth(row.date)))).sort(),
    [ledgerData]
  );

  const clientOptions = useMemo(
    () => Array.from(new Set(ledgerData.map((row) => row.client))),
    [ledgerData]
  );

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

  // 🔹 GEMINI AI FEATURES
  const generateAIInsight = async () => {
    setIsGeneratingInsight(true);
    const summary = filteredData.slice(0, 30).map(d => `${d.client}: Billed ₹${d.debit}, Paid ₹${d.credit}`).join(", ");
    
    if (!summary) {
        setAiInsight("No transactions found for this timeline to analyze.");
        setIsGeneratingInsight(false);
        return;
    }

    const prompt = `Based on this filtered ledger for the selected timeline: [${summary}]. 
    Overall Stats for this period: Total Billed: ₹${stats.totalDebit}, Outstanding: ₹${stats.outstanding}. 
    In strictly 1 or 2 sentences of professional Hinglish, identify the most critical client that needs a reminder. Focus only on the most urgent one.`;
    
    try {
      const result = await callGemini(prompt);
      setAiInsight(result);
    } catch (e) {
      setAiInsight("Unable to connect to AI. Please check your internet connection.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const draftReminderEmail = async (tone = "Professional") => {
    if (selectedClient === "All" || !clientSummaryStats) return;
    setDraftEmail({ loading: true, client: selectedClient, tone });
    const prompt = `Write a ${tone} payment reminder to ${selectedClient} from R.K Casting & Engineering Works. Total Outstanding: ₹${clientSummaryStats.outstanding}. Tone: ${tone}. No placeholders.`;
    try {
      const result = await callGemini(prompt);
      setDraftEmail({ loading: false, client: selectedClient, tone, text: result, amount: clientSummaryStats.outstanding });
    } catch (e) {
      setDraftEmail(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Ledger</h1>
            <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">AI powered analysis</p>
          </div>
          {selectedClient === "All" && (
            <button 
              onClick={generateAIInsight}
              disabled={isGeneratingInsight}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
            >
              {isGeneratingInsight ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </span>
              ) : "Identify Critical Client"}
            </button>
          )}
        </div>

        {/* CRITICAL CLIENT ALERT (ONLY SHOWS AFTER BUTTON CLICK) */}
        {aiInsight && (
          <div className="mb-8 bg-white border border-indigo-100 p-6 rounded-2xl relative animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl shadow-slate-200/50">
             <button onClick={() => setAiInsight("")} className="absolute top-4 right-5 text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold">
                &times;
             </button>
             <div className="flex gap-5 items-start">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 text-2xl shadow-sm border border-indigo-100">🔍</div>
                <div>
                   <h3 className="font-bold text-indigo-600 text-[10px] uppercase tracking-[0.2em] mb-2">Critical Analysis </h3>
                   <p className="text-lg text-slate-700 leading-relaxed font-medium">"{aiInsight}"</p>
                </div>
             </div>
          </div>
        )}

        {/* 🔹 ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Billed</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{stats.totalDebit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Collected</p>
            <p className="text-3xl font-black text-emerald-600 tracking-tighter">₹{stats.totalCredit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Timeline Balance</p>
            <p className="text-3xl font-black text-indigo-600 tracking-tighter">₹{stats.outstanding.toLocaleString()}</p>
          </div>
        </div>

        {/* 🔹 LEDGER TABLE & FILTERS */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 bg-white">
             <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Filter by invoice..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                />
             </div>
             <div className="flex flex-wrap gap-2">
                <select onChange={(e) => setFromMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer text-slate-600">
                  <option value="All">From: Start</option>
                  {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select onChange={(e) => setToMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer text-slate-600">
                  <option value="All">To: End</option>
                  {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer min-w-[160px] text-slate-600">
                  <option value="All">View All Clients</option>
                  {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>

          <div className="overflow-x-auto bg-white">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-black border-b border-slate-100">
                  <th className="py-5 px-6">Date</th>
                  <th className="px-4">Invoice</th>
                  <th className="px-4">Client</th>
                  <th className="text-right px-4">Debit</th>
                  <th className="text-right px-4">Credit</th>
                  <th className="text-right px-6">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, index) => (
                  <tr key={index} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-5 px-6 text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                    <td className="px-4">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md font-mono text-xs border border-slate-200 font-bold">
                        {row.invoice}
                      </span>
                    </td>
                    <td className="px-4 font-bold text-slate-700">{row.client}</td>
                    <td className="text-right px-4 text-slate-400 font-medium tracking-tight">
                      {row.debit > 0 ? `₹${Number(row.debit).toLocaleString()}` : "—"}
                    </td>
                    <td className="text-right px-4 text-emerald-600 font-medium tracking-tight">
                      {row.credit > 0 ? `₹${Number(row.credit).toLocaleString()}` : "—"}
                    </td>
                    <td className="text-right px-6 font-mono text-xs text-slate-400 font-bold">
                       ₹{Number(row.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 🔹 SMART COLLECTION TOOLS (FOR SELECTED CLIENT) */}
          {selectedClient !== "All" && clientSummaryStats && (
            <div className="bg-slate-50 p-8 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 mb-1">Selected Party : {selectedClient}</h3>
                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                        Current Outstanding: <span className={clientSummaryStats.outstanding > 0 ? 'text-orange-500' : 'text-emerald-600'}>₹{clientSummaryStats.outstanding.toLocaleString()}</span>
                     </p>
                  </div>
                  
                  {clientSummaryStats.outstanding > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <p className="text-[20px] text-slate-500 uppercase font-black tracking-widest col-span-2">
                           Generate Reminder 
                     </p>
                       <button onClick={() => draftReminderEmail("Gentle")} className="bg-white hover:bg-emerald-50 text-emerald-600 px-6 py-3 rounded-xl font-bold border border-emerald-200 shadow-sm transition-all flex items-center gap-2">
                         Gentle
                       </button>
                       <button onClick={() => draftReminderEmail("Urgent")} className="bg-white hover:bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold border border-red-200 shadow-sm transition-all flex items-center gap-2">
                         Urgent
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 EMAIL DRAFT MODAL */}
      {draftEmail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 from-indigo-500 to-blue-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900">
                    <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">✨</span>
                    {draftEmail.tone} Draft
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">{draftEmail.client} • ₹{draftEmail.amount?.toLocaleString()}</p>
                </div>
                <button onClick={() => setDraftEmail(null)} className="text-slate-400 hover:text-slate-600 transition-colors text-3xl">&times;</button>
              </div>

              {draftEmail.loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 italic text-sm"> AI is crafting the message...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                    {draftEmail.text}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        const el = document.createElement('textarea');
                        el.value = draftEmail.text;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                      }}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-[0.97]"
                    >
                      Copy Draft
                    </button>
                    <button 
                      onClick={() => {
                         const message = encodeURIComponent(draftEmail.text);
                         window.open(`https://wa.me/?text=${message}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-[0.97]"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}