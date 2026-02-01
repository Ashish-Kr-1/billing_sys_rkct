import { useState, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle,
  FileText, Briefcase, BarChart2, PieChart as PieIcon,
  Activity, Users, Package, ArrowUpRight, ArrowDownRight,
  ChevronDown, Search, Bell, Filter, Calendar, MapPin, Target, Layers
} from "lucide-react";

// ============================================================
// DATABASE SCHEMA ANALYSIS → KPI DEFINITION
// ============================================================
// Tables: invoice_details, transactions, company, parties,
//         sell_summary, items, sales_register, state_codes_lookup
//
// KPI GROUP 1 — REVENUE & COLLECTIONS (from transactions: sell_amount, credit_amount)
//   KPI-01: Total Revenue (sell_amount across all transactions)
//   KPI-02: Total Credit Amount (credit_amount — what's actually collected)
//   KPI-03: Collection Rate = credit_amount / sell_amount × 100
//   KPI-04: Blocked / Pending Amount = sell_amount − credit_amount
//
// KPI GROUP 2 — GST HEALTH (transactions: taxable_amount, igst, cgst, sgst, gst_percentage)
//   KPI-05: Total GST Collected (igst + cgst + sgst)
//   KPI-06: Effective GST Rate distribution
//   KPI-07: IGST vs CGST+SGST split (interstate vs intrastate)
//
// KPI GROUP 3 — INVOICE PIPELINE (invoice_details + transactions)
//   KPI-08: Total Invoices raised
//   KPI-09: Invoice → Transaction conversion (invoices that have linked transactions)
//   KPI-10: Average Invoice Value
//
// KPI GROUP 4 — PARTY / CLIENT HEALTH (parties + transactions)
//   KPI-11: Top parties by revenue
//   KPI-12: Party concentration risk (top 5 vs rest)
//   KPI-13: New vs Returning party split
//
// KPI GROUP 5 — PRODUCT / ITEM PERFORMANCE (items + sell_summary)
//   KPI-14: Top selling items by units_sold
//   KPI-15: Item revenue contribution
//   KPI-16: Items per invoice (sell_summary lines per invoice_no)
//
// KPI GROUP 6 — GEOGRAPHIC PERFORMANCE (parties.supply_state_code + state_codes_lookup)
//   KPI-17: Revenue by state
//   KPI-18: Interstate vs Intrastate transaction split
//
// KPI GROUP 7 — SALES REGISTER & QUOTATIONS (sales_register)
//   KPI-19: Quotation → Bill conversion rate
//   KPI-20: Sales register revenue by bill_type
//
// KPI GROUP 8 — COMPANY PERFORMANCE (company + multi-company transactions)
//   KPI-21: Revenue per company entity
//   KPI-22: Company-wise collection efficiency
// ============================================================

// ============================================================
// FAKE DATASET (generated to match schema relationships)
// ============================================================

const COMPANIES = [
  { company_id: 1, name: "RK Casting Pvt Ltd", state: "Maharashtra" },
  { company_id: 2, name: "RK Casting Eng", state: "Gujarat" },
  { company_id: 3, name: "Global Bharat Mfg", state: "Tamil Nadu" }
];

const PARTIES = [
  { party_id: 1, party_name: "Tata Motors Ltd", state: "Maharashtra", type: "Customer" },
  { party_id: 2, party_name: "Mahindra & Mahindra", state: "Maharashtra", type: "Customer" },
  { party_id: 3, party_name: "Bajaj Auto Ltd", state: "Maharashtra", type: "Customer" },
  { party_id: 4, party_name: "Escorts Kubota", state: "Haryana", type: "Customer" },
  { party_id: 5, party_name: "Ashok Leyland", state: "Tamil Nadu", type: "Customer" },
  { party_id: 6, party_name: "Eicher Motors", state: "Rajasthan", type: "Customer" },
  { party_id: 7, party_name: "Hero MotoCorp", state: "Delhi", type: "Customer" },
  { party_id: 8, party_name: "TVS Motor Co", state: "Tamil Nadu", type: "Customer" },
  { party_id: 9, party_name: "Maruti Suzuki", state: "Haryana", type: "Customer" },
  { party_id: 10, party_name: "Force Motors", state: "Maharashtra", type: "Customer" },
  { party_id: 11, party_name: "Greaves Cotton", state: "Maharashtra", type: "Customer" },
  { party_id: 12, party_name: "Kirloskar Electric", state: "Karnataka", type: "Customer" }
];

const ITEMS = [
  { item_id: 1, item_name: "Casting Parts A-Series", hsn_code: "7325", unit: "Nos" },
  { item_id: 2, item_name: "Precision Valve Bodies", hsn_code: "7307", unit: "Nos" },
  { item_id: 3, item_name: "Engine Block Castings", hsn_code: "7321", unit: "Nos" },
  { item_id: 4, item_name: "Bracket Assembly Kit", hsn_code: "7326", unit: "Set" },
  { item_id: 5, item_name: "Flywheel Housing", hsn_code: "8714", unit: "Nos" },
  { item_id: 6, item_name: "Turbo Manifold Cast", hsn_code: "7324", unit: "Nos" },
  { item_id: 7, item_name: "Transmission Casing", hsn_code: "8708", unit: "Nos" },
  { item_id: 8, item_name: "Pump Impeller Set", hsn_code: "8481", unit: "Set" },
  { item_id: 9, item_name: "Structural Frame Weld", hsn_code: "7308", unit: "Nos" },
  { item_id: 10, item_name: "Precision Shaft Assy", hsn_code: "8462", unit: "Nos" }
];

// Helper: seeded random for reproducibility
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Generate 12 months of transaction data
function generateTransactions() {
  const rand = seededRandom(42);
  const transactions = [];
  let txId = 1;
  const monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];

  for (let month = 0; month < 12; month++) {
    const baseVolume = 30 + Math.floor(rand() * 25); // 30-55 transactions/month
    const seasonalMultiplier = [0.85, 0.9, 1.0, 1.05, 0.95, 0.88, 0.92, 1.0, 1.08, 1.15, 1.2, 1.25][month];
    const count = Math.floor(baseVolume * seasonalMultiplier);

    for (let i = 0; i < count; i++) {
      const companyIdx = rand() < 0.5 ? 0 : rand() < 0.7 ? 1 : 2;
      const partyIdx = Math.floor(rand() * PARTIES.length);
      const party = PARTIES[partyIdx];
      const company = COMPANIES[companyIdx];
      const isInterstate = party.state !== company.state;

      const baseAmount = 15000 + Math.floor(rand() * 185000); // 15K–200K
      const gstRate = rand() < 0.3 ? 5 : rand() < 0.6 ? 12 : rand() < 0.85 ? 18 : 28;
      const taxableAmount = baseAmount;
      const gstAmount = Math.round(taxableAmount * gstRate / 100);
      const sellAmount = taxableAmount + gstAmount;

      let igst = 0, cgst = 0, sgst = 0;
      if (isInterstate) { igst = gstAmount; }
      else { cgst = Math.round(gstAmount / 2); sgst = gstAmount - cgst; }

      // Collection: 72% collected on time, 15% pending, 13% blocked
      const collectionRoll = rand();
      let creditAmount = 0;
      let status = "Received";
      if (collectionRoll < 0.72) { creditAmount = sellAmount; status = "Received"; }
      else if (collectionRoll < 0.87) { creditAmount = 0; status = "Pending"; }
      else { creditAmount = 0; status = "Blocked"; }

      const day = 1 + Math.floor(rand() * monthDays[month]);
      const date = `2024-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      transactions.push({
        transaction_id: txId++,
        transaction_date: date,
        month: month,
        invoice_no: `INV-2024-${String(txId).padStart(4, '0')}`,
        transaction_type: rand() < 0.85 ? "Sale" : "Credit Note",
        party_id: party.party_id,
        party_name: party.party_name,
        party_state: party.state,
        company_id: company.company_id,
        company_name: company.name,
        sell_amount: sellAmount,
        credit_amount: creditAmount,
        taxable_amount: taxableAmount,
        igst_amount: igst,
        cgst_amount: cgst,
        sgst_amount: sgst,
        gst_percentage: gstRate,
        status: status,
        is_interstate: isInterstate
      });
    }
  }
  return transactions;
}

// Generate sell_summary (items per invoice)
function generateSellSummary(transactions) {
  const rand = seededRandom(99);
  const summary = [];
  let sumId = 1;
  transactions.forEach(tx => {
    const itemCount = 1 + Math.floor(rand() * 4); // 1-4 items per invoice
    const basePerItem = tx.taxable_amount / itemCount;
    for (let i = 0; i < itemCount; i++) {
      const itemIdx = Math.floor(rand() * ITEMS.length);
      const unitPrice = 500 + Math.floor(rand() * 4500);
      const unitsSold = Math.max(1, Math.round(basePerItem / unitPrice));
      summary.push({
        id: sumId++,
        invoice_no: tx.invoice_no,
        item_id: ITEMS[itemIdx].item_id,
        item_name: ITEMS[itemIdx].item_name,
        units_sold: unitsSold,
        unit_price: unitPrice,
        line_total: unitsSold * unitPrice
      });
    }
  });
  return summary;
}

// Generate sales_register (quotation tracking)
function generateSalesRegister() {
  const rand = seededRandom(77);
  const register = [];
  for (let i = 0; i < 180; i++) {
    const month = Math.floor(rand() * 12);
    const partyIdx = Math.floor(rand() * PARTIES.length);
    const companyIdx = rand() < 0.5 ? 0 : rand() < 0.7 ? 1 : 2;
    const baseAmt = 20000 + Math.floor(rand() * 180000);
    const gstRate = rand() < 0.4 ? 12 : 18;
    const gstAmt = Math.round(baseAmt * gstRate / 100);
    const converted = rand() < 0.65; // 65% conversion rate

    register.push({
      id: i + 1,
      month: month,
      quotation_no: `Q-2024-${String(i + 1).padStart(4, '0')}`,
      bxn_type: converted ? "Bill" : "Quotation",
      party_name: PARTIES[partyIdx].party_name,
      company_name: COMPANIES[companyIdx].name,
      sell_amount: baseAmt + gstAmt,
      taxable_amount: baseAmt,
      gst_percent: gstRate,
      converted: converted
    });
  }
  return register;
}

const RAW_TRANSACTIONS = generateTransactions();
const SELL_SUMMARY = generateSellSummary(RAW_TRANSACTIONS);
const SALES_REGISTER = generateSalesRegister();

// ============================================================
// DERIVED KPI COMPUTATIONS
// ============================================================
function computeKPIs() {
  // KPI-01–04: Revenue & Collections
  const totalRevenue = RAW_TRANSACTIONS.reduce((s, t) => s + t.sell_amount, 0);
  const totalCredited = RAW_TRANSACTIONS.reduce((s, t) => s + t.credit_amount, 0);
  const collectionRate = ((totalCredited / totalRevenue) * 100).toFixed(1);
  const pendingAmount = RAW_TRANSACTIONS.filter(t => t.status === "Pending").reduce((s, t) => s + t.sell_amount, 0);
  const blockedAmount = RAW_TRANSACTIONS.filter(t => t.status === "Blocked").reduce((s, t) => s + t.sell_amount, 0);

  // KPI-05–07: GST Health
  const totalGST = RAW_TRANSACTIONS.reduce((s, t) => s + t.igst_amount + t.cgst_amount + t.sgst_amount, 0);
  const totalIGST = RAW_TRANSACTIONS.reduce((s, t) => s + t.igst_amount, 0);
  const totalCGST_SGST = RAW_TRANSACTIONS.reduce((s, t) => s + t.cgst_amount + t.sgst_amount, 0);
  const gstRateDist = {};
  RAW_TRANSACTIONS.forEach(t => { gstRateDist[t.gst_percentage] = (gstRateDist[t.gst_percentage] || 0) + 1; });

  // KPI-08–10: Invoice Pipeline
  const totalInvoices = RAW_TRANSACTIONS.length;
  const avgInvoiceValue = totalRevenue / totalInvoices;

  // KPI-11–13: Party Health
  const partyRevenue = {};
  RAW_TRANSACTIONS.forEach(t => {
    partyRevenue[t.party_name] = (partyRevenue[t.party_name] || 0) + t.sell_amount;
  });
  const topParties = Object.entries(partyRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, val]) => ({ name, value: val, pct: ((val / totalRevenue) * 100).toFixed(1) }));

  // KPI-14–16: Item Performance
  const itemStats = {};
  SELL_SUMMARY.forEach(s => {
    if (!itemStats[s.item_name]) itemStats[s.item_name] = { units: 0, revenue: 0 };
    itemStats[s.item_name].units += s.units_sold;
    itemStats[s.item_name].revenue += s.line_total;
  });
  const topItems = Object.entries(itemStats)
    .sort((a, b) => b[1].units - a[1].units)
    .slice(0, 7)
    .map(([name, d]) => ({ name, units: d.units, revenue: d.revenue }));

  // KPI-17–18: Geographic
  const stateRevenue = {};
  RAW_TRANSACTIONS.forEach(t => {
    stateRevenue[t.party_state] = (stateRevenue[t.party_state] || 0) + t.sell_amount;
  });
  const stateData = Object.entries(stateRevenue)
    .sort((a, b) => b[1] - a[1])
    .map(([state, val]) => ({ state, value: val }));
  const interstateTotal = RAW_TRANSACTIONS.filter(t => t.is_interstate).reduce((s, t) => s + t.sell_amount, 0);
  const intrastate = totalRevenue - interstateTotal;

  // KPI-19–20: Sales Register
  const totalQuotations = SALES_REGISTER.length;
  const convertedQuotations = SALES_REGISTER.filter(r => r.converted).length;
  const quotationConversionRate = ((convertedQuotations / totalQuotations) * 100).toFixed(1);

  // KPI-21–22: Company Performance
  const companyStats = {};
  RAW_TRANSACTIONS.forEach(t => {
    if (!companyStats[t.company_name]) companyStats[t.company_name] = { revenue: 0, collected: 0, count: 0 };
    companyStats[t.company_name].revenue += t.sell_amount;
    companyStats[t.company_name].collected += t.credit_amount;
    companyStats[t.company_name].count += 1;
  });

  // Monthly trends
  const monthlyData = Array.from({ length: 12 }, (_, m) => {
    const monthTx = RAW_TRANSACTIONS.filter(t => t.month === m);
    const rev = monthTx.reduce((s, t) => s + t.sell_amount, 0);
    const col = monthTx.reduce((s, t) => s + t.credit_amount, 0);
    const gst = monthTx.reduce((s, t) => s + t.igst_amount + t.cgst_amount + t.sgst_amount, 0);
    const txCount = monthTx.length;
    return {
      month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m],
      revenue: Math.round(rev / 1000),
      collected: Math.round(col / 1000),
      gst: Math.round(gst / 1000),
      invoices: txCount
    };
  });

  // Monthly status breakdown
  const monthlyStatus = Array.from({ length: 12 }, (_, m) => {
    const monthTx = RAW_TRANSACTIONS.filter(t => t.month === m);
    return {
      month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m],
      Received: monthTx.filter(t => t.status === "Received").reduce((s, t) => s + t.sell_amount, 0) / 1000,
      Pending: monthTx.filter(t => t.status === "Pending").reduce((s, t) => s + t.sell_amount, 0) / 1000,
      Blocked: monthTx.filter(t => t.status === "Blocked").reduce((s, t) => s + t.sell_amount, 0) / 1000,
    };
  });

  // Company-wise product category breakdown (for radar / grouped)
  const companyProductBreakdown = COMPANIES.map(c => {
    const cTx = RAW_TRANSACTIONS.filter(t => t.company_id === c.company_id);
    const cSummary = [];
    cTx.forEach(tx => {
      SELL_SUMMARY.filter(s => s.invoice_no === tx.invoice_no).forEach(s => cSummary.push(s));
    });
    const cats = {};
    cSummary.forEach(s => { cats[s.item_name] = (cats[s.item_name] || 0) + s.line_total; });
    return { company: c.name.split(" ").slice(0, 2).join(" "), ...cats };
  });

  // GST rate distribution for pie
  const gstPieData = Object.entries(gstRateDist).map(([rate, count]) => ({
    name: `${rate}%`, value: count
  }));

  // Quotation monthly conversion
  const quotationMonthly = Array.from({ length: 12 }, (_, m) => {
    const mReg = SALES_REGISTER.filter(r => r.month === m);
    const conv = mReg.filter(r => r.converted).length;
    return {
      month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m],
      total: mReg.length,
      converted: conv,
      rate: mReg.length ? Math.round((conv / mReg.length) * 100) : 0
    };
  });

  // Recent transactions (last 8)
  const recentTransactions = [...RAW_TRANSACTIONS]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 8);

  return {
    totalRevenue, totalCredited, collectionRate, pendingAmount, blockedAmount,
    totalGST, totalIGST, totalCGST_SGST, gstRateDist,
    totalInvoices, avgInvoiceValue,
    topParties, topItems, stateData,
    interstateTotal, intrastate,
    totalQuotations, convertedQuotations, quotationConversionRate,
    companyStats, companyProductBreakdown,
    monthlyData, monthlyStatus, gstPieData, quotationMonthly, recentTransactions
  };
}

const KPIs = computeKPIs();

// ============================================================
// STYLE CONSTANTS
// ============================================================
const COLORS = {
  primary: "#0f2f3f",
  primaryLight: "#1a4d5c",
  teal: "#14b8a6",
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  sky: "#06b6d4"
};

const PIE_COLORS = [COLORS.emerald, COLORS.amber, COLORS.red, COLORS.blue];
const GST_COLORS = [COLORS.blue, COLORS.emerald, COLORS.amber, COLORS.purple];
const ITEM_GRADIENT = ["#0f2f3f","#1a4d5c","#1e6b7a","#2a8a9a","#3ba8b8","#52c5d3","#6fdde8"];

const fmt = (v) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, trendLabel }) => (
  <div className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
    style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0fdfc 100%)", border: `1px solid ${color}22` }}>
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-8"
      style={{ background: color, transform: "translate(40%, -40%)", opacity: 0.08 }} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>{title}</p>
        <h3 className="text-2xl font-black" style={{ color: COLORS.primary }}>{value}</h3>
        {subtitle && <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>{subtitle}</p>}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: trend >= 0 ? "#dcfce7" : "#fee2e2", color: trend >= 0 ? "#16a34a" : "#dc2626" }}>
              {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trend)}% {trendLabel || "vs last month"}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 rounded-xl" style={{ background: `${color}15` }}>
        <Icon size={22} color={color} />
      </div>
    </div>
  </div>
);

const SectionTitle = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-5">
    {Icon && <div className="p-1.5 rounded-lg" style={{ background: "#0f2f3f15" }}><Icon size={16} color={COLORS.primary} /></div>}
    <h2 className="text-[13px] font-black uppercase tracking-widest" style={{ color: COLORS.primary }}>{children}</h2>
  </div>
);

const CardShell = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-5 ${className}`}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label, prefix = "₹", suffix = "K" }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3" style={{ minWidth: 140 }}>
      <p className="text-[11px] font-bold mb-2" style={{ color: COLORS.primary }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
            <span style={{ color: "#64748b" }}>{p.name}</span>
          </span>
          <span className="font-bold" style={{ color: COLORS.primary }}>{prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// TAB NAVIGATION COMPONENT
// ============================================================
const tabs = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "gst", label: "GST Health", icon: Layers },
  { id: "parties", label: "Parties", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "geography", label: "Geography", icon: MapPin },
  { id: "quotations", label: "Quotations", icon: Target }
];

// ============================================================
// PAGE SECTIONS
// ============================================================

const OverviewTab = () => (
  <div>
    {/* Top KPI Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total Revenue" value={fmt(KPIs.totalRevenue)} icon={DollarSign} color={COLORS.emerald} trend={18} subtitle={`${KPIs.totalInvoices} invoices`} />
      <MetricCard title="Collected" value={fmt(KPIs.totalCredited)} icon={Activity} color={COLORS.blue} trend={12} subtitle={`${KPIs.collectionRate}% rate`} />
      <MetricCard title="Pending" value={fmt(KPIs.pendingAmount)} icon={Clock} color={COLORS.amber} trend={-4} trendLabel="vs last month" />
      <MetricCard title="Blocked" value={fmt(KPIs.blockedAmount)} icon={AlertCircle} color={COLORS.red} trend={2} trendLabel="vs last month" />
    </div>

    {/* Row 1: Monthly Revenue Trend + Payment Status Stacked */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
      <CardShell className="lg:col-span-2">
        <SectionTitle icon={Activity}>Monthly Revenue & Collections</SectionTitle>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={KPIs.monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" fill="url(#revGrad)" stroke={COLORS.emerald} strokeWidth={2.5} />
              <Line type="monotone" dataKey="collected" name="Collected" stroke={COLORS.blue} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.blue }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardShell>

      <CardShell>
        <SectionTitle icon={PieIcon}>Payment Status</SectionTitle>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[
                { name: "Received", value: KPIs.totalCredited },
                { name: "Pending", value: KPIs.pendingAmount },
                { name: "Blocked", value: KPIs.blockedAmount }
              ]} cx="50%" cy="50%" innerRadius={42} outerRadius={72} dataKey="value" stroke="none">
                <Cell fill={COLORS.emerald} />
                <Cell fill={COLORS.amber} />
                <Cell fill={COLORS.red} />
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-2">
          {[
            { label: "Received", color: COLORS.emerald, val: KPIs.totalCredited },
            { label: "Pending", color: COLORS.amber, val: KPIs.pendingAmount },
            { label: "Blocked", color: COLORS.red, val: KPIs.blockedAmount }
          ].map(d => (
            <div key={d.label} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span style={{ color: "#64748b" }}>{d.label}</span>
              </span>
              <span className="font-bold" style={{ color: COLORS.primary }}>{fmt(d.val)}</span>
            </div>
          ))}
        </div>
      </CardShell>
    </div>

    {/* Row 2: Monthly Status Stacked + Company Performance */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
      <CardShell className="lg:col-span-2">
        <SectionTitle icon={BarChart2}>Monthly Collection Breakdown</SectionTitle>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={KPIs.monthlyStatus}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
              <Bar dataKey="Received" stackId="a" fill={COLORS.emerald} radius={[0,0,0,0]} />
              <Bar dataKey="Pending" stackId="a" fill={COLORS.amber} />
              <Bar dataKey="Blocked" stackId="a" fill={COLORS.red} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardShell>

      <CardShell>
        <SectionTitle icon={Briefcase}>Company Efficiency</SectionTitle>
        <div className="space-y-4 mt-2">
          {Object.entries(KPIs.companyStats).map(([name, d]) => {
            const eff = ((d.collected / d.revenue) * 100).toFixed(0);
            return (
              <div key={name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold" style={{ color: COLORS.primary }}>{name.split(" ").slice(0,3).join(" ")}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: eff >= 70 ? "#dcfce7" : "#fef3c7", color: eff >= 70 ? "#16a34a" : "#d97706" }}>
                    {eff}% collected
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${eff}%`, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.teal})` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px]" style={{ color: "#94a3b8" }}>{d.count} invoices</span>
                  <span className="text-[9px] font-bold" style={{ color: "#64748b" }}>{fmt(d.revenue)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardShell>
    </div>

    {/* Recent Transactions Table */}
    <CardShell>
      <SectionTitle icon={FileText}>Recent Transactions</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Invoice", "Date", "Party", "Company", "Amount", "GST %", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KPIs.recentTransactions.map((t, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-[11px] font-bold" style={{ color: COLORS.primary }}>{t.invoice_no}</td>
                <td className="px-4 py-3 text-[11px]" style={{ color: "#64748b" }}>{t.transaction_date}</td>
                <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: "#374151" }}>{t.party_name.split(" ").slice(0,2).join(" ")}</td>
                <td className="px-4 py-3 text-[11px]" style={{ color: "#64748b" }}>{t.company_name.split(" ").slice(0,2).join(" ")}</td>
                <td className="px-4 py-3 text-[11px] font-bold" style={{ color: COLORS.primary }}>{fmt(t.sell_amount)}</td>
                <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: COLORS.blue }}>{t.gst_percentage}%</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                    style={{
                      background: t.status === "Received" ? "#dcfce7" : t.status === "Pending" ? "#fef3c7" : "#fee2e2",
                      color: t.status === "Received" ? "#16a34a" : t.status === "Pending" ? "#d97706" : "#dc2626"
                    }}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardShell>
  </div>
);

const GSTTab = () => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total GST" value={fmt(KPIs.totalGST)} icon={Layers} color={COLORS.purple} subtitle="All components" />
      <MetricCard title="IGST (Interstate)" value={fmt(KPIs.totalIGST)} icon={MapPin} color={COLORS.sky} subtitle={`${((KPIs.totalIGST/KPIs.totalGST)*100).toFixed(0)}% of total GST`} />
      <MetricCard title="CGST + SGST" value={fmt(KPIs.totalCGST_SGST)} icon={Layers} color={COLORS.blue} subtitle={`${((KPIs.totalCGST_SGST/KPIs.totalGST)*100).toFixed(0)}% of total GST`} />
      <MetricCard title="Avg GST/Invoice" value={fmt(KPIs.totalGST / KPIs.totalInvoices)} icon={DollarSign} color={COLORS.emerald} subtitle="Per transaction" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
      <CardShell>
        <SectionTitle icon={PieIcon}>GST Rate Distribution</SectionTitle>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={KPIs.gstPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={68} dataKey="value" stroke="none">
                {KPIs.gstPieData.map((_, i) => <Cell key={i} fill={GST_COLORS[i % GST_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v} invoices`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-1">
          {KPIs.gstPieData.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: GST_COLORS[i % GST_COLORS.length] }} />
                <span style={{ color: "#64748b" }}>Rate {d.name}</span>
              </span>
              <span className="font-bold" style={{ color: COLORS.primary }}>{d.value} invoices</span>
            </div>
          ))}
        </div>
      </CardShell>

      <CardShell className="lg:col-span-2">
        <SectionTitle icon={BarChart2}>Monthly GST Collection Trend</SectionTitle>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={KPIs.monthlyData}>
              <defs>
                <linearGradient id="gstGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.purple} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gst" name="GST" fill="url(#gstGrad)" stroke={COLORS.purple} strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardShell>
    </div>

    <CardShell>
      <SectionTitle icon={BarChart2}>IGST vs CGST+SGST Split by Month</SectionTitle>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={Array.from({ length: 12 }, (_, m) => {
            const mTx = RAW_TRANSACTIONS.filter(t => t.month === m);
            return {
              month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m],
              IGST: Math.round(mTx.reduce((s, t) => s + t.igst_amount, 0) / 1000),
              "CGST+SGST": Math.round(mTx.reduce((s, t) => s + t.cgst_amount + t.sgst_amount, 0) / 1000)
            };
          })}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
            <Bar dataKey="IGST" fill={COLORS.sky} radius={[4,4,0,0]} />
            <Bar dataKey="CGST+SGST" fill={COLORS.purple} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  </div>
);

const PartiesTab = () => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total Parties" value={PARTIES.length} icon={Users} color={COLORS.blue} subtitle="Active customers" />
      <MetricCard title="Top Party Revenue" value={fmt(KPIs.topParties[0]?.value || 0)} icon={Users} color={COLORS.emerald} subtitle={KPIs.topParties[0]?.name || ""} />
      <MetricCard title="Top 3 Concentration" value={`${(KPIs.topParties.slice(0,3).reduce((s,p) => s + parseFloat(p.pct), 0)).toFixed(0)}%`} icon={Target} color={COLORS.amber} subtitle="Revenue share" />
      <MetricCard title="Avg Revenue/Party" value={fmt(KPIs.totalRevenue / PARTIES.length)} icon={DollarSign} color={COLORS.purple} subtitle="Per active party" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      <CardShell>
        <SectionTitle icon={Users}>Top Parties by Revenue</SectionTitle>
        <div className="space-y-3 mt-1">
          {KPIs.topParties.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold" style={{ color: COLORS.primary }}>
                  <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-[9px] font-black mr-2"
                    style={{ background: i < 3 ? COLORS.primary : "#e2e8f0", color: i < 3 ? "#fff" : "#64748b" }}>
                    {i + 1}
                  </span>
                  {p.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f0fdfc", color: COLORS.teal }}>{p.pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(p.value / KPIs.topParties[0].value) * 100}%`, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.blue})` }} />
              </div>
              <span className="text-[9px] font-bold" style={{ color: "#64748b" }}>{fmt(p.value)}</span>
            </div>
          ))}
        </div>
      </CardShell>

      <CardShell>
        <SectionTitle icon={PieIcon}>Party Revenue Concentration</SectionTitle>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[
                ...KPIs.topParties.slice(0, 3).map(p => ({ name: p.name.split(" ").slice(0,2).join(" "), value: p.value })),
                { name: "Others", value: KPIs.totalRevenue - KPIs.topParties.slice(0, 3).reduce((s, p) => s + p.value, 0) }
              ]} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}>
                <Cell fill={COLORS.primary} />
                <Cell fill={COLORS.blue} />
                <Cell fill={COLORS.teal} />
                <Cell fill="#e2e8f0" />
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardShell>
    </div>
  </div>
);

const ProductsTab = () => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total Items" value={ITEMS.length} icon={Package} color={COLORS.blue} subtitle="Active products" />
      <MetricCard title="Top Item Units" value={KPIs.topItems[0]?.units.toLocaleString() || 0} icon={Package} color={COLORS.emerald} subtitle={KPIs.topItems[0]?.name.split(" ").slice(0,2).join(" ") || ""} />
      <MetricCard title="Total Units Sold" value={SELL_SUMMARY.reduce((s, d) => s + d.units_sold, 0).toLocaleString()} icon={Package} color={COLORS.amber} subtitle="All items combined" />
      <MetricCard title="Avg Items/Invoice" value={((SELL_SUMMARY.length / RAW_TRANSACTIONS.length)).toFixed(1)} icon={FileText} color={COLORS.purple} subtitle="Line items per invoice" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      <CardShell>
        <SectionTitle icon={Package}>Top Items by Units Sold</SectionTitle>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={KPIs.topItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={105} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#374151" }} />
              <Tooltip formatter={(v) => [v.toLocaleString(), "Units"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="units" radius={[0,4,4,0]} fill="url(#itemGrad)">
                {KPIs.topItems.map((_, i) => <Cell key={i} fill={ITEM_GRADIENT[i % ITEM_GRADIENT.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardShell>

      <CardShell>
        <SectionTitle icon={DollarSign}>Item Revenue Contribution</SectionTitle>
        <div className="space-y-3 mt-1">
          {KPIs.topItems.slice(0, 6).map((item, i) => {
            const totalItemRev = KPIs.topItems.reduce((s, it) => s + it.revenue, 0);
            const pct = ((item.revenue / totalItemRev) * 100).toFixed(0);
            return (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold" style={{ color: COLORS.primary }}>{item.name.length > 26 ? item.name.slice(0,24)+"…" : item.name}</span>
                  <span className="text-[10px] font-bold" style={{ color: "#64748b" }}>{fmt(item.revenue)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: "#f1f5f9" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: ITEM_GRADIENT[i % ITEM_GRADIENT.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardShell>
    </div>
  </div>
);

const GeographyTab = () => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="States Served" value={KPIs.stateData.length} icon={MapPin} color={COLORS.blue} subtitle="Geographic spread" />
      <MetricCard title="Top State" value={KPIs.stateData[0]?.state || ""} icon={MapPin} color={COLORS.emerald} subtitle={fmt(KPIs.stateData[0]?.value || 0)} />
      <MetricCard title="Interstate Rev" value={fmt(KPIs.interstateTotal)} icon={MapPin} color={COLORS.amber} subtitle={`${((KPIs.interstateTotal/KPIs.totalRevenue)*100).toFixed(0)}% of total`} />
      <MetricCard title="Intrastate Rev" value={fmt(KPIs.intrastate)} icon={MapPin} color={COLORS.purple} subtitle={`${((KPIs.intrastate/KPIs.totalRevenue)*100).toFixed(0)}% of total`} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      <CardShell>
        <SectionTitle icon={BarChart2}>Revenue by State</SectionTitle>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={KPIs.stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <YAxis dataKey="state" type="category" width={90} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [fmt(v), "Revenue"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="value" radius={[0,4,4,0]}>
                {KPIs.stateData.map((_, i) => <Cell key={i} fill={ITEM_GRADIENT[i % ITEM_GRADIENT.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardShell>

      <CardShell>
        <SectionTitle icon={PieIcon}>Interstate vs Intrastate</SectionTitle>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[
                { name: "Interstate", value: KPIs.interstateTotal },
                { name: "Intrastate", value: KPIs.intrastate }
              ]} cx="50%" cy="50%" innerRadius={42} outerRadius={72} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                <Cell fill={COLORS.sky} />
                <Cell fill={COLORS.teal} />
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.sky }} /><span style={{ color: "#64748b" }}>Interstate (IGST)</span></span>
            <span className="font-bold" style={{ color: COLORS.primary }}>{fmt(KPIs.interstateTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.teal }} /><span style={{ color: "#64748b" }}>Intrastate (CGST+SGST)</span></span>
            <span className="font-bold" style={{ color: COLORS.primary }}>{fmt(KPIs.intrastate)}</span>
          </div>
        </div>
      </CardShell>
    </div>
  </div>
);

const QuotationsTab = () => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total Quotations" value={KPIs.totalQuotations} icon={FileText} color={COLORS.blue} subtitle="This year" />
      <MetricCard title="Converted to Bills" value={KPIs.convertedQuotations} icon={Activity} color={COLORS.emerald} subtitle="Successfully closed" />
      <MetricCard title="Conversion Rate" value={`${KPIs.quotationConversionRate}%`} icon={Target} color={COLORS.amber} subtitle="Quotation → Bill" trend={5} />
      <MetricCard title="Lost Quotations" value={KPIs.totalQuotations - KPIs.convertedQuotations} icon={AlertCircle} color={COLORS.red} subtitle="Not converted" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      <CardShell>
        <SectionTitle icon={BarChart2}>Monthly Quotation Pipeline</SectionTitle>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={KPIs.quotationMonthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
              <Bar dataKey="total" name="Total Quotations" fill="#e2e8f0" radius={[4,4,0,0]} />
              <Bar dataKey="converted" name="Converted" fill={COLORS.emerald} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardShell>

      <CardShell>
        <SectionTitle icon={Activity}>Monthly Conversion Rate</SectionTitle>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={KPIs.quotationMonthly}>
              <defs>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, "Conversion Rate"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="rate" name="Conversion %" fill="url(#convGrad)" stroke={COLORS.amber} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.amber }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardShell>
    </div>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabContent = {
    overview: <OverviewTab />,
    gst: <GSTTab />,
    parties: <PartiesTab />,
    products: <ProductsTab />,
    geography: <GeographyTab />,
    quotations: <QuotationsTab />
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f5", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* TOP HEADER */}
      <header style={{ background: "linear-gradient(135deg, #0f2f3f 0%, #1a4d5c 50%, #1e6b7a 100%)", color: "#fff" }}>
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
              <BarChart2 size={20} color="#14b8a6" />
            </div>
            <div>
              <h1 className="text-[15px] font-black tracking-tight">Invoice Analytics</h1>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>RK Casting Group · FY 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Briefcase size={13} color="#14b8a6" />
              <span className="text-[11px] font-semibold">All Companies</span>
              <ChevronDown size={12} color="rgba(255,255,255,0.5)" />
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Bell size={15} color="rgba(255,255,255,0.7)" />
            </div>
          </div>
        </div>

        {/* TAB NAV */}
        <div className="max-w-7xl mx-auto px-5 flex gap-1 pb-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-[11px] font-bold transition-all duration-200"
                style={{
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  color: isActive ? "#14b8a6" : "rgba(255,255,255,0.45)",
                  borderBottom: isActive ? "2px solid #14b8a6" : "2px solid transparent"
                }}>
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-5 py-6">
        {tabContent[activeTab]}
      </main>

      {/* FOOTER SUMMARY BAR */}
      <footer className="max-w-7xl mx-auto px-5 pb-6">
        <div className="rounded-2xl p-5 flex flex-wrap justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #0f2f3f 0%, #1a4d5c 100%)", color: "#fff" }}>
          {[
            { label: "Total Revenue", val: fmt(KPIs.totalRevenue), sub: `${KPIs.totalInvoices} invoices`, trend: "+18%" },
            { label: "Collection Rate", val: `${KPIs.collectionRate}%`, sub: "Efficiency", trend: "+5%" },
            { label: "Avg Invoice", val: fmt(KPIs.avgInvoiceValue), sub: "Per transaction", trend: "-2%" },
            { label: "Conversion Rate", val: `${KPIs.quotationConversionRate}%`, sub: "Quotation → Bill", trend: "+8%" }
          ].map((s, i) => (
            <div key={i} className="flex-1" style={{ minWidth: 120 }}>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              <h3 className="text-[20px] font-black mt-0.5">{s.val}</h3>
              <p className="text-[10px] mt-0.5 flex items-center gap-1.5">
                <span style={{ color: s.trend.startsWith("+") ? "#34d399" : "#f87171" }}>{s.trend}</span>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>{s.sub}</span>
              </p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}