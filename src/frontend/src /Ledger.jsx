import React, { useState, useMemo, useEffect } from "react";
import Navbar from "./components/Navbarr";
import { API_BASE } from "./config/api.js";
import { Navigate, useNavigate } from "react-router-dom";


const createPayment = async ({ invoice_no, party_id, amount, date, remarks }) => {
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice_no,
      party_id,
      amount,
      date,
      remarks,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save payment");
  }

  return res.json();
};

const fetchPaymentHistory = async (invoiceNo) => {
  const res = await fetch(`${API_BASE}/ledger/${invoiceNo}/payments`);
  if (!res.ok) throw new Error("Failed to fetch payment history");
  const data = await res.json();
  return data.payments || [];
};

const apiKey = "AIzaSyAUPpi_33zKIS9ADNyN8nOA3i-jDskHTJ0";
const GEMINI_MODEL = "gemini-2.5-flash";

const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };  
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
  const fallbackData = [
    { "date": "21 Nov 2025", "invoice": "INV-090", "client": "ACC Limited", "debit": 0, "credit": 20000, "remarks": "" },
    { "date": "10 May 2025", "invoice": "INV-091", "client": "Aditya Birla Traders", "debit": 17100, "credit": 0, "remarks": "" },
    { "date": "04 Nov 2025", "invoice": "INV-092", "client": "Rapido Bike Taxi", "debit": 0, "credit": 20900, "remarks": "" },
    { "date": "16 Dec 2025", "invoice": "INV-093", "client": "Reliance Retail Pvt Ltd", "debit": 20100, "credit": 0, "remarks": "" },
    { "date": "14 May 2025", "invoice": "INV-094", "client": "Uber India Systems", "debit": 0, "credit": 7900, "remarks": "" },
    { "date": "03 Feb 2025", "invoice": "INV-095", "client": "EY India Knowledge Center", "debit": 29900, "credit": 0, "remarks": "" },
    { "date": "06 Sep 2025", "invoice": "INV-096", "client": "Future Retail Partners", "debit": 0, "credit": 8900, "remarks": "" },
    { "date": "13 Mar 2025", "invoice": "INV-097", "client": "JSW Steel Dealers", "debit": 27300, "credit": 0, "remarks": "" },
    { "date": "27 Jul 2025", "invoice": "INV-098", "client": "Lemon Tree Hotels", "debit": 0, "credit": 14300, "remarks": "" },
    { "date": "08 May 2025", "invoice": "INV-099", "client": "ITC Foods Division", "debit": 20700, "credit": 0, "remarks": "" },
    { "date": "19 Jan 2025", "invoice": "INV-100", "client": "Indian Oil Retail", "debit": 0, "credit": 15900, "remarks": "" },
    { "date": "25 Apr 2025", "invoice": "INV-101", "client": "GAIL Gas Distribution", "debit": 17900, "credit": 0, "remarks": "" },
    { "date": "12 Oct 2025", "invoice": "INV-102", "client": "Zoomcar Mobility India", "debit": 0, "credit": 11700, "remarks": "" },
    { "date": "01 Aug 2025", "invoice": "INV-103", "client": "Amazon India Marketplace", "debit": 34100, "credit": 0, "remarks": "" },
    { "date": "06 Jun 2025", "invoice": "INV-104", "client": "Indian Railways Catering", "debit": 0, "credit": 9400, "remarks": "" },
    { "date": "18 Mar 2025", "invoice": "INV-105", "client": "BigBasket Grocery Mart", "debit": 19700, "credit": 0, "remarks": "" },
    { "date": "23 Sep 2025", "invoice": "INV-106", "client": "Tata Power Renewables", "debit": 0, "credit": 10400, "remarks": "" },
    { "date": "30 Jan 2025", "invoice": "INV-107", "client": "Apollo Pharmacy Outlets", "debit": 21300, "credit": 0, "remarks": "" },
    { "date": "21 Feb 2025", "invoice": "INV-108", "client": "Taj Hotels & Resorts", "debit": 0, "credit": 13200, "remarks": "" },
    { "date": "11 Apr 2025", "invoice": "INV-109", "client": "Nykaa Beauty Retailers", "debit": 24200, "credit": 0, "remarks": "" },
    { "date": "29 May 2025", "invoice": "INV-110", "client": "Apollo Hospitals Group", "debit": 0, "credit": 11000, "remarks": "" },
    { "date": "03 Aug 2025", "invoice": "INV-111", "client": "Myntra Fashion Brands", "debit": 16700, "credit": 0, "remarks": "" },
    { "date": "17 Jul 2025", "invoice": "INV-112", "client": "MakeMyTrip Travel Desk", "debit": 0, "credit": 8700, "remarks": "" },
    { "date": "09 Sep 2025", "invoice": "INV-113", "client": "Spencers Retail Chain", "debit": 22200, "credit": 0, "remarks": "" },
    { "date": "28 Feb 2025", "invoice": "INV-114", "client": "Adani Logistics Corp", "debit": 0, "credit": 19300, "remarks": "" },
    { "date": "07 Nov 2025", "invoice": "INV-115", "client": "HDFC Finance Services", "debit": 33100, "credit": 0, "remarks": "" },
    { "date": "05 Dec 2025", "invoice": "INV-116", "client": "IRCTC Tourism Division", "debit": 0, "credit": 9100, "remarks": "" },
    { "date": "15 Jan 2025", "invoice": "INV-117", "client": "Unacademy Edu Services", "debit": 25400, "credit": 0, "remarks": "" },
    { "date": "27 Mar 2025", "invoice": "INV-118", "client": "Fortis Healthcare Ltd", "debit": 0, "credit": 16100, "remarks": "" },
    { "date": "19 Jun 2025", "invoice": "INV-119", "client": "Tata Motors Commercial", "debit": 28800, "credit": 0, "remarks": "" },
    { "date": "02 Oct 2025", "invoice": "INV-120", "client": "ACC Limited", "debit": 0, "credit": 12100, "remarks": "" },
    { "date": "24 Apr 2025", "invoice": "INV-121", "client": "Reliance Smart Bazaar", "debit": 17500, "credit": 0, "remarks": "" },
    { "date": "30 Aug 2025", "invoice": "INV-122", "client": "TVS Auto Parts", "debit": 0, "credit": 9600, "remarks": "" },
    { "date": "08 Jan 2025", "invoice": "INV-123", "client": "Infosys Consulting India", "debit": 26300, "credit": 0, "remarks": "" },
    { "date": "22 May 2025", "invoice": "INV-124", "client": "ICICI Capital Advisors", "debit": 0, "credit": 13400, "remarks": "" },
    { "date": "04 Jul 2025", "invoice": "INV-125", "client": "Oyo Rooms India", "debit": 21900, "credit": 0, "remarks": "" },
    { "date": "18 Oct 2025", "invoice": "INV-126", "client": "Larsen Projects India", "debit": 0, "credit": 17800, "remarks": "" },
    { "date": "06 Feb 2025", "invoice": "INV-127", "client": "Hero MotoCorp Dealers", "debit": 29100, "credit": 0, "remarks": "" },
    { "date": "20 Mar 2025", "invoice": "INV-128", "client": "JSW Steel Dealers", "debit": 0, "credit": 10500, "remarks": "" },
    { "date": "02 May 2025", "invoice": "INV-129", "client": "Bata India Footwear", "debit": 22400, "credit": 0, "remarks": "" },
    { "date": "09 Jun 2025", "invoice": "INV-130", "client": "Hindustan Petroleum Hub", "debit": 0, "credit": 14200, "remarks": "" },
    { "date": "21 Aug 2025", "invoice": "INV-131", "client": "Mphasis Cloud Systems", "debit": 18500, "credit": 0, "remarks": "" },
    { "date": "12 Dec 2025", "invoice": "INV-132", "client": "Snapdeal Commerce Pvt Ltd", "debit": 0, "credit": 8800, "remarks": "" },
    { "date": "14 Jan 2025", "invoice": "INV-133", "client": "PolicyBazaar Insurance Desk", "debit": 25600, "credit": 0, "remarks": "" },
    { "date": "26 Feb 2025", "invoice": "INV-134", "client": "MedPlus Health Stores", "debit": 0, "credit": 9900, "remarks": "" },
    { "date": "03 Apr 2025", "invoice": "INV-135", "client": "SpiceJet Cargo Division", "debit": 20700, "credit": 0, "remarks": "" },
    { "date": "16 May 2025", "invoice": "INV-136", "client": "Capgemini Consulting Hub", "debit": 0, "credit": 17300, "remarks": "" },
    { "date": "25 Jul 2025", "invoice": "INV-137", "client": "Wipro Digital Labs", "debit": 31400, "credit": 0, "remarks": "" },
    { "date": "05 Sep 2025", "invoice": "INV-138", "client": "Trent Hypermarket India", "debit": 0, "credit": 13200, "remarks": "" },
    { "date": "13 Nov 2025", "invoice": "INV-139", "client": "Asian Paints Solutions", "debit": 21100, "credit": 0, "remarks": "" },
    { "date": "07 Mar 2025", "invoice": "INV-140", "client": "RedBus Online Booking", "debit": 0, "credit": 12500, "remarks": "" },
    { "date": "28 Jun 2025", "invoice": "INV-141", "client": "Havells Electricals Hub", "debit": 23800, "credit": 0, "remarks": "" },
    { "date": "19 Aug 2025", "invoice": "INV-142", "client": "Max Healthcare Institute", "debit": 0, "credit": 13700, "remarks": "" },
    { "date": "01 Oct 2025", "invoice": "INV-143", "client": "FabIndia Lifestyle LLP", "debit": 22100, "credit": 0, "remarks": "" },
    { "date": "11 Dec 2025", "invoice": "INV-144", "client": "UltraTech Cement Dealers", "debit": 0, "credit": 15100, "remarks": "" },
    { "date": "09 Jan 2025", "invoice": "INV-145", "client": "Aditya Birla Traders", "debit": 24700, "credit": 0, "remarks": "" },
    { "date": "23 Feb 2025", "invoice": "INV-146", "client": "Oberoi Hospitality Group", "debit": 0, "credit": 9100, "remarks": "" },
    { "date": "04 Apr 2025", "invoice": "INV-147", "client": "Flipkart Seller Services", "debit": 19500, "credit": 0, "remarks": "" },
    { "date": "15 May 2025", "invoice": "INV-148", "client": "Indian Railways Catering", "debit": 0, "credit": 11800, "remarks": "" },
    { "date": "27 Jul 2025", "invoice": "INV-149", "client": "Tata Steel Works", "debit": 28900, "credit": 0, "remarks": "" },
    { "date": "06 Sep 2025", "invoice": "INV-150", "client": "EaseMyTrip India", "debit": 0, "credit": 10700, "remarks": "" },
    { "date": "18 Oct 2025", "invoice": "INV-151", "client": "Deloitte Shared Services", "debit": 23200, "credit": 0, "remarks": "" },
    { "date": "29 Nov 2025", "invoice": "INV-152", "client": "Grofers Daily Essentials", "debit": 0, "credit": 9900, "remarks": "" },
    { "date": "02 Feb 2025", "invoice": "INV-153", "client": "Dr Lal PathLabs", "debit": 21700, "credit": 0, "remarks": "" },
    { "date": "17 Mar 2025", "invoice": "INV-154", "client": "Mindtree Tech Partners", "debit": 0, "credit": 10500, "remarks": "" },
    { "date": "30 Apr 2025", "invoice": "INV-155", "client": "IndiGo Airlines Services", "debit": 26500, "credit": 0, "remarks": "" },
    { "date": "12 Jun 2025", "invoice": "INV-156", "client": "Bharat Petroleum Depot", "debit": 0, "credit": 14300, "remarks": "" },
    { "date": "24 Jul 2025", "invoice": "INV-157", "client": "Raymond Apparel Stores", "debit": 28400, "credit": 0, "remarks": "" },
    { "date": "03 Sep 2025", "invoice": "INV-158", "client": "Zomato Food Services", "debit": 0, "credit": 9500, "remarks": "" },
    { "date": "14 Nov 2025", "invoice": "INV-159", "client": "PwC Tax Solutions", "debit": 30100, "credit": 0, "remarks": "" },
    { "date": "08 Jan 2025", "invoice": "INV-160", "client": "NHPC Hydro Projects", "debit": 0, "credit": 13600, "remarks": "" },
    { "date": "20 Feb 2025", "invoice": "INV-161", "client": "KPMG Advisory India", "debit": 22700, "credit": 0, "remarks": "" },
    { "date": "01 Apr 2025", "invoice": "INV-162", "client": "Thyrocare Diagnostics", "debit": 0, "credit": 11200, "remarks": "" },
    { "date": "13 May 2025", "invoice": "INV-163", "client": "Cognizant India Delivery", "debit": 25900, "credit": 0, "remarks": "" },
    { "date": "22 Jun 2025", "invoice": "INV-164", "client": "Rapido Bike Taxi", "debit": 0, "credit": 9800, "remarks": "" },
    { "date": "05 Aug 2025", "invoice": "INV-165", "client": "Yatra Online Pvt Ltd", "debit": 24600, "credit": 0, "remarks": "" },
    { "date": "16 Oct 2025", "invoice": "INV-166", "client": "DMart Wholesale Supplies", "debit": 0, "credit": 11900, "remarks": "" },
    { "date": "27 Nov 2025", "invoice": "INV-167", "client": "Ajio Lifestyle Store", "debit": 28100, "credit": 0, "remarks": "" },
    { "date": "06 Jan 2025", "invoice": "INV-168", "client": "Treebo Hotels Network", "debit": 0, "credit": 9300, "remarks": "" },
    { "date": "19 Mar 2025", "invoice": "INV-169", "client": "Ola Mobility Services", "debit": 23800, "credit": 0, "remarks": "" },
    { "date": "30 May 2025", "invoice": "INV-170", "client": "Indian Oil Retail", "debit": 0, "credit": 12800, "remarks": "" },
    { "date": "11 Jul 2025", "invoice": "INV-171", "client": "JSW Steel Dealers", "debit": 25500, "credit": 0, "remarks": "" },
    { "date": "23 Aug 2025", "invoice": "INV-172", "client": "Future Retail Partners", "debit": 0, "credit": 12100, "remarks": "" },
    { "date": "04 Oct 2025", "invoice": "INV-173", "client": "Tata Motors Commercial", "debit": 29300, "credit": 0, "remarks": "" },
    { "date": "15 Nov 2025", "invoice": "INV-174", "client": "Vistara Aviation Pvt Ltd", "debit": 0, "credit": 13700, "remarks": "" },
    { "date": "26 Dec 2025", "invoice": "INV-175", "client": "Hero MotoCorp Dealers", "debit": 31800, "credit": 0, "remarks": "" },
    { "date": "07 Feb 2025", "invoice": "INV-176", "client": "Lemon Tree Hotels", "debit": 0, "credit": 10900, "remarks": "" },
    { "date": "19 Apr 2025", "invoice": "INV-177", "client": "Apollo Pharmacy Outlets", "debit": 24100, "credit": 0, "remarks": "" },
    { "date": "01 Jun 2025", "invoice": "INV-178", "client": "Tata Power Renewables", "debit": 0, "credit": 15200, "remarks": "" },
    { "date": "13 Aug 2025", "invoice": "INV-179", "client": "ACC Limited", "debit": 26900, "credit": 0, "remarks": "" },
    { "date": "24 Oct 2025", "invoice": "INV-180", "client": "Spencers Retail Chain", "debit": 0, "credit": 13900, "remarks": "" }
  ];

  const [ledgerData, setLedgerData] = useState(() => {
    const saved = localStorage.getItem("client_ledger_data_visual");
    return saved ? JSON.parse(saved) : fallbackData;
  });

  useEffect(() => {
    fetch(`${API_BASE}/ledger`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data.ledger)) {
          setLedgerData(data.ledger);
          localStorage.setItem("client_ledger_data_visual", JSON.stringify(data.ledger));
        }
      })
      .catch(err => console.error("Ledger API error:", err));
  }, []);


  const openInvoicePopup = async (row) => {
  try {
    // SALE row (constant, from ledger)
    const saleRow = {
      date: row.date,
      debit: Number(row.debit),
      credit: 0,
      remarks: "Invoice generated",
    };

    // Fetch payments from backend
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
    alert("Failed to load invoice history");
    console.error(err);
  }
};


  const [invoicePopup, setInvoicePopup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromMonth, setFromMonth] = useState("All");
  const [toMonth, setToMonth] = useState("All");
  const [selectedClient, setSelectedClient] = useState("All");
  const [aiInsight, setAiInsight] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [draftEmail, setDraftEmail] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [newReceipt, setNewReceipt] = useState({ date: "", amount: "", remark: "" });
  const navigate = useNavigate();

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

  const generateAIInsight = async () => {
    setIsGeneratingInsight(true);
    const summary = filteredData.slice(0, 100).map(d => `${d.client}: Billed ₹${d.debit}, Paid ₹${d.credit}`).join(", ");
    if (!summary) { setAiInsight("No transactions found."); setIsGeneratingInsight(false); return; }
    const prompt = `Senior accounts analyst. Analyze: [${summary}]. Total Billed: ₹${stats.totalDebit}. Total Outstanding: ₹${stats.outstanding}. Identify top 3 clients needing follow up. STRICTLY 1-2 sentences.`;
    try { const result = await callGemini(prompt); setAiInsight(result); } 
    catch (e) { setAiInsight("Error connecting to AI."); } 
    finally { setIsGeneratingInsight(false); }
  };

  const draftReminderEmail = async (tone = "Professional") => {
    if (selectedClient === "All" || !clientSummaryStats) return;
    setDraftEmail({ loading: true, client: selectedClient, tone });
    const prompt = `Write a ${tone} reminder to ${selectedClient} from R.K Casting. Total Outstanding: ₹${clientSummaryStats.outstanding}.`;
    try { const result = await callGemini(prompt); setDraftEmail({ loading: false, client: selectedClient, tone, text: result, amount: clientSummaryStats.outstanding }); } 
    catch (e) { setDraftEmail(null); }
  };

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

  // const handleAddReceipt = () => {
  //   if (!newReceipt.date || !newReceipt.amount) return;
  //   const payment = { 
  //     date: newReceipt.date, 
  //     debit: 0, 
  //     credit: Number(newReceipt.amount), 
  //     remarks: newReceipt.remark 
  //   };
    
  //   setInvoicePopup(prev => ({
  //     ...prev,
  //     history: [...prev.history, payment],
  //   }));

  //   setLedgerData(prev => [
  //     ...prev,
  //     { ...payment, invoice: invoicePopup.invoice, client: invoicePopup.client }
  //   ]);

  //   setNewReceipt({ date: "", amount: "", remark: "" });
  // };

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

    // Reload payment history from DB
    const payments = await fetchPaymentHistory(invoicePopup.invoice);

    const paymentRows = payments.map(p => ({
      date: new Date(p.date).toISOString().split("T")[0],
      debit: 0,
      credit: Number(p.amount),
      remarks: p.remarks || "",
    }));

    // Keep SALE row fixed
    const saleRow = invoicePopup.history.find(r => r.debit > 0);

    setInvoicePopup(prev => ({
      ...prev,
      history: [saleRow, ...paymentRows],
    }));

    setNewReceipt({ date: "", amount: "", remark: "" });

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
};


  return (
    <>
      <Navbar className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200" />
      <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900 font-sans mt-12">
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
                className="bg-[#004f43cc] hover:bg-emerald-900 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                {isGeneratingInsight ? "Analyzing..." : "Identify Critical Client"}
              </button>
            )}
          </div>

          {aiInsight && (
            <div className="mb-8 bg-white border border-indigo-100 p-6 rounded-2xl relative shadow-xl">
               <button onClick={() => setAiInsight("")} className="absolute top-4 right-5 text-slate-400 text-2xl font-bold">&times;</button>
               <div className="flex gap-5 items-start">
                  <div className="p-3 bg-indigo-50 rounded-xl text-[#004f43cc] text-2xl border border-indigo-100">🔍</div>
                  <div>
                     <h3 className="font-bold text-[#004f43cc] text-[10px] uppercase tracking-widest mb-2">Critical Analysis</h3>
                     <p className="text-lg text-slate-700 font-medium">"{aiInsight}"</p>
                  </div>
               </div>
            </div>
          )}

          {/* ANALYTICS CARDS */}
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

          {/* LEDGER TABLE */}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((row, index) => {
                    const due = getRowDueAmount(row);
                    const status = getPaymentStatus(row);
                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="py-5 px-6 text-slate-500">{row.date}</td>
                        <td className="px-4">
                          <button onClick={() => openInvoicePopup(row)} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md font-mono text-xs border font-bold">
                            {row.invoice}
                          </button>
                        </td>
                        <td className="px-4 font-bold">{row.client}</td>
                        <td className="text-right px-4">{row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "—"}</td>
                        <td className="text-right px-4 text-emerald-600">{row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "—"}</td>
                        <td className="text-right px-4 font-bold">{due > 0 ? `₹${due.toLocaleString()}` : "—"}</td>
                        <td className="text-right px-6">
                          <button onClick={() => openInvoicePopup(row)}>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                              {status.label}
                            </span>
                          </button>
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
                    {clientSummaryStats.outstanding > 0 && (
                      <div className="flex gap-2">
                         <button onClick={() => draftReminderEmail("Gentle")} className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold border border-emerald-200">Gentle</button>
                         <button onClick={() => draftReminderEmail("Urgent")} className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold border border-red-200">Urgent</button>
                      </div>
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* EMAIL DRAFT MODAL */}
        {draftEmail && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">{draftEmail.tone} Draft</h2>
                  <button onClick={() => setDraftEmail(null)} className="text-3xl">&times;</button>
                </div>
                {draftEmail.loading ? <div className="py-10 text-center animate-pulse">Crafting message...</div> : (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border p-5 rounded-xl text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{draftEmail.text}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { navigator.clipboard.writeText(draftEmail.text) }} className="bg-indigo-600 text-white py-4 rounded-xl font-bold">Copy</button>
                      <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(draftEmail.text)}`, '_blank') }} className="bg-emerald-600 text-white py-4 rounded-xl font-bold">WhatsApp</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* INVOICE POPUP */}
        {invoicePopup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-50 px-8 py-6 border-b flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800">Invoice #{invoicePopup.invoice}</h2>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${calculateTotalDue() <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {calculateTotalDue() <= 0 ? 'Fully Paid' : 'Balance Pending'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1">Client: <span className="text-slate-900">{invoicePopup.client}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate("/Preview", { state: { ...invoicePopup } })} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-white">EDIT</button>
                  <button onClick={() => setInvoicePopup(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-100 transition-colors text-xl">&times;</button>
                </div>
              </div>

              <div className="p-8 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Sale</p>
                    <p className="text-lg font-bold">₹{calculateTotalSale().toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">Received</p>
                    <p className="text-lg font-bold text-emerald-700">₹{calculateTotalReceived().toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">Due</p>
                    <p className="text-lg font-bold text-indigo-700">₹{calculateTotalDue().toLocaleString()}</p>
                  </div>
                </div>

                <div className="border rounded-2xl overflow-hidden shadow-sm mb-8">
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
                      {invoicePopup.history.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-xs whitespace-nowrap">{row.date}</td>
                          <td className="px-4 py-4 text-right font-semibold">{row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "—"}</td>
                          <td className="px-4 py-4 text-right font-semibold text-emerald-600">{row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "—"}</td>
                          <td className="px-4 py-4 text-right font-bold text-slate-900">₹{calculateRunningBalance(i).toLocaleString()}</td>
                          <td className="px-4 py-4 text-xs text-slate-500 italic max-w-[150px] truncate" title={row.remarks}>{row.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">General Notes</label>
                    <textarea rows={6} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Overall invoice notes..." className="w-full px-4 py-3 rounded-2xl border text-sm outline-none bg-slate-50/50" />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border">
                    <h4 className="text-xs font-black uppercase text-slate-600 mb-4">Quick Payment Record</h4>
                    <div className="space-y-3">
                      <input type="date" value={newReceipt.date} onChange={(e) => setNewReceipt({ ...newReceipt, date: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm" />
                      <input type="number" placeholder="Amount (₹)" value={newReceipt.amount} onChange={(e) => setNewReceipt({ ...newReceipt, amount: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm" />
                      <input type="text" placeholder="Remark for this payment" value={newReceipt.remark} onChange={(e) => setNewReceipt({ ...newReceipt, remark: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm" />
                      <button onClick={handleAddReceipt} disabled={!newReceipt.amount || !newReceipt.date} className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold shadow-lg">Save Payment</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="mt-12 py-8 border-t text-center text-slate-500 text-sm">
        <p>© 2026 R.K Casting & Engineering Works. All rights reserved.</p>
      </footer>
    </>
  );
}