import React, { useState, useMemo, useEffect } from "react";
import Navbar from "./components/Navbarr";
import Footer from "./components/Footer";

// --- Gemini API Configuration ---
const apiKey = "AIzaSyAUPpi_33zKIS9ADNyN8nOA3i-jDskHTJ0";
const GEMINI_MODEL = "gemini-2.5-flash";

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
  { "date": "21 Nov 2025", "invoice": "INV-090", "client": "ACC Limited", "debit": 0, "credit": 20000 },

  { "date": "10 May 2025", "invoice": "INV-091", "client": "Aditya Birla Traders", "debit": 17100, "credit": 0 },
  { "date": "04 Nov 2025", "invoice": "INV-092", "client": "Rapido Bike Taxi", "debit": 0, "credit": 20900 },
  { "date": "16 Dec 2025", "invoice": "INV-093", "client": "Reliance Retail Pvt Ltd", "debit": 20100, "credit": 0 },
  { "date": "14 May 2025", "invoice": "INV-094", "client": "Uber India Systems", "debit": 0, "credit": 7900 },
  { "date": "03 Feb 2025", "invoice": "INV-095", "client": "EY India Knowledge Center", "debit": 29900, "credit": 0 },
  { "date": "06 Sep 2025", "invoice": "INV-096", "client": "Future Retail Partners", "debit": 0, "credit": 8900 },
  { "date": "13 Mar 2025", "invoice": "INV-097", "client": "JSW Steel Dealers", "debit": 27300, "credit": 0 },
  { "date": "27 Jul 2025", "invoice": "INV-098", "client": "Lemon Tree Hotels", "debit": 0, "credit": 14300 },
  { "date": "08 May 2025", "invoice": "INV-099", "client": "ITC Foods Division", "debit": 20700, "credit": 0 },

  { "date": "19 Jan 2025", "invoice": "INV-100", "client": "Indian Oil Retail", "debit": 0, "credit": 15900 },
  { "date": "25 Apr 2025", "invoice": "INV-101", "client": "GAIL Gas Distribution", "debit": 17900, "credit": 0 },
  { "date": "12 Oct 2025", "invoice": "INV-102", "client": "Zoomcar Mobility India", "debit": 0, "credit": 11700 },
  { "date": "01 Aug 2025", "invoice": "INV-103", "client": "Amazon India Marketplace", "debit": 34100, "credit": 0 },
  { "date": "06 Jun 2025", "invoice": "INV-104", "client": "Indian Railways Catering", "debit": 0, "credit": 9400 },
  { "date": "18 Mar 2025", "invoice": "INV-105", "client": "BigBasket Grocery Mart", "debit": 19700, "credit": 0 },
  { "date": "23 Sep 2025", "invoice": "INV-106", "client": "Tata Power Renewables", "debit": 0, "credit": 10400 },
  { "date": "30 Jan 2025", "invoice": "INV-107", "client": "Apollo Pharmacy Outlets", "debit": 21300, "credit": 0 },
  { "date": "21 Feb 2025", "invoice": "INV-108", "client": "Taj Hotels & Resorts", "debit": 0, "credit": 13200 },

  { "date": "11 Apr 2025", "invoice": "INV-109", "client": "Nykaa Beauty Retailers", "debit": 24200, "credit": 0 },
  { "date": "29 May 2025", "invoice": "INV-110", "client": "Apollo Hospitals Group", "debit": 0, "credit": 11000 },
  { "date": "03 Aug 2025", "invoice": "INV-111", "client": "Myntra Fashion Brands", "debit": 16700, "credit": 0 },
  { "date": "17 Jul 2025", "invoice": "INV-112", "client": "MakeMyTrip Travel Desk", "debit": 0, "credit": 8700 },
  { "date": "09 Sep 2025", "invoice": "INV-113", "client": "Spencers Retail Chain", "debit": 22200, "credit": 0 },
  { "date": "28 Feb 2025", "invoice": "INV-114", "client": "Adani Logistics Corp", "debit": 0, "credit": 19300 },
  { "date": "07 Nov 2025", "invoice": "INV-115", "client": "HDFC Finance Services", "debit": 33100, "credit": 0 },
  { "date": "05 Dec 2025", "invoice": "INV-116", "client": "IRCTC Tourism Division", "debit": 0, "credit": 9100 },
  { "date": "15 Jan 2025", "invoice": "INV-117", "client": "Unacademy Edu Services", "debit": 25400, "credit": 0 },

  { "date": "27 Mar 2025", "invoice": "INV-118", "client": "Fortis Healthcare Ltd", "debit": 0, "credit": 16100 },
  { "date": "19 Jun 2025", "invoice": "INV-119", "client": "Tata Motors Commercial", "debit": 28800, "credit": 0 },
  { "date": "02 Oct 2025", "invoice": "INV-120", "client": "ACC Limited", "debit": 0, "credit": 12100 },
  { "date": "24 Apr 2025", "invoice": "INV-121", "client": "Reliance Smart Bazaar", "debit": 17500, "credit": 0 },
  { "date": "30 Aug 2025", "invoice": "INV-122", "client": "TVS Auto Parts", "debit": 0, "credit": 9600 },
  { "date": "08 Jan 2025", "invoice": "INV-123", "client": "Infosys Consulting India", "debit": 26300, "credit": 0 },
  { "date": "22 May 2025", "invoice": "INV-124", "client": "ICICI Capital Advisors", "debit": 0, "credit": 13400 },
  { "date": "04 Jul 2025", "invoice": "INV-125", "client": "Oyo Rooms India", "debit": 21900, "credit": 0 },
  { "date": "18 Oct 2025", "invoice": "INV-126", "client": "Larsen Projects India", "debit": 0, "credit": 17800 },

  { "date": "06 Feb 2025", "invoice": "INV-127", "client": "Hero MotoCorp Dealers", "debit": 29100, "credit": 0 },
  { "date": "20 Mar 2025", "invoice": "INV-128", "client": "JSW Steel Dealers", "debit": 0, "credit": 10500 },
  { "date": "02 May 2025", "invoice": "INV-129", "client": "Bata India Footwear", "debit": 22400, "credit": 0 },
  { "date": "09 Jun 2025", "invoice": "INV-130", "client": "Hindustan Petroleum Hub", "debit": 0, "credit": 14200 },
  { "date": "21 Aug 2025", "invoice": "INV-131", "client": "Mphasis Cloud Systems", "debit": 18500, "credit": 0 },
  { "date": "12 Dec 2025", "invoice": "INV-132", "client": "Snapdeal Commerce Pvt Ltd", "debit": 0, "credit": 8800 },
  { "date": "14 Jan 2025", "invoice": "INV-133", "client": "PolicyBazaar Insurance Desk", "debit": 25600, "credit": 0 },
  { "date": "26 Feb 2025", "invoice": "INV-134", "client": "MedPlus Health Stores", "debit": 0, "credit": 9900 },
  { "date": "03 Apr 2025", "invoice": "INV-135", "client": "SpiceJet Cargo Division", "debit": 20700, "credit": 0 },

  { "date": "16 May 2025", "invoice": "INV-136", "client": "Capgemini Consulting Hub", "debit": 0, "credit": 17300 },
  { "date": "25 Jul 2025", "invoice": "INV-137", "client": "Wipro Digital Labs", "debit": 31400, "credit": 0 },
  { "date": "05 Sep 2025", "invoice": "INV-138", "client": "Trent Hypermarket India", "debit": 0, "credit": 13200 },
  { "date": "13 Nov 2025", "invoice": "INV-139", "client": "Asian Paints Solutions", "debit": 21100, "credit": 0 },
  { "date": "07 Mar 2025", "invoice": "INV-140", "client": "RedBus Online Booking", "debit": 0, "credit": 12500 },
  { "date": "28 Jun 2025", "invoice": "INV-141", "client": "Havells Electricals Hub", "debit": 23800, "credit": 0 },
  { "date": "19 Aug 2025", "invoice": "INV-142", "client": "Max Healthcare Institute", "debit": 0, "credit": 13700 },
  { "date": "01 Oct 2025", "invoice": "INV-143", "client": "FabIndia Lifestyle LLP", "debit": 22100, "credit": 0 },
  { "date": "11 Dec 2025", "invoice": "INV-144", "client": "UltraTech Cement Dealers", "debit": 0, "credit": 15100 },

  { "date": "09 Jan 2025", "invoice": "INV-145", "client": "Aditya Birla Traders", "debit": 24700, "credit": 0 },
  { "date": "23 Feb 2025", "invoice": "INV-146", "client": "Oberoi Hospitality Group", "debit": 0, "credit": 9100 },
  { "date": "04 Apr 2025", "invoice": "INV-147", "client": "Flipkart Seller Services", "debit": 19500, "credit": 0 },
  { "date": "15 May 2025", "invoice": "INV-148", "client": "Indian Railways Catering", "debit": 0, "credit": 11800 },
  { "date": "27 Jul 2025", "invoice": "INV-149", "client": "Tata Steel Works", "debit": 28900, "credit": 0 },
  { "date": "06 Sep 2025", "invoice": "INV-150", "client": "EaseMyTrip India", "debit": 0, "credit": 10700 },
  { "date": "18 Oct 2025", "invoice": "INV-151", "client": "Deloitte Shared Services", "debit": 23200, "credit": 0 },
  { "date": "29 Nov 2025", "invoice": "INV-152", "client": "Grofers Daily Essentials", "debit": 0, "credit": 9900 },
  { "date": "02 Feb 2025", "invoice": "INV-153", "client": "Dr Lal PathLabs", "debit": 21700, "credit": 0 },

  { "date": "17 Mar 2025", "invoice": "INV-154", "client": "Mindtree Tech Partners", "debit": 0, "credit": 10500 },
  { "date": "30 Apr 2025", "invoice": "INV-155", "client": "IndiGo Airlines Services", "debit": 26500, "credit": 0 },
  { "date": "12 Jun 2025", "invoice": "INV-156", "client": "Bharat Petroleum Depot", "debit": 0, "credit": 14300 },
  { "date": "24 Jul 2025", "invoice": "INV-157", "client": "Raymond Apparel Stores", "debit": 28400, "credit": 0 },
  { "date": "03 Sep 2025", "invoice": "INV-158", "client": "Zomato Food Services", "debit": 0, "credit": 9500 },
  { "date": "14 Nov 2025", "invoice": "INV-159", "client": "PwC Tax Solutions", "debit": 30100, "credit": 0 },
  { "date": "08 Jan 2025", "invoice": "INV-160", "client": "NHPC Hydro Projects", "debit": 0, "credit": 13600 },
  { "date": "20 Feb 2025", "invoice": "INV-161", "client": "KPMG Advisory India", "debit": 22700, "credit": 0 },
  { "date": "01 Apr 2025", "invoice": "INV-162", "client": "Thyrocare Diagnostics", "debit": 0, "credit": 11200 },

  { "date": "13 May 2025", "invoice": "INV-163", "client": "Cognizant India Delivery", "debit": 25900, "credit": 0 },
  { "date": "22 Jun 2025", "invoice": "INV-164", "client": "Rapido Bike Taxi", "debit": 0, "credit": 9800 },
  { "date": "05 Aug 2025", "invoice": "INV-165", "client": "Yatra Online Pvt Ltd", "debit": 24600, "credit": 0 },
  { "date": "16 Oct 2025", "invoice": "INV-166", "client": "DMart Wholesale Supplies", "debit": 0, "credit": 11900 },
  { "date": "27 Nov 2025", "invoice": "INV-167", "client": "Ajio Lifestyle Store", "debit": 28100, "credit": 0 },
  { "date": "06 Jan 2025", "invoice": "INV-168", "client": "Treebo Hotels Network", "debit": 0, "credit": 9300 },
  { "date": "19 Mar 2025", "invoice": "INV-169", "client": "Ola Mobility Services", "debit": 23800, "credit": 0 },
  { "date": "30 May 2025", "invoice": "INV-170", "client": "Indian Oil Retail", "debit": 0, "credit": 12800 },
  { "date": "11 Jul 2025", "invoice": "INV-171", "client": "JSW Steel Dealers", "debit": 25500, "credit": 0 },

  { "date": "23 Aug 2025", "invoice": "INV-172", "client": "Future Retail Partners", "debit": 0, "credit": 12100 },
  { "date": "04 Oct 2025", "invoice": "INV-173", "client": "Tata Motors Commercial", "debit": 29300, "credit": 0 },
  { "date": "15 Nov 2025", "invoice": "INV-174", "client": "Vistara Aviation Pvt Ltd", "debit": 0, "credit": 13700 },
  { "date": "26 Dec 2025", "invoice": "INV-175", "client": "Hero MotoCorp Dealers", "debit": 31800, "credit": 0 },
  { "date": "07 Feb 2025", "invoice": "INV-176", "client": "Lemon Tree Hotels", "debit": 0, "credit": 10900 },
  { "date": "19 Apr 2025", "invoice": "INV-177", "client": "Apollo Pharmacy Outlets", "debit": 24100, "credit": 0 },
  { "date": "01 Jun 2025", "invoice": "INV-178", "client": "Tata Power Renewables", "debit": 0, "credit": 15200 },
  { "date": "13 Aug 2025", "invoice": "INV-179", "client": "ACC Limited", "debit": 26900, "credit": 0 },
  { "date": "24 Oct 2025", "invoice": "INV-180", "client": "Spencers Retail Chain", "debit": 0, "credit": 13900 }
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
    const summary = filteredData.slice(0, 100).map(d => `${d.client}: Billed ₹${d.debit}, Paid ₹${d.credit}`).join(", ");
    
    if (!summary) {
        setAiInsight("No transactions found for this timeline to analyze.");
        setIsGeneratingInsight(false);
        return;
    }

    const prompt = `
You are a senior accounts receivable analyst.

Analyze the following filtered ledger data for the selected period:
[${summary}]

Financial snapshot:
• Total Billed: ₹${stats.totalDebit}
• Total Outstanding: ₹${stats.outstanding}

Task:
Identify top 3 client who requires the MOST URGENT payment reminder.

Decision rules (follow strictly):
1. Prioritize the client with the highest outstanding amount.
3. Do list multiple clients.
4. Do NOT explain calculations.

Output requirements:
• Limit the response to STRICTLY 1–2 sentences.
• Clearly name the client and why they need immediate follow-up.
`;

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
    <>
    <Navbar className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200" />
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 mt-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 mt-6">
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center ">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Billed</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{stats.totalDebit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center ">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Collected</p>
            <p className="text-3xl font-black text-emerald-600 tracking-tighter">₹{stats.totalCredit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1"> NET OUTSTANDING</p>
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
                <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-widest font-black border-b border-slate-100">
                  <th className="py-5 px-12">Date</th>
                  <th className="px-4">Invoice No.</th>
                  <th className="px-9">Client</th>
                  <th className="text-right px-5.5">Sale</th>
                  <th className="text-right px-4 ">Reciept</th>
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
    </>
  );
}