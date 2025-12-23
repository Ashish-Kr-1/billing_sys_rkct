export default function Ledger() {
  const ledgerData = [
    {
      date: "10 Dec 2025",
      invoice: "INV-101",
      client: "ABC Pvt Ltd",
      debit: 12000,
      credit: 0,
      balance: 12000,
      status: "Pending",
    },
    {
      date: "12 Dec 2025",
      invoice: "INV-102",
      client: "XYZ Industries",
      debit: 15000,
      credit: 15000,
      balance: 0,
      status: "Paid",
    },
  ];

  return (
    <div className="bg-[#0B1120] p-6 rounded-xl shadow-xl mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">
        📒 Billing Ledger
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="py-3">Date</th>
              <th>Invoice</th>
              <th>Client</th>
              <th className="text-right">Debit (₹)</th>
              <th className="text-right">Credit (₹)</th>
              <th className="text-right">Balance (₹)</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {ledgerData.map((row, index) => (
              <tr
                key={index}
                className="border-b border-gray-800 hover:bg-[#111827]"
              >
                <td className="py-3">{row.date}</td>
                <td>{row.invoice}</td>
                <td>{row.client}</td>
                <td className="text-right text-red-400">
                  {row.debit || "-"}
                </td>
                <td className="text-right text-green-400">
                  {row.credit || "-"}
                </td>
                <td className="text-right font-semibold">
                  ₹{row.balance}
                </td>
                <td className="text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      row.status === "Paid"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-yellow-600/20 text-yellow-400"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
