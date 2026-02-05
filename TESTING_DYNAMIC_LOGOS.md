# Quick Testing Guide - Dynamic Company Logos

## How to Test

### Step 1: Refresh Your Browser
Since new assets were added, do a **hard refresh**:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

### Step 2: Login and Navigate
1. Login to the billing system
2. You'll see company selection page

### Step 3: Test Each Company

#### 🔹 Test Company 1 (RK Casting)
1. Select "RK Casting and Engineering Works"
2. Go to "New Invoice"
3. **Verify**:
   - ✅ Logo: Default RK logo (existing logo.png)
   - ✅ Company Name: "M/S R.K Casting Engineering Pvt. Ltd."
   - ✅ GSTIN: 20DAMPK8203A1ZB
   - ✅ Mobile: +916204583192
   - ✅ Email: rkcastingmoonidih@gmail.com
   - ✅ Next Invoice: RKCT/2025-26/XXX

#### 🌍 Test Company 2 (Global Bharat) - **NEW LOGO**
1. Switch company (Profile → Switch Company)
2. Select "RKCASTING ENGINEERING PVT. LTD." (this database has Global Bharat data)
3. Go to "New Invoice"
4. **Verify**:
   - ✅ Logo: **Global Bharat logo with green globe** ⬅️ THIS SHOULD BE DIFFERENT!
   - ✅ Company Name: "Global Bharat"
   - ✅ GSTIN: 20HSLPK7374F1ZJ
   - ✅ Mobile: +917903685370
   - ✅ Email: globalbharatt@gmail.com
   - ✅ Next Invoice: GBH/2025-26/XXX

#### 🔹 Test Company 3 (RK Engineering)
1. Switch to "Global Bharat" company
2. Go to "New Invoice"
3. **Verify**:
   - ✅ Logo: Default RK logo
   - ✅ Company Name: "M/S R.K Casting Engineering Pvt. Ltd."
   - ✅ GSTIN: 20DAMPK8203A1ZB
   - ✅ Invoice: RKEP/2025-26/XXX

## Expected Visual Difference

### Invoice Header - Company 1 & 3:
```
┌──────────────────────────────────────────┐
│  [RK LOGO]    Tax Invoice                │
│               M/S R.K Casting...         │
│               Plot No. 125...            │
└──────────────────────────────────────────┘
```

### Invoice Header - Company 2 (Global Bharat):
```
┌──────────────────────────────────────────┐
│  [🌍 GB LOGO]    Tax Invoice            │
│   Green Globe    Global Bharat           │
│                  Flat No:- Plot No.-189  │
└──────────────────────────────────────────┘
```

## Troubleshooting

### Logo Not Changing?
1. **Hard refresh** the browser (Cmd+Shift+R)
2. **Clear cache**: In browser dev tools: Application → Clear Storage
3. **Check backend is running**: The backend should be running on port 5000

### API Not Responding?
1. Verify backend server is running: `node app/app.js` in `/src/backend/`
2. Check terminal for any errors
3. Test API manually: Open browser console and run:
   ```javascript
   fetch('http://localhost:5000/companies/2/config', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN',
       'X-Company-Id': '2'
     }
   }).then(r => r.json()).then(console.log)
   ```

### Logo Shows But Old One?
- Browser cached the old import
- Solution: 
  1. Close ALL browser tabs
  2. Stop frontend dev server (Ctrl+C)
  3. Restart: `npm run dev`
  4. Open fresh browser tab

## Quick Visual Check

**You should see TWO different logos:**
- **Company 1 & 3**: Traditional RK logo
- **Company 2**: Modern Global Bharat logo with green dotted globe

If both companies show the same logo, check:
1. ✅ Logo file exists at `/src/assets/logo-global-bharat.png`
2. ✅ Import statement in Invoice_form.jsx
3. ✅ getCompanyLogo() function logic
4. ✅ Hard refresh browser

## Files to Check

If things aren't working, verify these files:

### Frontend:
- `/src/frontend/src/assets/logo-global-bharat.png` - Should exist (24KB)
- `/src/frontend/src/components/Invoice_form.jsx` - Has both logo imports

### Backend:
- `/src/backend/controllers/companyController.js` - Returns logo_url in config
- Database `companies` table has `logo_url` column

## Expected Console Output

When you select Company 2, you should see in Network tab:

**Request**: `GET /companies/2/config`

**Response**:
```json
{
  "success": true,
  "config": {
    "company_name": "Global Bharat",
    "logo_url": "/src/assets/logo-global-bharat.png",
    ...
  }
}
```

---

**The invoice template is now fully responsive!** Each company will show its own logo and details automatically. 🎉
