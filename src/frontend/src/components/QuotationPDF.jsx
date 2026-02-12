import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        color: '#1A1A1A',
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
    },
    watermark: {
        width: 400,
        opacity: 0.1,
        transform: 'rotate(-30deg)',
    },
    headerTitle: {
        textAlign: 'center',
        fontSize: 24,
        color: '#0A4350',
        fontWeight: 'bold',
        textDecoration: 'underline',
        marginBottom: 5,
    },
    headerContainer: {
        flexDirection: 'row',
        borderBottom: '2pt solid #0A4350',
        paddingBottom: 10,
        marginBottom: 10,
    },
    logoContainer: {
        width: '30%',
    },
    gstinHeader: {
        fontSize: 10,
        color: '#0000FF',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    logo: {
        width: 120,
    },
    companyInfo: {
        width: '70%',
        paddingLeft: 10,
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    companyDetails: {
        fontSize: 9,
        fontWeight: 'normal',
        lineHeight: 1.2,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderBottom: '1pt solid #D9D9D9',
        paddingBottom: 5,
        marginBottom: 10,
        fontSize: 9,
    },
    detailItem: {
        width: '25%',
        marginBottom: 3,
    },
    detailLabel: {
        fontWeight: 'bold',
    },
    billingContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    billingBox: {
        width: '50%',
        border: '1pt solid #D9D9D9',
        borderRadius: 5,
        padding: 8,
    },
    billingHeader: {
        backgroundColor: '#3E7373',
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 3,
        borderRadius: 2,
        marginBottom: 5,
    },
    billingText: {
        fontSize: 9,
        marginBottom: 2,
    },
    billingName: {
        fontWeight: 'bold',
        fontSize: 10,
    },
    table: {
        marginTop: 5,
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0A4350',
        color: 'white',
        padding: 5,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid #D9D9D9',
        padding: 5,
        fontSize: 9,
    },
    colDesc: { width: '40%' },
    colHsn: { width: '15%', textAlign: 'center' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'center' },
    colAmount: { width: '20%', textAlign: 'right' },

    footerContainer: {
        flexDirection: 'row',
        marginTop: 15,
    },
    bankDetails: {
        width: '55%',
        border: '1pt solid #D9D9D9',
        borderRadius: 10,
        padding: 10,
    },
    bankTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    bankText: {
        fontSize: 9,
    },
    totalsContainer: {
        width: '45%',
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginBottom: 4,
        fontSize: 10,
        gap: 10,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginTop: 5,
        paddingTop: 5,
        borderTop: '2pt solid #0A4350',
        fontSize: 14,
        fontWeight: 'bold',
        gap: 10,
    },
    termsBox: {
        marginTop: 15,
        border: '1pt solid #D9D9D9',
        borderRadius: 5,
        padding: 8,
    },
    termsTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    termsText: {
        fontSize: 8,
    },
    signatureSection: {
        marginTop: 30,
        alignItems: 'flex-end',
        paddingRight: 20,
    },
    signatureText: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    signatureSpace: {
        height: 40,
    },
    authText: {
        fontSize: 9,
        fontWeight: 'bold',
    }
});

export default function QuotationPDF({ quotation, subtotalAmount, totalAmount, sgst, cgst, igst, companyConfig, logoUrl }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* WATERMARK */}
                {logoUrl && (
                    <View style={styles.watermarkContainer}>
                        <Image src={logoUrl} style={styles.watermark} />
                    </View>
                )}

                {/* HEADER */}
                <Text style={styles.headerTitle}>QUOTATION</Text>

                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.gstinHeader}>GSTIN: {companyConfig?.gstin || quotation.GSTIN0}</Text>
                        {logoUrl && <Image src={logoUrl} style={styles.logo} />}
                    </View>

                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{companyConfig?.company_name || 'M/S R.K Casting & Engineering Works'}</Text>
                        <Text style={styles.companyDetails}>{companyConfig?.company_address || 'Plot No. 125, Khata No.19, Rakuwa No. 05, Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN : 828129'}</Text>
                        <Text style={styles.companyDetails}>Mobile No: {companyConfig?.mobile_no || '+91 6204583192'}</Text>
                        <Text style={styles.companyDetails}>Email Id: {companyConfig?.email || 'rkcastingmoonidih@gmail.com'}</Text>
                        <Text style={styles.companyDetails}>
                            {companyConfig?.cin_no ? `CIN No.: ${companyConfig.cin_no}` : 'T. License No. - SEA2135400243601'}
                        </Text>
                    </View>
                </View>

                {/* UPPER SECTION */}
                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>Quotation No: </Text>{quotation.QuotationNo}</Text></View>
                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>Date: </Text>{quotation.QuotationDate}</Text></View>
                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>Validity: </Text>{quotation.validity_days} days</Text></View>
                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>RFQ No: </Text>{quotation.rfq_no}</Text></View>

                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>Enquiry Date: </Text>{quotation.rfq_date}</Text></View>
                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>Enquiry From: </Text>{quotation.enquiry_from}</Text></View>
                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>Contact Person: </Text>{quotation.contact_person}</Text></View>
                    <View style={styles.detailItem}><Text><Text style={styles.detailLabel}>Contact No: </Text>{quotation.contact_no}</Text></View>

                    <View style={{ width: '50%', marginBottom: 3 }}><Text><Text style={styles.detailLabel}>Email: </Text>{quotation.email}</Text></View>
                    <View style={{ width: '50% text-right', marginBottom: 3 }}><Text><Text style={styles.detailLabel}>Vendor Code: </Text>{quotation.VendorCode}</Text></View>
                </View>

                {/* BILLING SECTION */}
                <View style={styles.billingContainer}>
                    <View style={styles.billingBox}>
                        <Text style={styles.billingHeader}>BILLED TO PARTY</Text>
                        <Text style={[styles.billingText, styles.billingName]}>{quotation.clientName}</Text>
                        <Text style={styles.billingText}>{quotation.clientAddress}</Text>
                        <Text style={[styles.billingText, { fontWeight: 'bold', marginTop: 5 }]}>GSTIN: {quotation.GSTIN}</Text>
                    </View>
                    <View style={styles.billingBox}>
                        <Text style={styles.billingHeader}>SHIPPED TO PARTY</Text>
                        <Text style={[styles.billingText, styles.billingName]}>{quotation.clientName2}</Text>
                        <Text style={styles.billingText}>{quotation.clientAddress2}</Text>
                        <Text style={[styles.billingText, { fontWeight: 'bold', marginTop: 5 }]}>GSTIN: {quotation.GSTIN2}</Text>
                    </View>
                </View>

                {/* ITEMS TABLE */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDesc}>DESCRIPTION</Text>
                        <Text style={styles.colHsn}>HSN</Text>
                        <Text style={styles.colQty}>QTY</Text>
                        <Text style={styles.colPrice}>PRICE</Text>
                        <Text style={styles.colAmount}>AMOUNT</Text>
                    </View>
                    {quotation.items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDesc}>{item.description}</Text>
                            <Text style={styles.colHsn}>{item.HSNCode}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>Rs.{item.price}</Text>
                            <Text style={styles.colAmount}>Rs.{item.quantity * item.price}</Text>
                        </View>
                    ))}
                </View>

                {/* FOOTER & TOTALS */}
                <View style={styles.footerContainer}>
                    <View style={styles.bankDetails}>
                        <Text style={styles.bankTitle}>Bank Details :-</Text>
                        <Text style={styles.bankText}>{quotation.AccountName}</Text>
                        <Text style={styles.bankText}>{quotation.CurrentACCno}</Text>
                        <Text style={styles.bankText}>{quotation.IFSCcode}</Text>
                        <Text style={styles.bankText}>{quotation.Branch}</Text>
                    </View>

                    <View style={styles.totalsContainer}>
                        <View style={styles.totalRow}>
                            <Text>Subtotal</Text>
                            <Text>Rs.{subtotalAmount.toFixed(2)}</Text>
                        </View>

                        {igst > 0 ? (
                            <View style={styles.totalRow}>
                                <Text>IGST ({igst}%)</Text>
                                <Text>Rs.{((subtotalAmount * igst) / 100).toFixed(2)}</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.totalRow}>
                                    <Text>SGST ({sgst}%)</Text>
                                    <Text>Rs.{((subtotalAmount * sgst) / 100).toFixed(2)}</Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text>CGST ({cgst}%)</Text>
                                    <Text>Rs.{((subtotalAmount * cgst) / 100).toFixed(2)}</Text>
                                </View>
                            </>
                        )}

                        <View style={styles.grandTotalRow}>
                            <Text>Total Amount</Text>
                            <Text>Rs.{Math.round(totalAmount)}</Text>
                        </View>
                    </View>
                </View>

                {/* TERMS */}
                <View style={styles.termsBox}>
                    <Text style={styles.termsTitle}>Terms & Conditions</Text>
                    <Text style={styles.termsText}>{quotation.Terms || "No terms and conditions specified."}</Text>
                </View>

                {/* SIGNATURE */}
                <View style={styles.signatureSection}>
                    <Text style={styles.signatureText}>For {companyConfig?.company_name || 'R.K Casting & Engineering Works'}</Text>
                    <View style={styles.signatureSpace} />
                    <Text style={styles.authText}>Authorized Signatory</Text>
                </View>
            </Page>
        </Document>
    );
}
