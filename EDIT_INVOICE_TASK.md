# TASK: Edit Invoice from Ledger with Dynamic Preview

## 🎯 Objective
When user clicks "EDIT" in Ledger popup, fetch complete invoice details and navigate to dynamic Preview section where user can edit or download PDF with correct company logos and details.

## 📋 Implementation Plan

### Phase 1: Backend - Add Invoice Details Endpoint ✅
**File**: `/src/backend/routes/index.js` & `/src/backend/controllers/invoiceController.js`

**New Endpoint**: `GET /invoices/:invoiceNo/details`

**Response Structure**:
```json
{
  "invoice": {
    "invoice_no": "GBH/2025-26/001",
    "invoice_date": "2026-02-05",
    "gstin": "20HSLPK7374F1ZJ",
    "party_id": 15,
    "transaction_type": "SALE",
    "subtotal": 50000,
    "cgst": 9,
    "sgst": 9,
    "terms": "Payment within 30 days"
  },
  "invoice_details": {
    "transported_by": "XYZ Transport",
    "place_of_supply": "Jharkhand",
    ...all fields...
  },
  "items": [
    { "description": "Product A", "hsn_code": "1234", "quantity": 10, "price": 5000 }
  ],
  "party": {
    "party_name": "ABC Corp",
    "address": "123 Street",
    "gstin": "22XXXXX..."
  }
}
```

###Phase 2: Update InvoiceTemplate to be Fully Dynamic ✅
**File**: `/src/frontend/src/components/InvoiceTemplate.jsx`

**Changes**:
1. Add `companyConfig` prop
2. Import both logos (DefaultLogo, GlobalBharatLogo)
3. Add `getCompanyLogo()` helper function
4. Replace all hardcoded company details with dynamic values:
   - Logo → `companyConfig.logo_url`
   - Company Name → `companyConfig.company_name`
   - Address → `companyConfig.company_address`
   - Mobile → `companyConfig.mobile_no`
   - Email → `companyConfig.email`
   - GSTIN (header) → `companyConfig.gstin`
   - CIN/Trade License → `companyConfig.cin_no`

### Phase 3: Update Preview Component ✅
**File**: `/src/frontend/src/Preview.jsx`

**Changes**:
1. Add state for `companyConfig`
2. Fetch company configuration in useEffect
3. Pass `companyConfig` to InvoiceTemplate
4. Handle both "new invoice" and "edit from ledger" scenarios

### Phase 4: Update Ledger Edit Button ✅
**File**: `/src/frontend/src/Ledger.jsx`

**Changes**:
1. Create `handleEditInvoice` function
2. Fetch full invoice details from new backend endpoint
3. Navigate to Preview with complete invoice data
4. Include company_id in state for dynamic company config loading

## 🔧 Implementation Details

### 1. Create Backend Endpoint

```javascript
// In routes/index.js
router.get('/invoices/:invoiceNo/details', getInvoiceDetails);

// In controllers/invoiceController.js
export async function getInvoiceDetails(req, res) {
  const { invoiceNo } = req.params;
  const companyId = req.companyId;
  
  try {
    // Fetch invoice
    const [invoices] = await req.db.query(
      'SELECT * FROM transactions WHERE invoice_no = ?',
      [invoiceNo]
    );
    
    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Fetch invoice_details
    const [details] = await req.db.query(
      'SELECT * FROM invoice_details WHERE invoice_no = ?',
      [invoiceNo]
    );
    
    // Fetch items
    const [items] = await req.db.query(
      'SELECT * FROM invoice_items WHERE invoice_no = ?',
      [invoiceNo]
    );
    
    // Fetch party details if party_id exists
    let party = null;
    if (invoices[0].party_id) {
      const [parties] = await req.db.query(
        'SELECT * FROM parties WHERE party_id = ?',
        [invoices[0].party_id]
      );
      party = parties[0] || null;
    }
    
    return res.status(200).json({
      success: true,
      invoice: invoices[0],
      invoice_details: details[0] || {},
      items: items || [],
      party: party
    });
  } catch (error) {
    console.error('Get invoice details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 2. Update InvoiceTemplate

```javascript
// Add props
export default function InvoiceTemplate({ 
  invoice, 
  subtotalAmount, 
  totalAmount, 
  sgst, 
  cgst,
  companyConfig  // NEW
}) {
  
  // Helper to get logo
  const getCompanyLogo = () => {
    if (companyConfig?.company_id === 3) return GlobalBharatLogo;
    if (companyConfig?.logo_url?.includes('global-bharat')) return GlobalBharatLogo;
    return DefaultLogo;
  };
  
  return (
    <div>
      {/* Dynamic Logo */}
      <img src={getCompanyLogo()} alt={companyConfig?.company_name} />
      
      {/* Dynamic Company Name */}
      <h1>{companyConfig?.company_name || 'Company Name'}</h1>
      
      {/* Dynamic Address */}
      <p>{companyConfig?.company_address || 'Address'}</p>
      
      {/* Dynamic Contact */}
      <p>Mobile: {companyConfig?.mobile_no || 'N/A'}</p>
      <p>Email: {companyConfig?.email || 'N/A'}</p>
      
      {/* Dynamic GSTIN Header */}
      <p>GSTIN: {companyConfig?.gstin || invoice.GSTIN0}</p>
      
      {/* Rest of invoice template... */}
    </div>
  );
}
```

### 3. Update Preview Component

```javascript
export default function Preview() {
  const { state } = useLocation();
  const { selectedCompany } = useCompany();
  const [companyConfig, setCompanyConfig] = useState(null);
  
  useEffect(() => {
    // Fetch company config
    const companyId = state?.company_id || selectedCompany?.id;
    if (companyId) {
      handleApiResponse(api.get(`/companies/${companyId}/config`))
        .then(data => setCompanyConfig(data.config))
        .catch(err => console.error('Error fetching company config:', err));
    }
  }, [state, selectedCompany]);
  
  return (
    <div>
      {companyConfig && (
        <InvoiceTemplate
          invoice={invoice}
          subtotalAmount={subtotalAmount}
          totalAmount={totalAmount}
          sgst={sgst}
          cgst={cgst}
          companyConfig={companyConfig}  // Pass dynamic config
        />
      )}
    </div>
  );
}
```

### 4. Update Ledger Edit Handler

```javascript
// In Ledger.jsx

const handleEditInvoice = async (invoice_no) => {
  try {
    // Fetch full invoice details
    const data = await handleApiResponse(
      api.get(`/invoices/${invoice_no}/details`)
    );
    
    // Map backend data to Preview format
    const invoiceData = {
      InvoiceNo: data.invoice.invoice_no,
      InvoiceDate: data.invoice.invoice_date,
      GSTIN0: data.invoice.gstin,
      GSTIN: data.party?.gstin || data.invoice_details.gstIn,
      GSTIN2: data.invoice_details.gstIn2 || '',
      clientName: data.party?.party_name || data.invoice_details.client_name,
      clientAddress: data.party?.address || data.invoice_details.client_address,
      clientName2: data.invoice_details.client_name2 || '',
      clientAddress2: data.invoice_details.client_address2 || '',
      TrasnportBy: data.invoice_details.transported_by || '',
      PlaceofSupply: data.invoice_details.place_of_supply || '',
      PONo: data.invoice_details.po_no || '',
      PODate: data.invoice_details.po_date || '',
      VehicleNo: data.invoice_details.vehicle_no || '',
      EwayBillNo: data.invoice_details.eway_bill_no || '',
      VendorCode: data.invoice_details.vendor_code || '',
      ChallanNo: data.invoice_details.challan_no || '',
      ChallanDate: data.invoice_details.challan_date || '',
      Terms: data.invoice.terms || '',
      AccountName: data.invoice_details.account_name || '',
      CurrentACCno: data.invoice_details.account_no || '',
      IFSCcode: data.invoice_details.ifsc_code || '',
      Branch: data.invoice_details.branch || '',
      party_id: data.invoice.party_id,
      transaction_type: data.invoice.transaction_type,
      items: data.items.map(item => ({
        description: item.description,
        HSNCode: item.hsn_code,
        quantity: item.quantity,
        price: item.unit_price
      }))
    };
    
    // Navigate to Preview with full data
    navigate('/Preview', {
      state: {
        invoice: invoiceData,
        subtotalAmount: data.invoice.subtotal,
        totalAmount: data.invoice.subtotal + (data.invoice.subtotal * data.invoice.cgst / 100) + (data.invoice.subtotal * data.invoice.sgst / 100),
        sgst: data.invoice.sgst,
        cgst: data.invoice.cgst,
        company_id: selectedCompany.id,
        isEditMode: true
      }
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    alert('Failed to load invoice details');
  }
};

// Update button
<button
  onClick={() => handleEditInvoice(invoicePopup.invoice)}
  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-white"
>
  EDIT
</button>
```

## 📊 Data Flow

```
Ledger
  ↓ Click EDIT button
  ↓ handleEditInvoice(invoice_no)
  ↓ API: GET /invoices/:invoiceNo/details
  ↓ Full Invoice Data Retrieved
  ↓ navigate('/Preview', { state: {...fullData, company_id} })
  ↓
Preview Component
  ↓ useEffect: Fetch company config based on company_id
  ↓ API: GET /companies/:companyId/config
  ↓ companyConfig loaded
  ↓
InvoiceTemplate
  ↓ Receives: invoice, totals, companyConfig
  ↓ Renders with dynamic logo & company details
  ↓ User can Download PDF or Edit
```

## ✅ Testing Checklist

1. **Ledger → Edit Flow**:
   - [ ] Click invoice in ledger
   - [ ] Click EDIT button
   - [ ] Full invoice loads in Preview
   - [ ] Correct logo displays (Company 3 = Global Bharat)
   - [ ] Correct company details display
   - [ ] All invoice items present

2. **Preview Functionality**:
   - [ ] Download PDF works
   - [ ] PDF has correct logo & company details
   - [ ] Edit button works (goes back to Invoice form)
   - [ ] New Invoice button works

3. **Company-Specific**:
   - [ ] Company 1: Default RK logo
   - [ ] Company 3: Global Bharat logo (green globe)
   - [ ] Each company shows its own GSTIN, address, etc.

## 🎨 UI Enhancement

Make the Preview section beautiful:
- Add loading state while fetching invoice details
- Add error handling with user-friendly messages
- Add smooth transitions and animations
- Make it responsive for mobile as well

---

**Implementation Priority**: 🔥 HIGH  
**Expected Completion**: 1-2 hours  
**Difficulty**: ⭐⭐⭐ (Medium - backend + frontend integration)
