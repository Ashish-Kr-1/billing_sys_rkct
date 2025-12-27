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
  // 🔹 INITIAL DATA
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
  const [ledgerData, setLedgerData] = useState(() => {
    const saved = localStorage.getItem("client_ledger_data_v2");
    return saved ? JSON.parse(saved) : initialData;
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [fromMonth, setFromMonth] = useState("All");
  const [toMonth, setToMonth] = useState("All");
  const [selectedClient, setSelectedClient] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [draftEmail, setDraftEmail] = useState(null);

  // Form State
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    invoice: "",
    client: "",
    debit: 0,
    credit: 0
  });

  // 🔹 PERSISTENCE
  useEffect(() => {
    localStorage.setItem("client_ledger_data_v2", JSON.stringify(ledgerData));
  }, [ledgerData]);

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

  // 🔹 GEMINI AI FEATURES
  const generateAIInsight = async () => {
    setIsGeneratingInsight(true);
    const summary = filteredData.slice(0, 10).map(d => `${d.date}: ${d.client} - Billed ${d.debit}, Paid ${d.credit}`).join(", ");
    const prompt = `Tum ek Senior Financial Analyst ho jo ek Indian business owner ko advisory de rahe ho.

Context:
Neeche transaction ledger ka summary diya gaya hai:
${summary}

Financial Snapshot:
• Total Billed (Debit): ₹${stats.totalDebit}
• Total Collected (Credit): ₹${stats.totalCredit}
• Outstanding Receivables: ₹${stats.outstanding}

Instructions (IMPORTANT):
1. Sirf **2 sentences ka executive summary** likho.
2. Language **professional Hinglish (Hindi + English)** honi chahiye — simple, clear aur business-focused.
3. Overall cash flow position explain karo (kitna collect hua vs kitna outstanding hai).
4. **Sabse critical client ka naam clearly identify karo** jiske paas highest outstanding amount pending hai, aur follow-up ki urgency naturally mention karo.
5. Bullet points, headings, emojis, ya extra explanations bilkul mat likhna.
6. Output sirf executive summary ka paragraph ho — kuch bhi extra nahi.

Output Format:
Return only the 2-sentence executive summary.
`;
    
    try {
      const result = await callGemini(prompt);
      setAiInsight(result);
    } catch (e) {
      setAiInsight("Unable to generate insight at this time. Please try again later.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const draftReminderEmail = async (row, tone = "Professional") => {
    setDraftEmail({ loading: true, client: row.client, tone });
    const prompt = `Write a ${tone} payment reminder for ${row.client}. 
    Invoice: ${row.invoice}. 
    Date: ${row.date}. 
    Amount Due: ₹${row.debit - row.credit}. 
    Style: ${tone === 'Gentle' ? 'Very polite and helpful' : tone === 'Urgent' ? 'Strong, authoritative and time-sensitive' : 'Standard business professional'}.
    No placeholders, just the text. Keep it short.`;
    
    try {
      const result = await callGemini(prompt);
      setDraftEmail({ loading: false, client: row.client, tone, text: result, amount: row.debit - row.credit });
    } catch (e) {
      setDraftEmail(null);
    }
  };

  const handleAddEntry = (e) => {
    e.preventDefault();
    const lastBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;
    const entryBalance = lastBalance + Number(newEntry.debit) - Number(newEntry.credit);

    const formattedDate = new Date(newEntry.date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, ' ');

    setLedgerData([...ledgerData, { ...newEntry, date: formattedDate, balance: entryBalance }]);
    setIsModalOpen(false);
    setNewEntry({ date: new Date().toISOString().split('T')[0], invoice: "", client: "", debit: 0, credit: 0 });
  };

  return (
    <div className="bg-gray-950 min-h-screen p-4 md:p-8 text-gray-100 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Financial Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">AI-Powered Ledger & Smart Collections</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={generateAIInsight}
              disabled={isGeneratingInsight}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
            >
              {isGeneratingInsight ? "Analyzing..." : "✨ AI Insight (Hinglish)"}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Entry
            </button>
          </div>
        </div>

        {/* AI INSIGHT PANEL */}
        {aiInsight && (
          <div className="mb-8 bg-purple-900/10 border border-purple-500/30 p-5 rounded-2xl relative animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl">
             <button onClick={() => setAiInsight("")} className="absolute top-4 right-4 text-purple-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <div className="flex gap-4 items-start">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 text-xl shadow-inner">✨</div>
                <div>
                   <h3 className="font-bold text-purple-300 text-xs uppercase tracking-[0.2em] mb-1">Executive Summary</h3>
                   <p className="text-gray-200 leading-relaxed italic font-medium">"{aiInsight}"</p>
                </div>
             </div>
          </div>
        )}

        {/* 🔹 ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-lg group">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Billed</p>
            <p className="text-3xl font-black text-red-400 tracking-tighter">₹{stats.totalDebit.toLocaleString()}</p>
          </div>
          <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-lg group">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Collected</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter">₹{stats.totalCredit.toLocaleString()}</p>
          </div>
          <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-lg group">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Net Outstanding</p>
            <p className="text-3xl font-black text-blue-400 tracking-tighter">₹{stats.outstanding.toLocaleString()}</p>
          </div>
        </div>

        {/* 🔹 FILTERS & SEARCH */}
        <div className="bg-[#0B1120] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-800 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
               <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search invoice or client..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#020617] border border-gray-700 text-sm rounded-2xl pl-12 pr-4 py-3 focus:ring-2 ring-blue-500 outline-none transition-all"
                  />
               </div>
               <div className="flex flex-wrap gap-2">
                  <select onChange={(e) => setFromMonth(e.target.value)} className="bg-[#020617] border border-gray-700 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all cursor-pointer min-w-[130px]">
                    <option value="All">From: Start</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select onChange={(e) => setToMonth(e.target.value)} className="bg-[#020617] border border-gray-700 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all cursor-pointer min-w-[130px]">
                    <option value="All">To: End</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select onChange={(e) => setSelectedClient(e.target.value)} className="bg-[#020617] border border-gray-700 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500 transition-all cursor-pointer min-w-[150px]">
                    <option value="All">All Clients</option>
                    {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-900/50 text-gray-500 uppercase text-[10px] tracking-widest font-black border-b border-gray-800">
                  <th className="py-5 px-6">Date</th>
                  <th className="px-4">Invoice</th>
                  <th className="px-4">Client</th>
                  <th className="text-right px-4">Debit</th>
                  <th className="text-right px-4">Credit</th>
                  <th className="text-center px-6">Smart Tool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filteredData.map((row, index) => {
                  const isPaid = Number(row.debit) === 0 || Number(row.balance) <= 0 || (Number(row.debit) - Number(row.credit) <= 0);
                  const status = isPaid ? "Paid" : "Pending";

                  return (
                    <tr key={index} className="group hover:bg-gray-800/30 transition-colors">
                      <td className="py-5 px-6 text-gray-400 font-medium whitespace-nowrap">{row.date}</td>
                      <td className="px-4">
                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg font-mono text-xs border border-blue-500/20 group-hover:bg-blue-500/30 transition-all">
                          {row.invoice}
                        </span>
                      </td>
                      <td className="px-4 font-bold text-gray-200">{row.client}</td>
                      <td className="text-right px-4 text-red-400/80 font-semibold tracking-tight">
                        {row.debit > 0 ? `₹${Number(row.debit).toLocaleString()}` : "—"}
                      </td>
                      <td className="text-right px-4 text-emerald-500 font-semibold tracking-tight">
                        {row.credit > 0 ? `₹${Number(row.credit).toLocaleString()}` : "—"}
                      </td>
                      <td className="text-center px-6">
                        <div className="flex items-center justify-center gap-2">
                           <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                               status === "Paid" ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-orange-500/5 text-orange-500 border-orange-500/20"
                           }`}>
                             <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'Paid' ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                             {status}
                           </span>
                           {!isPaid && (
                             <div className="flex gap-1">
                                <button onClick={() => draftReminderEmail(row, "Gentle")} className="opacity-0 group-hover:opacity-100 p-2 bg-gray-800 hover:bg-green-600/20 rounded-lg text-green-400 transition-all border border-gray-700" title="Gentle Reminder">
                                  🕊️
                                </button>
                                <button onClick={() => draftReminderEmail(row, "Urgent")} className="opacity-0 group-hover:opacity-100 p-2 bg-gray-800 hover:bg-red-600/20 rounded-lg text-red-400 transition-all border border-gray-700" title="Urgent Reminder">
                                  ⚡
                                </button>
                             </div>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔹 EMAIL DRAFT MODAL - EFFICIENCY UPGRADE */}
      {draftEmail && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-[#111827] border border-gray-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <span className="p-2 bg-purple-500/20 rounded-xl text-purple-400">✨</span>
                    {draftEmail.tone} Reminder
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">Client: {draftEmail.client} • Due: ₹{draftEmail.amount?.toLocaleString()}</p>
                </div>
                <button onClick={() => setDraftEmail(null)} className="text-gray-500 hover:text-white transition-colors text-3xl">&times;</button>
              </div>

              {draftEmail.loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="text-gray-400 italic text-sm">Gemini AI is crafting the perfect message...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#020617] border border-gray-800 p-5 rounded-3xl text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto custom-scrollbar">
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
                        // Brief visual feedback could be added here
                      }}
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-purple-900/30 active:scale-[0.97]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                      Copy Text
                    </button>
                    <button 
                      onClick={() => {
                         const message = encodeURIComponent(draftEmail.text);
                         window.open(`https://wa.me/?text=${message}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-emerald-900/30 active:scale-[0.97]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-1.557-.487-2.661-1.488-.853-.773-1.403-1.556-1.637-1.954-.234-.398-.022-.614.181-.813.184-.182.405-.47.608-.704.186-.213.247-.365.367-.608.12-.241.06-.453-.03-.665-.09-.212-.814-1.962-1.112-2.682-.292-.705-.589-.609-.814-.621-.21-.011-.45-.014-.691-.014-.242 0-.632.091-.962.452-.331.362-1.262 1.233-1.262 3.003 0 1.77 1.292 3.487 1.474 3.729.182.241 2.541 3.881 6.151 5.435.858.37 1.53.593 2.052.757.862.274 1.646.235 2.264.144.69-.102 2.112-.862 2.412-1.693.3-.831.3-1.542.21-1.694-.09-.151-.331-.242-.691-.423z"/></svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* 🔹 ADD ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white">New Transaction</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors text-3xl">&times;</button>
            </div>
            
            <form onSubmit={handleAddEntry} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Transaction Date</label>
                <input required type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} className="w-full bg-[#020617] border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-blue-500 text-white" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Invoice #</label>
                    <input required placeholder="INV-202" value={newEntry.invoice} onChange={e => setNewEntry({...newEntry, invoice: e.target.value})} className="w-full bg-[#020617] border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-blue-500 text-white" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Client</label>
                    <input required placeholder="Client" value={newEntry.client} onChange={e => setNewEntry({...newEntry, client: e.target.value})} className="w-full bg-[#020617] border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-blue-500 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Debit (Billed)</label>
                    <input type="number" value={newEntry.debit} onChange={e => setNewEntry({...newEntry, debit: e.target.value})} className="w-full bg-[#020617] border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-blue-500 text-white" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Credit (Recv)</label>
                    <input type="number" value={newEntry.credit} onChange={e => setNewEntry({...newEntry, credit: e.target.value})} className="w-full bg-[#020617] border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-blue-500 text-white" />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-white mt-4 shadow-xl shadow-blue-900/40 transition-all active:scale-[0.98]">
                Submit Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}