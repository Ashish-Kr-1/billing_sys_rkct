import React from 'react'
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import InvoicePDF from "./InvoicePDF";

function preview() {
  return (
    <div>
        <div className="mt-10">
  <h2 className="text-xl font-bold mb-4">Invoice Preview</h2>

  <div className="border rounded-lg overflow-hidden h-[500px]">
    <PDFViewer width="100%" height="100%">
      <InvoicePDF invoice={invoice} totals={{
        subtotal: subtotalAmount.toFixed(2),
        sgst : sgst.toFixed(2),
        cgst : cgst.toFixed(2),
        grandTotal: totalAmount.toFixed(2),
      }} />
    </PDFViewer>
  </div>

  {/* DOWNLOAD BUTTON */}
  <PDFDownloadLink
    document={
      <InvoicePDF invoice={invoice} totals={{
        subtotal: subtotalAmount.toFixed(2),
        sgst : sgst.toFixed(2),
        cgst : cgst.toFixed(2),
        grandTotal: totalAmount.toFixed(2),
      }} />
    }
    fileName={`Invoice_${invoice.clientName}.pdf`}
  >
    {({ loading }) =>
      loading ? (
        <button className="btn bg-gray-300 mt-4">Generating PDF...</button>
      ) : (
        <button className="btn bg-blue-600 text-white px-4 py-2 rounded mt-4">
          Download Invoice PDF
        </button>
      )
    }
  </PDFDownloadLink>
</div>
    </div>
  )
}

export default preview