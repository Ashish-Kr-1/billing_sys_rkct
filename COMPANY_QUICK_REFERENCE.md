# Quick Reference: Company-Specific Configurations

## Company Comparison Table

| Feature | Company 1 (RK Casting) | Company 2 (RK Engineering) | Company 3 (Global Bharat) |
|---------|----------------------|---------------------------|--------------------------|
| **Company ID** | 1 | 2 | 3 |
| **Database** | u971268451_Billing_System | u971268451_GlobalBilling | u971268451_RkWorkBilling |
| **Short Name** | RK Casting | RK Engineering | Global Bharat |
| **Invoice Prefix** | RKCT | RKEP | GBH |
| **Invoice Example** | RKCT/2025-26/001 | RKEP/2025-26/001 | GBH/2025-26/001 |
| **Primary Color** | #1e293b (Slate) | #0f172a (Dark Slate) | #312e81 (Indigo) |
| **Secondary Color** | #10b981 (Emerald) | #3b82f6 (Blue) | #a855f7 (Purple) |
| **Badge Color** | 🟦→🟩 | 🟦→🔵 | 🟣→🟪 |
| **GSTIN** | 20DAMPK8203A1ZB | *(To be added)* | *(To be added)* |
| **License No** | SEA2135400243601 | *(To be added)* | *(To be added)* |
| **Status** | ✅ Fully Configured | ⚠️ Needs Details | ⚠️ Needs Details |

## Visual Indicators in UI

### Navbar Badge
Each company has a unique colored badge:

```
Company 1: [C1] - Slate to Emerald gradient
Company 2: [C2] - Dark Slate to Blue gradient
Company 3: [C3] - Indigo to Purple gradient
```

### Invoice Header
Company-specific information displays automatically:

**Company 1 Example:**
```
GSTIN: 20DAMPK8203A1ZB
M/S R.K Casting & Engineering Works
Plot No. 125, Khata No.19, Rakuwa No. 05,
Mouza-Gopinathdih, Dist.: Dhanbad, Jharkhand, PIN: 828129
Mobile: +91 6204583192
Email: rkcastingmoonidih@gmail.com
T. License No. - SEA2135400243601
```

**Company 2 Example:**
```
GSTIN: [Pending]
RKCASTING ENGINEERING PVT. LTD.
[Address to be configured]
Mobile: [Pending]
Email: [Pending]
T. License No. - [Pending]
```

## API Endpoints

### Get Company Configuration
```http
GET /companies/:companyId/config
Headers: 
  - Authorization: Bearer <token>
  - X-Company-Id: <companyId>

Response:
{
  "success": true,
  "config": {
    "company_id": 1,
    "company_name": "M/S R.K Casting & Engineering Works",
    "gstin": "20DAMPK8203A1ZB",
    "company_address": "...",
    "mobile_no": "+91 6204583192",
    "account_name": "R.K CASTING AND ENGINEERING WORKS",
    "account_no": "08710210000724",
    "ifsc_code": "UCBA0000871",
    "invoice_prefix": "RKCT",
    "financial_year": "2025-26",
    "primary_color": "#1e293b",
    "secondary_color": "#10b981"
  }
}
```

### Get Next Invoice Number (Dynamic)
```http
GET /createInvoice/invoiceNo
Headers:
  - X-Company-Id: 2

Response:
{
  "InvoiceNo": "RKEP/2025-26/001"
}
```

## Database Schema Quick Reference

```sql
-- Check current configuration
SELECT * FROM company_configs WHERE company_id = 1;

-- Update company details
UPDATE company_configs 
SET 
    gstin = '22ABCDE1234F1Z5',
    company_address = 'New Address Here',
    mobile_no = '+91 9876543210',
    email = 'contact@company.com',
    account_name = 'Company Name',
    account_no = '1234567890',
    ifsc_code = 'ABCD0001234',
    branch = 'Branch Name',
    branch_code = '1234'
WHERE company_id = 2;

-- Change branding colors
UPDATE company_configs 
SET 
    primary_color = '#FF5733',
    secondary_color = '#FFC300'
WHERE company_id = 3;
```

## Testing Guide

### Test Company Switching:

1. **Login to the system**
2. **You'll be at Company Selection page**
3. **Select Company 1**:
   - ✅ Navbar shows "RK Casting" with green gradient badge
   - ✅ Go to Invoice → See "M/S R.K Casting & Engineering Works"
   - ✅ Invoice number: RKCT/2025-26/XXX
   - ✅ Bank details: UCO Bank, Account: 08710210000724

4. **Switch to Company 2** (via Profile → Switch Company):
   - ✅ Navbar shows "RK Engineering" with blue gradient badge
   - ✅ Go to Invoice → See "RKCASTING ENGINEERING PVT. LTD."
   - ✅ Invoice number: RKEP/2025-26/XXX
   - ✅ Bank details: Empty (needs configuration)

5. **Switch to Company 3**:
   - ✅ Navbar shows "Global Bharat" with purple gradient badge
   - ✅ Go to Invoice → See "Global Bharat"
   - ✅ Invoice number: GBH/2025-26/XXX
   - ✅ Bank details: Empty (needs configuration)

## Configuration Checklist for Company 2 & 3

To fully configure remaining companies, collect these details:

### Company Information:
- [ ] Full legal company name
- [ ] GSTIN number (15 characters)
- [ ] Trade License number
- [ ] Complete registered address
- [ ] PIN code
- [ ] State

### Contact Details:
- [ ] Primary mobile number
- [ ] Primary email address

### Banking Information:
- [ ] Bank account holder name
- [ ] Bank account number
- [ ] IFSC code
- [ ] Bank name
- [ ] Branch name
- [ ] Branch code

### Preferences:
- [ ] Preferred invoice prefix (3-4 letters)
- [ ] Current financial year
- [ ] Brand color preferences (optional)

## Common Issues & Solutions

### Issue: Company details not showing
**Solution**: 
- Check browser console for errors
- Verify company_configs table exists
- Ensure API endpoint is accessible

### Issue: Wrong invoice prefix
**Solution**:
```sql
UPDATE company_configs 
SET invoice_prefix = 'NEWPREFIX' 
WHERE company_id = X;
```

### Issue: Colors not updating
**Solution**:
- Clear browser cache
- Force refresh (Cmd+Shift+R)
- Check inline styles in DevTools

## Manual Configuration Example

If you need to configure Company 2 right now:

```sql
-- Connect to Company 2 database: u971268451_GlobalBilling
UPDATE company_configs 
SET 
    gstin = '22XYZAB1234C1Z5',
    trade_license_no = 'TL123456789',
    company_address = 'ABC Industrial Area, XYZ City, State - 123456',
    pin_code = '123456',
    state = 'Jharkhand',
    mobile_no = '+91 9876543210',
    email = 'info@rkengineering.com',
    account_name = 'RKCASTING ENGINEERING PVT LTD',
    account_no = '9876543210',
    ifsc_code = 'HDFC0001234',
    bank_name = 'HDFC Bank',
    branch = 'Industrial Area Branch',
    branch_code = '1234'
WHERE company_id = 2;
```

After updating, refresh the Invoice page to see changes!

---

**Quick Access Links:**
- Full Documentation: `/docs/DYNAMIC_MULTI_COMPANY_SYSTEM.md`
- Task Summary: `/TASK_1_SUMMARY.md`
- Setup Script: `/src/backend/setup_company_configs.js`
- Schema: `/src/backend/schema/company_configs.sql`
