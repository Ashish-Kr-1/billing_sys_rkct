import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 20 },
  section: { marginBottom: 10 },
  heading: { fontSize: 18, fontWeight: "bold" },
  text: { fontSize: 12 },
  bold: { fontSize: 12, fontWeight: "bold" },
  table: { marginTop: 10 },
  row: { flexDirection: "row", marginBottom: 5 },
  col: { width: "33%" },
});

export default function InvoicePDF({ invoice, totals }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.section}>
          <Text style={styles.heading}>Tax Invoice</Text>
          <Text style={styles.bold}>GSTIN : 20DAMPK8203A1ZB</Text>
        </View>

        {/* PARTY DETAILS */}
        <View style={styles.section}>
          <Text style={styles.bold}>Bill To:</Text>
          <Text style={styles.text}>{invoice.clientName}</Text>
          <Text style={styles.text}>{invoice.clientAddress}</Text>
        </View>

        {/* ITEMS TABLE */}
        <View style={styles.section}>
          <Text style={styles.bold}>Items</Text>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.col}>{item.description}</Text>
              <Text style={styles.col}>Qty: {item.quantity}</Text>
              <Text style={styles.col}>₹ {item.quantity * item.price}</Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={styles.section}>
          <Text style={styles.bold}>Subtotal: ₹ {totals.subtotal}</Text>
          <Text style={styles.bold}>SGST: ₹ {totals.sgstAmount}</Text>
          <Text style={styles.bold}>CGST: ₹ {totals.cgstAmount}</Text>
          <Text style={styles.bold}>Grand Total: ₹ {totals.grandTotal}</Text>
        </View>

      </Page>
    </Document>
  );
}
