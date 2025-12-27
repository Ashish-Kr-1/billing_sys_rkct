import { useState, useMemo } from "react";

export default function Ledger() {
  const ledgerData = [
    {
      date: "21 Nov 2025",
      invoice: "INV-090",
      client: "ACC Limited",
      debit: 0,
      credit: 20000,
      balance: 20000,
    },
    {
      date: "28 Nov 2025",
      invoice: "INV-091",
      client: "ACC Limited",
      debit: 15000,
      credit: 0,
      balance: 5000,
    },
    {
      date: "10 Dec 2025",
      invoice: "INV-101",
      client: "ABC Pvt Ltd",
      debit: 12000,
      credit: 0,
      balance: 12000,
    },
    {
      date: "12 Dec 2025",
      invoice: "INV-102",
      client: "XYZ Industries",
      debit: 15000,
      credit: 15000,
      balance: 0,
    },
    {
      date: "20 Dec 2025",
      invoice: "INV-103",
      client: "ACC Limited",
      debit: 30000,
      credit: 0,
      balance: 25000,
    },
    {
      date: "05 Jan 2026",
      invoice: "INV-110",
      client: "ABC Pvt Ltd",
      debit: 0,
      credit: 12000,
      balance: 13000,
    },
    {
      date: "15 Jan 2026",
      invoice: "INV-111",
      client: "XYZ Industries",
      debit: 18000,
      credit: 0,
      balance: 31000,
    },
    {
      date: "17 Jan 2026",
      invoice: "INV-112",
      client: "XYZ Industries",
      debit: 18000,
      credit: 15000,
      balance: 46000,
    },
     {
      date: "21 Dec 2025",
      invoice: "INV-104",
      client: "ACC Limited",
      debit: 30000,
      credit: 30000,
      balance: 25000,
    },
  ];

  const [fromMonth, setFromMonth] = useState("All");
  const [toMonth, setToMonth] = useState("All");
  const [selectedClient, setSelectedClient] = useState("All");

  const parseMonth = (dateStr) => {
    const [, mon, year] = dateStr.split(" ");
    const monthMap = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04",
      May: "05", Jun: "06", Jul: "07", Aug: "08",
      Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    return `${year}-${monthMap[mon]}`;
  };

  const monthOptions = useMemo(
    () =>
      Array.from(new Set(ledgerData.map((row) => parseMonth(row.date)))).sort(),
    []
  );
  const clientOptions = useMemo(
    () => Array.from(new Set(ledgerData.map((row) => row.client))),
    []
  );

  const filteredData = useMemo(() => {
    return ledgerData.filter((row) => {
      const rowMonth = parseMonth(row.date);
      const matchesMonthRange =
        (fromMonth === "All" || rowMonth >= fromMonth) &&
        (toMonth === "All" || rowMonth <= toMonth);
      const matchesClient =
        selectedClient === "All" || row.client === selectedClient;
      return matchesMonthRange && matchesClient;
    });
  }, [fromMonth, toMonth, selectedClient]);

  // 🔹 ANALYTICS CALCULATIONS
  const stats = useMemo(() => {
    const totalDebit = filteredData.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = filteredData.reduce((sum, row) => sum + row.credit, 0);
    return {
      totalDebit,
      totalCredit,
      outstanding: totalDebit - totalCredit,
    };
  }, [filteredData]);

  return (
    <div className="bg-gray-950 min-h-screen p-8 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Financial Overview</h1>

        {/* 🔹 ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111827] p-6 rounded-xl border border-gray-600 shadow-lg">
            <p className="text-sm text-gray-400 uppercase tracking-wider">
              Total Billed
            </p>
            <p className="text-2xl font-bold text-red-400">
              ₹{stats.totalDebit.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#111827] p-6 rounded-xl border border-gray-600 shadow-lg">
            <p className="text-sm text-gray-400 uppercase tracking-wider">
              Total Collected
            </p>
            <p className="text-2xl font-bold text-green-600">
              ₹{stats.totalCredit.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#111827] p-6 rounded-xl border border-gray-600 shadow-lg">
            <p className="text-sm text-gray-400 uppercase tracking-wider">
              Net Outstanding
            </p>
            <p className="text-2xl font-bold text-blue-400">
              ₹{stats.outstanding.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 🔹 FILTERS & TABLE SECTION */}
        <div className="bg-[#0B1120] p-6 rounded-xl shadow-xl border border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold">Transaction Ledger</h2>

            <div className="flex flex-wrap gap-3">
              <select
                onChange={(e) => setFromMonth(e.target.value)}
                className="bg-[#020617] border border-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500"
              >
                <option value="All">From (All)</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                onChange={(e) => setToMonth(e.target.value)}
                className="bg-[#020617] border border-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500"
              >
                <option value="All">To (All)</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-[#020617] border border-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-blue-500"
              >
                <option value="All">All Clients</option>
                {clientOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="py-4 px-2">Date</th>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => {
                  // 🔹 AUTOMATIC STATUS LOGIC
                  // If it's a payment (Debit 0) OR Balance is cleared (0) -> Paid
                  const isPaid = row.debit === 0 || row.balance === 0;
                  const status = isPaid ? "Paid" : "Pending";

                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                    >
                      <td className="py-4 px-2 text-gray-400">{row.date}</td>
                      <td className="font-mono text-blue-400">{row.invoice}</td>
                      <td className="font-medium">{row.client}</td>
                      <td className="text-right text-red-400">
                        ₹
                        {row.debit > 0
                          ? row.debit.toLocaleString()
                          : "0"}
                      </td>
                      <td className="text-right text-green-400">
                        ₹
                        {row.credit > 0
                          ? row.credit.toLocaleString()
                          : "0"}
                      </td>
                      <td className="text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            status === "Paid"
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}