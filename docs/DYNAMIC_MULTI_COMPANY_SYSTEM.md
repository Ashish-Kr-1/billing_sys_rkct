# Multi-Company Dynamic System Documentation

## Overview
This document outlines the implementation of a dynamic multi-company billing system that automatically adjusts the navbar and invoice forms based on the selected company database.

## Architecture

### Database Structure
The system manages **3 separate databases**:

1. **Company 1 (ID: 1)**: RK Casting and Engineering Works
   - Database: `u971268451_Billing_System`
   - Short Name: RK Casting
   - Invoice Prefix: `RKCT`
   - Branding: Slate Blue → Emerald Green

2. **Company 2 (ID: 2)**: RKCASTING ENGINEERING PVT. LTD.
   - Database: `u971268451_GlobalBilling`
   - Short Name: RK Engineering
   - Invoice Prefix: `RKEP`
   - Branding: Dark Slate → Blue

3. **Company 3 (ID: 3)**: Global Bharat
   - Database: `u971268451_RkWorkBilling`
   - Short Name: Global Bharat
   - Invoice Prefix: `GBH`
   - Branding: Indigo → Purple

### Company Configurations Table

Each database contains a `company_configs` table with the following structure:

```sql
CREATE TABLE company_configs (
    config_id INT PRIMARY KEY,
    company_id INT UNIQUE,
    company_name VARCHAR(255),
    company_short_name VARCHAR(100),
    
    -- Legal Details
    gstin VARCHAR(20),
    trade_license_no VARCHAR(50),
    
    -- Address
    company_address TEXT,
    pin_code VARCHAR(10),
    state VARCHAR(50),
    
    -- Contact
    mobile_no VARCHAR(20),
    email VARCHAR(100),
    
    -- Banking
    account_name VARCHAR(255),
    account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    branch VARCHAR(100),
    branch_code VARCHAR(20),
    
    -- Invoice Settings
    invoice_prefix VARCHAR(20),
    financial_year VARCHAR(20),
    
    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(10),
    secondary_color VARCHAR(10),
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Backend Implementation

### 1. Company Configuration Endpoint

**Endpoint**: `GET /companies/:companyId/config`

**Controller**: `companyController.js`

```javascript
export async function getCompanyConfig(req, res) {
    const { companyId } = req.params;
    const configs = await dbManager.query(
        companyId,
        'SELECT * FROM company_configs WHERE company_id = ? LIMIT 1',
        [companyId]
    );
    
    return res.status(200).json({
        success: true,
        config: configs[0]
    });
}
```

### 2. Dynamic Invoice Number Generation

The `getNextInvoiceNumber` function now fetches the invoice prefix and financial year from the company_configs table:

```javascript
async function getNextInvoiceNumber(req, res) {
    // Fetch company-specific invoice prefix
    const [configRows] = await client.query(
        'SELECT invoice_prefix, financial_year FROM company_configs WHERE company_id = ?',
        [req.companyId]
    );
    
    const { invoice_prefix, financial_year } = configRows[0];
    const prefix = `${invoice_prefix}/${financial_year}`;
    
    // Generate next invoice number
    // e.g., RKCT/2025-26/001, RKEP/2025-26/001, GBH/2025-26/001
}
```

## Frontend Implementation

### 1. Navbar Component (`Navbarr.jsx`)

**Dynamic Features**:
- Fetches company configuration on company selection
- Displays company badge with dynamic gradient colors
- Shows company ID for quick identification

```jsx
// Fetch company config for branding
useEffect(() => {
    if (selectedCompany) {
        api.get(`/companies/${selectedCompany.id}/config`)
            .then(data => setCompanyConfig(data.config));
    }
}, [selectedCompany]);

// Dynamic company badge
<span 
    style={{ 
        background: `linear-gradient(135deg, ${companyConfig.primary_color}, ${companyConfig.secondary_color})`
    }}
>
    C{selectedCompany.id}
</span>
```

### 2. Invoice Form Component (`Invoice_form.jsx`)

**Dynamic Features**:
- Company name and address auto-populate
- GSTIN and Trade License update automatically
- Bank details change based on company
- Invoice prefix adjusts per company

```jsx
// Fetch company configuration
useEffect(() => {
    if (selectedCompany) {
        api.get(`/companies/${selectedCompany.id}/config`)
            .then(data => {
                setCompanyConfig(data.config);
                // Update invoice with company-specific defaults
                setInvoice(prev => ({
                    ...prev,
                    GSTIN0: data.config.gstin,
                    AccountName: data.config.account_name,
                    CurrentACCno: data.config.account_no,
                    IFSCcode: data.config.ifsc_code,
                    Branch: `${data.config.branch} | Branch Code - ${data.config.branch_code}`,
                }));
            });
    }
}, [selectedCompany]);

// Dynamic company details in invoice header
<h2>{companyConfig?.company_name || 'M/S R.K Casting & Engineering Works'}</h2>
<p>{companyConfig?.company_address || 'Default Address'}</p>
<p>Mobile: {companyConfig?.mobile_no || '+91 6204583192'}</p>
<p>Email: {companyConfig?.email || 'default@email.com'}</p>
<p>License: {companyConfig?.trade_license_no || 'SEA2135400243601'}</p>
```

## How It Works

### User Flow:

1. **User logs in** → Redirected to company selection page
2. **User selects Company** (e.g., Company 2: RK Engineering)
3. **Company context updates** → `selectedCompany` state changes
4. **Backend receives requests** with `X-Company-Id: 2` header
5. **Database switches** to `u971268451_GlobalBilling`
6. **Navbar updates**:
   - Shows "RK Engineering"
   - Displays "C2" badge with blue gradient
7. **Invoice form updates**:
   - Company name: "RKCASTING ENGINEERING PVT. LTD."
   - Invoice prefix: "RKEP/2025-26/001"
   - Bank details for Company 2
   - Company 2's address, GSTIN, etc.

### Database Routing:

```javascript
// Middleware in app.js
app.use((req, res, next) => {
    const companyId = req.headers['x-company-id'];
    req.db = dbManager.getPool(companyId);
    req.companyId = companyId;
    next();
});
```

### API Client (Frontend):

```javascript
// apiClient.js automatically adds company header
const config = {
    headers: {
        'X-Company-Id': selectedCompany?.id || 1,
        'Authorization': `Bearer ${token}`
    }
};
```

## Visual Differentiation

Each company has unique branding colors:

| Company | Primary Color | Secondary Color | Visual Effect |
|---------|--------------|-----------------|---------------|
| Company 1 (RK Casting) | `#1e293b` (Slate) | `#10b981` (Emerald) | 🟦 → 🟩 |
| Company 2 (RK Engineering) | `#0f172a` (Dark Slate) | `#3b82f6` (Blue) | 🟦 → 🔵 |
| Company 3 (Global Bharat) | `#312e81` (Indigo) | `#a855f7` (Purple) | 🟣 → 🟪 |

## Setup Instructions

### Initial Setup:

1. **Run the setup script** to create company_configs tables:
   ```bash
   cd src/backend
   node setup_company_configs.js
   ```

2. **Verify tables created** in all 3 databases

3. **Update company details** for Company 2 and 3:
   ```sql
   UPDATE company_configs
   SET 
       gstin = 'ACTUAL_GSTIN_HERE',
       company_address = 'ACTUAL_ADDRESS',
       mobile_no = 'PHONE_NUMBER',
       email = 'EMAIL@COMPANY.COM',
       account_name = 'BANK_ACCOUNT_NAME',
       account_no = 'ACCOUNT_NUMBER',
       ifsc_code = 'IFSC_CODE',
       bank_name = 'BANK_NAME',
       branch = 'BRANCH_NAME'
   WHERE company_id IN (2, 3);
   ```

### Testing:

1. Login to the system
2. Select different companies
3. Navigate to Invoice form
4. Verify:
   - ✅ Company name changes
   - ✅ Address updates
   - ✅ Bank details change
   - ✅ Invoice prefix is correct
   - ✅ Navbar badge shows correct color
   - ✅ GSTIN updates

## Benefits

1. **No Hardcoding**: All company details stored in database
2. **Easy Updates**: Change company info without code changes
3. **Scalable**: Easy to add more companies
4. **Visual Clarity**: Color-coded companies prevent confusion
5. **Centralized Config**: Single source of truth per company
6. **Automatic Switching**: Context-aware UI updates

## Configuration Updates

To update company configuration:

```javascript
// Frontend example
api.put(`/companies/${companyId}/config`, {
    company_address: 'New Address',
    mobile_no: 'New Phone',
    primary_color: '#FF5733'
});
```

Note: Backend endpoint for PUT needs to be implemented if needed.

## Troubleshooting

### Company details not showing:
- Check if company_configs table exists in the database
- Verify company_id matches in the table
- Check browser console for API errors

### Wrong invoice prefix:
- Verify `invoice_prefix` in company_configs table
- Check if `req.companyId` is set correctly in backend

### Colors not applied:
- Clear browser cache
- Check if `companyConfig` state is populated
- Verify CSS supports inline styles

## Future Enhancements

1. **Logo Upload**: Allow companies to upload custom logos
2. **Theme Customization**: Full color palette per company
3. **Multi-language**: Support for different languages per company
4. **Custom Fields**: Add company-specific invoice fields
5. **Template Variations**: Different invoice layouts per company

---

**Last Updated**: February 5, 2026
**Version**: 1.0.0
