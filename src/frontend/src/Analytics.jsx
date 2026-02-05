import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ComposedChart
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle,
  FileText, Briefcase, BarChart2, PieChart as PieIcon,
  Activity, Users, Package, ArrowUpRight, ArrowDownRight,
  ChevronDown, Bell, MapPin, Target, Layers, RefreshCw
} from "lucide-react";
import { api, handleApiResponse } from "./config/apiClient.js";
import { useCompany } from "./context/CompanyContext.jsx";

// ============================================================
// DERIVED KPI COMPUTATIONS - FIXED FOR ACTUAL DB SCHEMA
// ============================================================
// GST State Code Mapping
const STATE_CODES = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar",
  "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar",
  "36": "Telangana", "37": "Andhra Pradesh (New)", "38": "Ladakh"
};

function computeKPIs(data = null, monthRange = { start: 0, end: 11 }) {
  // Use provided data or return empty
  const RAW_TRANSACTIONS = data?.transactions || [];
  const SELL_SUMMARY = data?.sellSummary || [];
  const PARTIES = data?.parties || [];
  const ITEMS = data?.items || [];

  // Return empty KPIs if no data
  if (!data || !RAW_TRANSACTIONS.length) {
    return {
      totalRevenue: 0, totalCredited: 0, collectionRate: "0.0", pendingAmount: 0, blockedAmount: 0,
      totalGST: 0, totalIGST: 0, totalCGST_SGST: 0, gstRateDist: {},
      totalInvoices: 0, avgInvoiceValue: 0,
      topParties: [], topItems: [], stateData: [],
      interstateTotal: 0, intrastate: 0,
      totalQuotations: 0, convertedQuotations: 0, quotationConversionRate: "0.0",
      companyStats: {}, clientPerformance: [], companyProductBreakdown: [], companyWiseTopItems: [], companyWiseItemKeys: [],
      monthlyData: [], monthlyStatus: [], gstPieData: [], quotationMonthly: [], recentTransactions: []
    };
  }

  // Create lookup maps for efficient joins
  const partiesMap = {};
  PARTIES.forEach(p => { partiesMap[p.party_id] = p; });

  const itemsMap = {};
  ITEMS.forEach(i => { itemsMap[i.item_id] = i; });

  // Enrich transactions with derived fields
  const enrichedTransactions = RAW_TRANSACTIONS.map(t => {
    const party = partiesMap[t.party_id] || {};
    const txDate = new Date(t.transaction_date);
    const month = txDate.getMonth(); // 0-11

    // Determine status from credit_amount
    const creditAmt = parseFloat(t.credit_amount || 0);
    const sellAmt = parseFloat(t.sell_amount || 0);
    let status = "Pending";
    if (creditAmt >= sellAmt * 0.95) status = "Received"; // Allow 5% tolerance
    else if (creditAmt === 0) status = "Pending";

    return {
      ...t,
      party_name: party.party_name || "Unknown Party",
      party_state: party.supply_state_code || "Unknown",
      month: month,
      status: status,
      sell_amount: sellAmt,
      credit_amount: creditAmt,
      taxable_amount: parseFloat(t.taxable_amount || 0),
      igst_amount: parseFloat(t.igst_amount || 0),
      cgst_amount: parseFloat(t.cgst_amount || 0),
      sgst_amount: parseFloat(t.sgst_amount || 0),
      gst_percentage: parseFloat(t.gst_percentage || 0)
    };
  });

  // Enrich sell_summary with item details
  const enrichedSellSummary = SELL_SUMMARY.map(s => {
    const item = itemsMap[s.item_id] || {};
    const unitsSold = parseFloat(s.units_sold || 0);
    const unitPrice = parseFloat(item.rate || 0);
    const lineTotal = unitsSold * unitPrice;

    return {
      ...s,
      item_name: item.item_name || "Unknown Item",
      unit_price: unitPrice,
      line_total: lineTotal,
      units_sold: unitsSold
    };
  });

  // KPI-01–04: Revenue & Collections
  const totalRevenue = enrichedTransactions.reduce((s, t) => s + t.sell_amount, 0);
  const totalCredited = enrichedTransactions.reduce((s, t) => s + t.credit_amount, 0);
  const collectionRate = totalRevenue > 0 ? ((totalCredited / totalRevenue) * 100).toFixed(1) : "0.0";

  // Fixed Pending Calculation: Group by Invoice to find distinct outstanding
  const invoiceAggregation = {};
  enrichedTransactions.forEach(t => {
    if (!invoiceAggregation[t.invoice_no]) {
      invoiceAggregation[t.invoice_no] = { sell: 0, credit: 0 };
    }
    invoiceAggregation[t.invoice_no].sell += t.sell_amount;
    invoiceAggregation[t.invoice_no].credit += t.credit_amount;
  });

  let calculatedPending = 0;
  let realInvoiceCount = 0;

  Object.values(invoiceAggregation).forEach(inv => {
    // If payment > sell (advance), pending is 0 for that specific invoice context (Advance is tracked separately in Client Perf)
    const due = Math.max(0, inv.sell - inv.credit);
    calculatedPending += due;

    // Count as invoice only if it has sales value (excludes standalone receipts)
    if (inv.sell > 0) realInvoiceCount++;
  });

  const pendingAmount = calculatedPending;
  const blockedAmount = 0;

  // KPI-05–07: GST Health
  const totalGST = enrichedTransactions.reduce((s, t) => s + t.igst_amount + t.cgst_amount + t.sgst_amount, 0);
  const totalIGST = enrichedTransactions.reduce((s, t) => s + t.igst_amount, 0);
  const totalCGST_SGST = enrichedTransactions.reduce((s, t) => s + t.cgst_amount + t.sgst_amount, 0);
  const gstRateDist = {};
  enrichedTransactions.forEach(t => {
    const rate = t.gst_percentage;
    gstRateDist[rate] = (gstRateDist[rate] || 0) + 1;
  });

  // KPI-08–10: Invoice Pipeline
  const totalInvoices = realInvoiceCount;
  const avgInvoiceValue = totalRevenue / (totalInvoices || 1);

  // KPI-11–13: Party Health & Performance
  const partyStatsDetails = {};
  enrichedTransactions.forEach(t => {
    const name = t.party_name;
    if (!partyStatsDetails[name]) {
      partyStatsDetails[name] = { revenue: 0, collected: 0, count: 0 };
    }
    partyStatsDetails[name].revenue += t.sell_amount;
    partyStatsDetails[name].collected += t.credit_amount;
    partyStatsDetails[name].count += 1;
  });

  const clientPerformance = Object.entries(partyStatsDetails)
    .map(([name, d]) => ({
      name,
      ...d,
      pending: d.revenue - d.collected,
      efficiency: d.revenue > 0 ? (d.collected / d.revenue) * 100 : (d.collected > 0 ? 100 : 0)
    }))
    .sort((a, b) => {
      // Sort by Efficiency Descending (Best First), then by Revenue
      if (a.efficiency !== b.efficiency) return b.efficiency - a.efficiency;
      return b.revenue - a.revenue;
    });

  const topParties = [...clientPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6).map(p => ({
      name: p.name,
      value: p.revenue,
      pct: totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : "0.0"
    }));

  // KPI-14–16: Item Performance
  const itemStats = {};
  enrichedSellSummary.forEach(s => {
    if (!itemStats[s.item_name]) itemStats[s.item_name] = { units: 0, revenue: 0 };
    itemStats[s.item_name].units += s.units_sold;
    itemStats[s.item_name].revenue += s.line_total;
  });
  const topItems = Object.entries(itemStats)
    .sort((a, b) => b[1].units - a[1].units)
    .slice(0, 7)
    .map(([name, d]) => ({ name, units: d.units, revenue: d.revenue }));

  // KPI-17–18: Geographic (simplified - would need state_codes_lookup join)
  const stateRevenue = {};
  enrichedTransactions.forEach(t => {
    const rawState = t.party_state ? String(t.party_state).padStart(2, '0') : "Unknown";
    const state = STATE_CODES[rawState] || t.party_state || "Unknown";
    stateRevenue[state] = (stateRevenue[state] || 0) + t.sell_amount;
  });
  const stateData = Object.entries(stateRevenue)
    .sort((a, b) => b[1] - a[1])
    .map(([state, val]) => ({ state, value: val }));

  // IGST indicates interstate
  const interstateTotal = enrichedTransactions.filter(t => t.igst_amount > 0).reduce((s, t) => s + t.sell_amount, 0);
  const intrastate = totalRevenue - interstateTotal;

  // KPI-19–20: Sales Register (not available in current data)
  const totalQuotations = 0;
  const convertedQuotations = 0;
  const quotationConversionRate = "0.0";

  // KPI-21–22: Company Performance (single company in current context)
  const companyStats = {};
  if (enrichedTransactions.length > 0) {
    const companyName = data?.companyName || "Current Company";
    companyStats[companyName] = {
      revenue: totalRevenue,
      collected: totalCredited,
      count: enrichedTransactions.length
    };
  }

  // Monthly trends
  // Monthly trends (Dynamic based on selected range)
  const rangeStart = monthRange.start;
  const rangeEnd = monthRange.end;
  const monthCount = Math.max(0, rangeEnd - rangeStart + 1);
  const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyData = Array.from({ length: monthCount }, (_, i) => {
    const m = rangeStart + i;
    const monthTx = enrichedTransactions.filter(t => t.month === m);
    const rev = monthTx.reduce((s, t) => s + t.sell_amount, 0);
    const col = monthTx.reduce((s, t) => s + t.credit_amount, 0);
    const gst = monthTx.reduce((s, t) => s + t.igst_amount + t.cgst_amount + t.sgst_amount, 0);
    const txCount = monthTx.length;
    return {
      month: ALL_MONTHS[m],
      revenue: Math.round(rev / 1000),
      collected: Math.round(col / 1000),
      gst: Math.round(gst / 1000),
      invoices: txCount
    };
  });

  // Monthly status breakdown
  // Monthly status breakdown
  const monthlyStatus = Array.from({ length: monthCount }, (_, i) => {
    const m = rangeStart + i;
    const monthTx = enrichedTransactions.filter(t => t.month === m);

    const collectedPortion = monthTx.reduce((s, t) => s + Math.min(t.sell_amount, t.credit_amount), 0);
    const pendingPortion = monthTx.reduce((s, t) => s + Math.max(0, t.sell_amount - t.credit_amount), 0);

    return {
      month: ALL_MONTHS[m],
      Received: collectedPortion / 1000,
      Pending: pendingPortion / 1000,
      Blocked: 0
    };
  });

  // Company-wise top items (simplified for single company - empty for now)
  const companyWiseTopItems = [];
  const companyWiseItemKeys = [];

  // GST rate distribution for pie
  const gstPieData = Object.entries(gstRateDist).map(([rate, count]) => ({
    name: `${rate}%`, value: count
  }));

  // Quotation monthly conversion (not available)
  // Quotation monthly conversion
  const quotationMonthly = Array.from({ length: monthCount }, (_, i) => {
    const m = rangeStart + i;
    return {
      month: ALL_MONTHS[m],
      total: 0,
      converted: 0,
      rate: 0
    };
  });

  // Recent transactions (last 8)
  const recentTransactions = [...enrichedTransactions]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 8)
    .map(t => ({
      ...t,
      company_name: data?.companyName || "Current Company"
    }));

  return {
    totalRevenue, totalCredited, collectionRate, pendingAmount, blockedAmount,
    totalGST, totalIGST, totalCGST_SGST, gstRateDist,
    totalInvoices, avgInvoiceValue,
    topParties, topItems, stateData,
    interstateTotal, intrastate,
    totalQuotations, convertedQuotations, quotationConversionRate,
    companyStats, clientPerformance, companyProductBreakdown: [], companyWiseTopItems, companyWiseItemKeys,
    monthlyData, monthlyStatus, gstPieData, quotationMonthly, recentTransactions
  };
}

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
const ITEM_GRADIENT = ["#0f2f3f", "#1a4d5c", "#1e6b7a", "#2a8a9a", "#3ba8b8", "#52c5d3", "#6fdde8"];

const fmt = (v) => {
  if (!v || isNaN(v)) return "₹0";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
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
  { id: "quotations", label: "Quotations", icon: FileText }
];

// ============================================================
// PAGE SECTIONS
// ============================================================

const OverviewTab = ({ KPIs, comparisonData, monthRange }) => {
  // Prepare Comparison Chart Data
  const { chartData, companyNames } = useMemo(() => {
    if (!comparisonData || !comparisonData.length) return { chartData: [], companyNames: [] };

    if (!comparisonData || !comparisonData.length) return { chartData: [], companyNames: [] };
    const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = monthRange ? ALL_MONTHS.slice(monthRange.start, monthRange.end + 1) : ALL_MONTHS;

    const data = months.map(m => ({ month: m }));
    const mapCompanies = comparisonData.map(c => c.name);

    comparisonData.forEach(comp => {
      const compName = comp.name;
      (comp.transactions || []).forEach(t => {
        // Robust Date Parsing
        let d = new Date(t.transaction_date);
        if (isNaN(d.getTime())) return;

        const mIndex = d.getMonth(); // 0-11
        // Skip if outside range (though filtered upstream, double safety)
        if (monthRange && (mIndex < monthRange.start || mIndex > monthRange.end)) return;

        // Calculate relative index for the data array
        const dataIndex = monthRange ? mIndex - monthRange.start : mIndex;

        if (dataIndex < 0 || dataIndex >= data.length) return;

        const val = parseFloat(t.credit_amount || 0);

        if (!data[dataIndex][compName]) data[dataIndex][compName] = 0;
        data[dataIndex][compName] += val;
      });
    });

    // Normalize to K
    data.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'month' && typeof d[k] === 'number') d[k] = Math.round(d[k] / 1000);
      });
    });

    return { chartData: data, companyNames: mapCompanies };
  }, [comparisonData, monthRange]);

  const COMP_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#ec4899"];

  return (
    <div>
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Total Revenue" value={fmt(KPIs.totalRevenue)} icon={DollarSign} color={COLORS.emerald} subtitle={`${KPIs.totalInvoices} invoices`} />
        <MetricCard title="Collected" value={fmt(KPIs.totalCredited)} icon={Activity} color={COLORS.blue} subtitle={`${KPIs.collectionRate}% rate`} />
        <MetricCard title="Pending" value={fmt(KPIs.pendingAmount)} icon={Clock} color={COLORS.amber} trendLabel="Payment pending" />
        <MetricCard title="Avg Invoice" value={fmt(KPIs.avgInvoiceValue)} icon={FileText} color={COLORS.purple} subtitle="Per transaction" />
      </div>

      {/* Row 1: Monthly Revenue Trend + Payment Status */}
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
                  { name: "Pending", value: KPIs.pendingAmount }
                ]} cx="50%" cy="50%" innerRadius={42} outerRadius={72} dataKey="value" stroke="none">
                  <Cell fill={COLORS.emerald} />
                  <Cell fill={COLORS.amber} />
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {[
              { label: "Received", color: COLORS.emerald, val: KPIs.totalCredited },
              { label: "Pending", color: COLORS.amber, val: KPIs.pendingAmount }
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

      {/* Row 2: Monthly Comparison + Company Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <CardShell className="lg:col-span-2">
          <SectionTitle icon={BarChart2}>Monthly Collection Comparison</SectionTitle>
          <div style={{ height: 240 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
                  {companyNames.map((name, i) => (
                    <Bar key={name} dataKey={name} fill={COMP_COLORS[i % COMP_COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold">No comparison data available</p>
              </div>
            )}
          </div>
        </CardShell>

        <CardShell>
          <SectionTitle icon={Briefcase}>Company Efficiency</SectionTitle>
          <div className="space-y-4 mt-2">
            {comparisonData.map((comp) => {
              const txs = comp.transactions || [];
              const rev = txs.reduce((s, t) => s + (parseFloat(t.sell_amount) || 0), 0);
              const col = txs.reduce((s, t) => s + (parseFloat(t.credit_amount) || 0), 0);
              const eff = rev > 0 ? ((col / rev) * 100).toFixed(0) : "0";
              const effNum = parseFloat(eff);
              const name = comp.name;

              return (
                <div key={name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold" style={{ color: COLORS.primary }}>{name.split(" ").slice(0, 3).join(" ")}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: effNum >= 70 ? "#dcfce7" : "#fef3c7", color: effNum >= 70 ? "#16a34a" : "#d97706" }}>
                      {eff}% collected
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(effNum, 100)}%`, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.teal})` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color: "#94a3b8" }}>{comp.name === 'Total' ? '-' : `${txs.length} invoices`}</span>
                    <span className="text-[9px] font-bold" style={{ color: "#64748b" }}>{fmt(rev)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardShell>
      </div>

      {/* -Client-Wise Performance */}
      <CardShell>
        <SectionTitle icon={Briefcase}>Client Wise Performance of this Company </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Client / Company", "Invoices", "Total Revenue", "Collected", "Pending", "Efficiency"].map(h => (
                  <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(KPIs.clientPerformance || []).slice(0, 10).map((client, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-[11px] font-bold" style={{ color: COLORS.primary }}>{client.name}</td>
                  <td className="px-4 py-3 text-[11px]" style={{ color: "#64748b" }}>{client.count}</td>
                  <td className="px-4 py-3 text-[11px] font-bold" style={{ color: COLORS.emerald }}>{fmt(client.revenue)}</td>
                  <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: COLORS.blue }}>{fmt(client.collected)}</td>
                  <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: client.pending <= 0 ? COLORS.emerald : COLORS.amber }}>
                    {client.pending <= 0 ? <span>{fmt(Math.abs(client.pending))} <span className="text-[9px] opacity-75">(Adv)</span></span> : fmt(client.pending)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${Math.min(client.efficiency, 100)}%`,
                            background: client.efficiency >= 90 ? COLORS.emerald : (client.efficiency >= 50 ? COLORS.blue : COLORS.amber)
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: "#64748b" }}>{client.efficiency.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardShell >
    </div >
  );
};

const GSTTab = ({ KPIs }) => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total GST" value={fmt(KPIs.totalGST)} icon={Layers} color={COLORS.purple} subtitle="All components" />
      <MetricCard title="IGST (Interstate)" value={fmt(KPIs.totalIGST)} icon={MapPin} color={COLORS.sky} subtitle={KPIs.totalGST > 0 ? `${((KPIs.totalIGST / KPIs.totalGST) * 100).toFixed(0)}% of total` : "N/A"} />
      <MetricCard title="CGST + SGST" value={fmt(KPIs.totalCGST_SGST)} icon={Layers} color={COLORS.blue} subtitle={KPIs.totalGST > 0 ? `${((KPIs.totalCGST_SGST / KPIs.totalGST) * 100).toFixed(0)}% of total` : "N/A"} />
      <MetricCard title="Avg GST/Invoice" value={fmt(KPIs.totalGST / (KPIs.totalInvoices || 1))} icon={DollarSign} color={COLORS.emerald} subtitle="Per transaction" />
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
  </div>
);

const PartiesTab = ({ KPIs, PARTIES }) => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total Parties" value={PARTIES.length} icon={Users} color={COLORS.blue} subtitle="Active customers" />
      <MetricCard title="Top Party Revenue" value={fmt(KPIs.topParties[0]?.value || 0)} icon={Users} color={COLORS.emerald} subtitle={KPIs.topParties[0]?.name || "N/A"} />
      <MetricCard title="Top 3 Concentration" value={`${(KPIs.topParties.slice(0, 3).reduce((s, p) => s + parseFloat(p.pct || 0), 0)).toFixed(0)}%`} icon={Target} color={COLORS.amber} subtitle="Revenue share" />
      <MetricCard title="Avg Revenue/Party" value={fmt(KPIs.totalRevenue / (PARTIES.length || 1))} icon={DollarSign} color={COLORS.purple} subtitle="Per active party" />
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
                  style={{ width: `${KPIs.topParties[0]?.value ? (p.value / KPIs.topParties[0].value) * 100 : 0}%`, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.blue})` }} />
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
                ...KPIs.topParties.slice(0, 3).map(p => ({ name: p.name.split(" ").slice(0, 2).join(" "), value: p.value })),
                { name: "Others", value: Math.max(0, KPIs.totalRevenue - KPIs.topParties.slice(0, 3).reduce((s, p) => s + p.value, 0)) }
              ]} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}>
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

const ProductsTab = ({ KPIs, ITEMS, SELL_SUMMARY }) => (
  <div>
    {/* KPI Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="Total Items" value={ITEMS.length} icon={Package} color={COLORS.blue} subtitle="Active products" />
      <MetricCard title="Top Item Units" value={KPIs.topItems[0]?.units.toLocaleString() || 0} icon={Package} color={COLORS.emerald} subtitle={KPIs.topItems[0]?.name?.split(" ").slice(0, 2).join(" ") || "N/A"} />
      <MetricCard title="Total Units Sold" value={SELL_SUMMARY.reduce((s, d) => s + parseFloat(d.units_sold || 0), 0).toLocaleString()} icon={Package} color={COLORS.amber} subtitle="All items combined" />
      <MetricCard title="Total Line Items" value={SELL_SUMMARY.length} icon={FileText} color={COLORS.purple} subtitle="Invoice line items" />
    </div>

    {/* Row 1: Top Items bar + Item Revenue progress bars */}
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
              <Bar dataKey="units" radius={[0, 4, 4, 0]}>
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
            const pct = totalItemRev > 0 ? ((item.revenue / totalItemRev) * 100).toFixed(0) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold" style={{ color: COLORS.primary }}>{item.name && item.name.length > 26 ? item.name.slice(0, 24) + "…" : item.name}</span>
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

const GeographyTab = ({ KPIs }) => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard title="States Served" value={KPIs.stateData.length} icon={MapPin} color={COLORS.blue} subtitle="Geographic spread" />
      <MetricCard title="Top State" value={KPIs.stateData[0]?.state || "N/A"} icon={MapPin} color={COLORS.emerald} subtitle={fmt(KPIs.stateData[0]?.value || 0)} />
      <MetricCard title="Interstate Rev" value={fmt(KPIs.interstateTotal)} icon={MapPin} color={COLORS.amber} subtitle={KPIs.totalRevenue > 0 ? `${((KPIs.interstateTotal / KPIs.totalRevenue) * 100).toFixed(0)}% of total` : "N/A"} />
      <MetricCard title="Intrastate Rev" value={fmt(KPIs.intrastate)} icon={MapPin} color={COLORS.purple} subtitle={KPIs.totalRevenue > 0 ? `${((KPIs.intrastate / KPIs.totalRevenue) * 100).toFixed(0)}% of total` : "N/A"} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      <CardShell>
        <SectionTitle icon={BarChart2}>Revenue by State</SectionTitle>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={KPIs.stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis dataKey="state" type="category" width={90} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [fmt(v), "Revenue"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
              ]} cx="50%" cy="50%" innerRadius={42} outerRadius={72} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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

// ============================================================
// MAIN APP
// ============================================================
const QuotationsTab = ({ KPIs }) => (
  <div>
    <div className="grid grid-cols-1 gap-5 mb-5">
      <CardShell>
        <SectionTitle icon={Activity} subtitle="Sales pipeline health indicator">
          Pipeline Performance Summary
        </SectionTitle>
        <div className="space-y-4 mt-3">
          <div className="p-4 rounded-lg" style={{ background: "#dcfce7" }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: "#166534" }}>CONVERTED</p>
            <p className="text-2xl font-black mb-1" style={{ color: COLORS.emerald }}>{KPIs.convertedQuotations}</p>
            <p className="text-[9px]" style={{ color: "#166534" }}>{fmt(KPIs.convertedValue)} revenue generated</p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: "#fee2e2" }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: "#991b1b" }}>LOST</p>
            <p className="text-2xl font-black mb-1" style={{ color: COLORS.red }}>{KPIs.totalQuotations - KPIs.convertedQuotations}</p>
            <p className="text-[9px]" style={{ color: "#991b1b" }}>{fmt(KPIs.lostQuotationValue)} opportunity lost</p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: "#dbeafe" }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: "#1e40af" }}>AVERAGE</p>
            <p className="text-2xl font-black mb-1" style={{ color: COLORS.blue }}>
              {fmt(KPIs.quotationValue / (KPIs.totalQuotations || 1))}
            </p>
            <p className="text-[9px]" style={{ color: "#1e40af" }}>Per quotation value</p>
          </div>
        </div>
      </CardShell >
    </div >

    {parseFloat(KPIs.quotationConversionRate) < 50 && KPIs.totalQuotations > 10 && (
      <div className="mt-5">
        <InsightBanner
          type="warning"
          message="Conversion rate below 50%. Review pricing strategy, follow-up process, and competitor positioning."
        />
      </div>
    )}
  </div >
);

// ============================================================
// MAIN APP COMPONENT
// ============================================================
export default function App() {
  const { selectedCompany } = useCompany();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthRange, setMonthRange] = useState({ start: 0, end: 11 }); // 0-11 for Jan-Dec
  const [comparisonData, setComparisonData] = useState([]); // Comparison Data State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      fetchAnalytics();
    }
  }, [selectedCompany]);

  // Fetch Comparison Data on Mount
  // Fetch Comparison Data on Mount
  useEffect(() => {
    handleApiResponse(api.get('/analytics/comparison'))
      .then(res => setComparisonData(res.data || []))
      .catch(err => console.error("Comparison fetch error:", err));
  }, []);

  async function fetchAnalytics() {
    if (!selectedCompany) return;

    setLoading(true);
    setError(null);

    try {
      const response = await handleApiResponse(
        api.get(`/analytics/${selectedCompany.id}/data`)
      );

      setAnalyticsData({ ...response.data, companyName: response.companyName });
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }

  // Compute Available Years
  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    if (!analyticsData?.transactions) return [currentY];
    const years = new Set();
    years.add(currentY);
    analyticsData.transactions.forEach(t => {
      const d = new Date(t.transaction_date);
      if (!isNaN(d)) years.add(d.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [analyticsData]);

  // Filter Data by Year & Month Range
  const filteredData = useMemo(() => {
    if (!analyticsData) return null;

    const rawTx = analyticsData.transactions || [];
    const targetYear = parseInt(selectedYear);

    // Filter Transactions
    const filteredTx = rawTx.filter(t => {
      const d = new Date(t.transaction_date);
      if (isNaN(d)) return false;
      const y = d.getFullYear();
      const m = d.getMonth(); // 0-11
      return y === targetYear && m >= monthRange.start && m <= monthRange.end;
    });

    const validIds = new Set(filteredTx.map(t => t.invoice_no));
    // Filter Sell Summary based on valid invoice IDs
    const filteredSell = (analyticsData.sellSummary || []).filter(s => validIds.has(s.invoice_no));

    return {
      ...analyticsData,
      transactions: filteredTx,
      sellSummary: filteredSell
    };
  }, [analyticsData, selectedYear, monthRange]);

  const filteredComparisonData = useMemo(() => {
    if (!comparisonData) return [];
    const targetYear = parseInt(selectedYear);

    return comparisonData.map(c => ({
      ...c,
      transactions: (c.transactions || []).filter(t => {
        const d = new Date(t.transaction_date);
        if (isNaN(d)) return false;
        const y = d.getFullYear();
        const m = d.getMonth();
        return y === targetYear && m >= monthRange.start && m <= monthRange.end;
      })
    }));
  }, [comparisonData, selectedYear, monthRange]);

  const KPIs = useMemo(() => {
    return filteredData ? computeKPIs(filteredData, monthRange) : null;
  }, [filteredData, monthRange]);

  const tabContent = {
    overview: KPIs ? <OverviewTab KPIs={KPIs} comparisonData={filteredComparisonData} monthRange={monthRange} /> : null,
    gst: KPIs ? <GSTTab KPIs={KPIs} /> : null,
    parties: KPIs && analyticsData ? <PartiesTab KPIs={KPIs} PARTIES={analyticsData.parties || []} /> : null,
    products: KPIs && analyticsData ? <ProductsTab KPIs={KPIs} ITEMS={analyticsData.items || []} SELL_SUMMARY={analyticsData.sellSummary || []} /> : null,
    geography: KPIs ? <GeographyTab KPIs={KPIs} /> : null,
    quotations: KPIs ? <QuotationsTab KPIs={KPIs} /> : null
  };

  if (!selectedCompany) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center">
          <AlertCircle size={48} color="#f59e0b" />
          <h2 className="text-xl font-bold mt-4" style={{ color: "#0f2f3f" }}>No Company Selected</h2>
          <p className="text-sm mt-2" style={{ color: "#64748b" }}>Please select a company to view analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-bold mt-4" style={{ color: "#0f2f3f" }}>Loading Analytics...</h2>
          <p className="text-sm mt-2" style={{ color: "#64748b" }}>Fetching data for {selectedCompany.name}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center max-w-md">
          <AlertCircle size={48} color="#ef4444" />
          <h2 className="text-xl font-bold mt-4" style={{ color: "#0f2f3f" }}>Error Loading Analytics</h2>
          <p className="text-sm mt-2" style={{ color: "#64748b" }}>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!KPIs) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center">
          <FileText size={48} color="#94a3b8" />
          <h2 className="text-xl font-bold mt-4" style={{ color: "#0f2f3f" }}>No Data Available</h2>
          <p className="text-sm mt-2" style={{ color: "#64748b" }}>No analytics data found for {selectedCompany.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f5", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ background: "linear-gradient(135deg, #0f2f3f 0%, #1a4d5c 50%, #1e6b7a 100%)", color: "#fff" }}>
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="mb-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold opacity-75">Analytics Dashboard</p>
                <p className="text-lg font-bold">{selectedCompany.name}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <BarChart2 size={20} color="#14b8a6" />
              </div>
              <div>
                <h1 className="text-[15px] font-black">Business Intelligence</h1>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Actionable insights </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
              {/* Year & Month Range Filter */}
              <div className="bg-white/10 rounded-lg px-2 py-1.5 flex items-center backdrop-blur-sm border border-white/10 gap-3">
                {/* Year Select */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Year</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-[11px] font-bold text-teal-400 outline-none cursor-pointer"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y} className="text-slate-900 bg-white">{y}</option>
                    ))}
                  </select>
                </div>

                <div className="w-px h-3 bg-white/20"></div>

                {/* From Month */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">From</span>
                  <select
                    value={monthRange.start}
                    onChange={(e) => setMonthRange(prev => ({ ...prev, start: Number(e.target.value) }))}
                    className="bg-transparent text-[11px] font-bold text-teal-400 outline-none cursor-pointer"
                  >
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                      <option key={m} value={i} className="text-slate-900 bg-white">{m}</option>
                    ))}
                  </select>
                </div>

                {/* To Month */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">To</span>
                  <select
                    value={monthRange.end}
                    onChange={(e) => setMonthRange(prev => ({ ...prev, end: Number(e.target.value) }))}
                    className="bg-transparent text-[11px] font-bold text-teal-400 outline-none cursor-pointer"
                  >
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                      <option key={m} value={i} className="text-slate-900 bg-white">{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,0.1)", opacity: refreshing ? 0.5 : 1 }}
              >
                <RefreshCw size={13} color="#14b8a6" className={refreshing ? "animate-spin" : ""} />
                <span className="text-[11px] font-semibold">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>

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

      <main className="max-w-7xl mx-auto px-5 py-6">
        {tabContent[activeTab]}
      </main>

      <footer className="max-w-7xl mx-auto px-5 pb-6">
        <div className="rounded-2xl p-5 flex flex-wrap justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #0f2f3f 0%, #1a4d5c 100%)", color: "#fff" }}>
          {[
            { label: "Total Revenue", val: fmt(KPIs.totalRevenue), sub: `${KPIs.totalInvoices} invoices`, growth: KPIs.revenueGrowthRate },
            { label: "Collection Rate", val: `${KPIs.collectionRate}%`, sub: "Efficiency", growth: "N/A" },
            { label: "Active Customers", val: KPIs.activeParties, sub: "Parties served", growth: "N/A" },
            { label: "Win Rate", val: `${KPIs.quotationConversionRate}%`, sub: "Quotations", growth: "N/A" }
          ].map((s, i) => (
            <div key={i} className="flex-1" style={{ minWidth: 120 }}>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              <h3 className="text-[20px] font-black mt-0.5">{s.val}</h3>
              <p className="text-[10px] mt-0.5 flex items-center gap-1.5">
                {s.growth !== "N/A" && (
                  <span style={{ color: parseFloat(s.growth) >= 0 ? "#34d399" : "#f87171" }}>
                    {parseFloat(s.growth) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(s.growth))}%
                  </span>
                )}
                <span style={{ color: "rgba(255,255,255,0.35)" }}>{s.sub}</span>
              </p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}