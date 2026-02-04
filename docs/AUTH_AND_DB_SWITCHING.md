# Authentication & Multi-Database System - Implementation Guide

## Overview
This billing system now supports complete authentication with multi-company database switching. Users can log in, select a company, and all API requests automatically route to the correct database.

## Authentication Flow

```
Login → Company Selection → Section Selection → Invoice/Analytics
  ↓           ↓                    ↓                    ↓
Auth      Select DB          Choose Module      Work with Data
```

### 1. **Login/Signup** (`/login`, `/signup`)
- Users authenticate with username/password
- JWT token stored in localStorage
- Redirects to company selection on success

### 2. **Company Selection** (`/select-company`)
- Displays all available companies (RK Casting, RK Engineering, Global Bharat)
- User selects which company database to work with
- Selection stored in localStorage and CompanyContext

### 3. **Section Selection** (`/select-section`)
- Choose between Invoice Management or Analytics
- Maintains selected company context

### 4. **Protected Routes**
- All application routes require authentication
- Automatically redirect to login if not authenticated
- Company context persists across page refreshes

## Database Switching Mechanism

### Backend Implementation

The backend (`src/backend/app/app.js`) now includes middleware that:

```javascript
app.use((req, res, next) => {
  const companyId = req.headers['x-company-id'] || req.query.companyId;
  
  if (companyId) {
    req.db = dbManager.getPool(companyId);
    req.companyId = companyId;
  } else {
    // Default to Company 1
    req.db = dbManager.getPool(1);
    req.companyId = 1;
  }
  next();
});
```

**Key Points:**
- Reads `x-company-id` header from requests
- Dynamically selects the correct database pool
- Falls back to Company 1 if no header provided
- All route handlers use `req.db` instead of hardcoded `pool`

### Frontend Implementation

#### API Client (`src/frontend/src/config/apiClient.js`)

Automatically injects headers for all requests:

```javascript
import api from './config/apiClient';

// Automatically includes:
// - Authorization: Bearer <token>
// - x-company-id: <selected company id>

// Usage:
const data = await api.get('/parties');
const result = await api.post('/createParty', partyData);
```

**Features:**
- Reads selected company from localStorage
- Adds `x-company-id` header automatically
- Includes JWT token for authentication
- Centralized error handling

#### Company Context (`src/frontend/src/context/CompanyContext.jsx`)

Manages company selection state:

```javascript
const { selectedCompany, selectCompany, clearCompany } = useCompany();

// selectedCompany contains: { id, name, shortName, database }
```

## File Structure

```
src/
├── backend/
│   ├── app/
│   │   └── app.js              # Main server with DB switching middleware
│   ├── db.js                   # Multi-tenant database manager
│   ├── controllers/
│   │   ├── authController.js   # Login, signup, logout
│   │   ├── companyController.js # Company listing
│   │   └── analyticsController.js
│   └── routes/
│       └── index.js            # Route definitions
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx       # Login page
    │   │   ├── Signup.jsx      # Registration page
    │   │   ├── CompanySelection.jsx  # Company picker
    │   │   └── SectionSelection.jsx  # Module picker
    │   ├── context/
    │   │   ├── AuthContext.jsx       # Authentication state
    │   │   └── CompanyContext.jsx    # Company selection state
    │   ├── config/
    │   │   ├── api.js                # API base URL
    │   │   └── apiClient.js          # Enhanced fetch with headers
    │   ├── components/
    │   │   └── ProtectedRoute.jsx    # Route guards
    │   └── App.jsx                   # Main routing
```

## How to Use

### For Developers

#### 1. Making API Calls

**Old Way (Don't use):**
```javascript
const res = await fetch(`${API_BASE}/parties/${id}`);
const data = await res.json();
```

**New Way (Use this):**
```javascript
import api from './config/apiClient';

const data = await api.get(`/parties/${id}`);
```

The API client automatically:
- Adds the selected company ID header
- Includes authentication token
- Handles errors consistently

#### 2. Protecting Routes

```javascript
import { ProtectedRoute } from './components/ProtectedRoute';

<Route 
  path="/Invoice" 
  element={
    <ProtectedRoute>
      <Invoice />
    </ProtectedRoute>
  } 
/>
```

#### 3. Accessing Company Context

```javascript
import { useCompany } from '../context/CompanyContext';

function MyComponent() {
  const { selectedCompany } = useCompany();
  
  return <div>Working with: {selectedCompany.name}</div>;
}
```

### For Users

1. **Create Account**: Click "Create New Account" on login page
2. **Login**: Enter credentials
3. **Select Company**: Choose which company database to work with
4. **Select Module**: Choose Invoice Management or Analytics
5. **Work**: All data operations automatically use the selected company's database

## Database Configuration

Three companies are configured in `src/backend/db.js`:

| ID | Company Name | Database |
|----|-------------|----------|
| 1 | RK Casting and Engineering Works | u971268451_Billing_System |
| 2 | RKCASTING ENGINEERING PVT. LTD. | u971268451_GlobalBilling |
| 3 | Global Bharat | u971268451_RkWorkBilling |

## Security Features

✅ **JWT Authentication**: All protected routes require valid token  
✅ **Route Guards**: Automatic redirect for unauthorized access  
✅ **Database Isolation**: Each company's data is completely separate  
✅ **Token Refresh**: Auth state persists across page reloads  
✅ **Secure Headers**: CORS and Helmet protection enabled

## Testing the Flow

### Test Authentication:
1. Start backend: `cd src/backend && node app/app.js`
2. Start frontend: `cd src/frontend && npm run dev`
3. Visit `http://localhost:5174`
4. Create account → Login → Select Company → Access modules

### Test Database Switching:
1. Login and select Company 1
2. Create a party/invoice
3. Logout
4. Login again and select Company 2
5. Verify the party/invoice from Company 1 is NOT visible
6. Create new data in Company 2
7. Switch back to Company 1 - original data should still be there

## API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Companies
- `GET /companies` - List all companies
- `GET /companies/:id` - Get company details

### Business Operations (All require `x-company-id` header)
- `GET /parties` - List parties
- `POST /createParty` - Create party
- `GET /parties/:id` - Get party details
- `POST /createInvoice` - Create invoice
- `GET /ledger` - Get ledger data
- `GET /analytics/:companyId/data` - Get analytics

## Troubleshooting

**Issue**: API calls not hitting correct database  
**Solution**: Ensure you're using `api` client from `apiClient.js`, not raw `fetch`

**Issue**: Redirected to login after refresh  
**Solution**: Check if token exists in localStorage and is valid

**Issue**: Company selection not persisting  
**Solution**: Check browser localStorage for `selectedCompany` key

**Issue**: CORS errors  
**Solution**: Verify frontend URL is in `allowedOrigins` in `app.js`

## Environment Variables

### Backend (`.env`)
```env
PORT=5000
DB_HOST=srv687.hstgr.io
DB_PASSWORD=RKbilling@123
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5174
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

## Next Steps

- [ ] Add password reset functionality
- [ ] Implement role-based access control (Admin, User, Viewer)
- [ ] Add company-specific user permissions
- [ ] Implement audit logging for database switches
- [ ] Add session timeout handling
- [ ] Create admin panel for user management

---

**Built with**: React, Express, MySQL, JWT  
**Last Updated**: 2026-02-04
