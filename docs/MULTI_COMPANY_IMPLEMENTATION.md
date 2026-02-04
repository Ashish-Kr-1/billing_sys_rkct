# 🏢 Multi-Company Billing System - Implementation Plan

## 📊 System Overview

### Companies & Databases
1. **RK Casting and Engineering Works**
   - Database: `u971268451_Billing_System`
   - User: `u971268451_billing_system`
   
2. **RKCASTING ENGINEERING PVT. LTD.**
   - Database: `u971268451_GlobalBilling`
   - User: `u971268451_global_billing`
   
3. **Global Bharat**
   - Database: `u971268451_RkWorkBilling`
   - User: `u971268451_work_billing`

**Password**: `RKbilling@123` (all three)

---

## 🎯 Implementation Tasks

### ✅ Task 1: Database & Backend Analysis
**Status**: In Progress

**Findings:**
- Current `db.js` uses single connection pool
- Need to implement dynamic database switching based on company selection
- All 3 databases have identical schema structure
- Authentication table (`users`) should be in master DB

**Solution:**
- Create `DatabaseManager` class for multi-tenant connections
- Add `company_id` to user sessions
- Create middleware to inject correct DB connection per request

---

### 🔲 Task 2: Landing Page (Login/Signup/Reset)
**Components to Create:**
- `/Login.jsx` - Modern login form
- `/Signup.jsx` - User registration
- `/ForgotPassword.jsx` - Password reset
- `/ResetPassword.jsx` - New password form

**Features:**
- Animated, professional UI
- Form validation
- JWT token management
- Remember me functionality

---

### 🔲 Task 3: Protected Routes
**Implementation:**
- `ProtectedRoute.jsx` component
- Authentication context provider
- Redirect to login if unauthenticated
- Check token expiration

---

### 🔲 Task 4: Company & Section Selection
**Components:**
- `/CompanySelection.jsx` - Choose from 3 companies
- `/SectionSelection.jsx` - Analytics or Invoice

**Flow:**
1. User logs in
2. Sees 3 company cards with logos/icons
3. Selects company → Store in context
4. Choose section: Analytics OR Invoice
5. Redirect to selected section with company context

---

### 🔲 Task 5: Dynamic Analytics Connection
**Implementation:**
- Modify analytics to accept `company_id` parameter
- Backend endpoint: `/analytics/:companyId`
- Database manager selects correct DB pool
- Fetch real data from selected company's DB
- **Don't modify KPI logic** - just data source

---

### 🔲 Task 6: Invoice Section
**Implementation:**
- Same dynamic DB switching for invoice section
- Company context persists across navigation
- All CRUD operations use selected company's DB

---

## 🏗️ Architecture Changes

### Backend Structure
```
src/backend/
├── config/
│   └── databases.js         # Multi-DB configuration
├── services/
│   └── DatabaseManager.js   # Dynamic connection management
├── middleware/
│   ├── auth.js             # Existing auth
│   └── companyContext.js   # NEW: Inject company DB
├── controllers/
│   ├── authController.js   # Login/signup
│   └── companyController.js # NEW: Company operations
└── app/
    └── app.js              # Main app with company routes
```

### Frontend Structure
```
src/frontend/src/
├── context/
│   ├── AuthContext.jsx     # User authentication
│   └── CompanyContext.jsx  # NEW: Selected company
├── pages/
│   ├── Login.jsx          # NEW
│   ├── Signup.jsx         # NEW
│   ├── ForgotPassword.jsx # NEW
│   ├── CompanySelection.jsx # NEW
│   ├── SectionSelection.jsx # NEW
│   └── Dashboard.jsx      # NEW: Main landing after login
├── components/
│   └── ProtectedRoute.jsx # NEW
└── App.jsx                # Updated routing
```

---

## 🗄️ Database Schema Updates

### Master Database (u971268451_Billing_System)
Add to `users` table:
```sql
ALTER TABLE users 
ADD COLUMN default_company_id INT DEFAULT 1,
ADD COLUMN allowed_companies JSON DEFAULT '["1","2","3"]';
```

### Company Mapping Table
```sql
CREATE TABLE companies (
  company_id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(200) NOT NULL,
  database_name VARCHAR(100) NOT NULL,
  database_user VARCHAR(100) NOT NULL,
  logo_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO companies VALUES
(1, 'RK Casting and Engineering Works', 'u971268451_Billing_System', 'u971268451_billing_system', NULL, TRUE),
(2, 'RKCASTING ENGINEERING PVT. LTD.', 'u971268451_GlobalBilling', 'u971268451_global_billing', NULL, TRUE),
(3, 'Global Bharat', 'u971268451_RkWorkBilling', 'u971268451_work_billing', NULL, TRUE);
```

---

## 🔄 User Flow

```
1. User visits app → Login page
2. Enter credentials → JWT token received
3. Redirect to Company Selection
4. Select company (1, 2, or 3)
5. Store company_id in context + localStorage
6. Choose section: Analytics OR Invoice
7. Backend uses company_id to connect to correct DB
8. All subsequent API calls include company context
```

---

## 🎨 UI Improvements

### Design System
- **Color Palette**: Professional gradients
- **Typography**: Modern fonts (Inter, Poppins)
- **Animations**: Smooth transitions, micro-interactions
- **Icons**: Lucide React for consistency
- **Theme**: Dark mode support

### Components to Enhance
- Company cards with hover effects
- Loading states with skeletons
- Error boundaries
- Toast notifications
- Breadcrumb navigation

---

## 🔐 Security Considerations

1. **JWT Tokens** include `company_id`
2. **Validate company access** - Check user.allowed_companies
3. **SQL Injection** - Parameterized queries only
4. **CORS** - Whitelist frontend origin
5. **Rate Limiting** - Prevent brute force

---

## 📝 Implementation Order

### Phase 1: Authentication (2-3 hours)
1. Create Login/Signup/Reset pages
2. Implement AuthContext
3. Protected routes
4. JWT integration

### Phase 2: Multi-DB Setup (1-2 hours)
1. Create DatabaseManager
2. Update db.js
3. Add company configuration
4. Test connections

### Phase 3: Company Selection (1-2 hours)
1. Create CompanySelection page
2. Create CompanyContext
3. Section selection
4. Navigation flow

### Phase 4: Integration (2-3 hours)
1. Connect Analytics to dynamic DB
2. Connect Invoice to dynamic DB
3. Test all companies
4. Fix bugs

### Phase 5: UI Polish (1-2 hours)
1. Professional styling
2. Animations
3. Error handling
4. Testing

**Total Estimated Time**: 7-12 hours

---

Made for RK Casting Multi-Company System  
Date: February 4, 2026
