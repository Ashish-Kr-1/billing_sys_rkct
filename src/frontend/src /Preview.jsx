import { useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import InvoiceTemplate from "./components/InvoiceTemplate";

export default function Preview() {

  const { state } = useLocation();

  const invoice = state.invoice;
  const subtotalAmount = state.subtotalAmount;
  const totalAmount = state.totalAmount;
  const sgst = state.sgst;
  const cgst = state.cgst;

  async function downloadPDF() {
    const element = document.getElementById("invoice-download");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();

    pdf.addImage(imgData, "PNG", 0, 0, width, 0);
    pdf.save("invoice.pdf");
  }

  return (
    <div>
      <InvoiceTemplate
        invoice={invoice}
        subtotalAmount={subtotalAmount}
        totalAmount={totalAmount}
        sgst={sgst}
        cgst={cgst}
      />
      <div className="flex justify-around">
      <button onClick={downloadPDF} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded">
        Download PDF
      </button>
      </div>
    </div>
  );
}
