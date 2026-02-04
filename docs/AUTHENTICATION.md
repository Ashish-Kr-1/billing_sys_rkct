# 🔐 Authentication System - Integration Guide

## Overview
JWT-based authentication system with role-based access control (RBAC) for the billing system.

---

## 📦 Installation

The required packages are already installed:
```bash
npm install bcrypt jsonwebtoken
```

---

## ⚙️ Environment Configuration

Add these to your `.env` file:

```env
# JWT Authentication
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=24h
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🗂️ Database Tables

The authentication system uses these tables (already in schema.sql):

### `users` table
- Stores user accounts with bcrypt-hashed passwords
- Roles: `admin`, `manager`, `accountant`, `viewer`

### `sessions` table  
- Stores active JWT tokens
- Tracks IP address and user agent
- Auto-expiration with `expires_at` field

### `audit_log` table
- Logs all authentication events
- Tracks login/logout activity

---

## 🛠️ Integration with Existing Backend

### Step 1: Update `app.js` imports

Add at the top of `src/backend/app/app.js`:

```javascript
import { authenticateUser, requireRole, optionalAuth } from '../middleware/auth.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  changePassword
} from '../controllers/authController.js';
```

### Step 2: Add authentication routes

Add before your existing routes:

```javascript
// ============================================================
// AUTHENTICATION ROUTES
// ============================================================
const authRouter = express.Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);
authRouter.get('/me', authenticateUser, getCurrentUser);
authRouter.post('/change-password', authenticateUser, changePassword);

app.use('/auth', authRouter);
```

### Step 3: Protect existing routes (optional)

You can protect routes by adding middleware:

```javascript
// Require authentication for all routes
app.use('/createInvoice', authenticateUser, routerTransaction);

// Require specific role
app.use('/createParty', authenticateUser, requireRole('admin', 'manager'), router);

// Optional auth (allows both authenticated and anonymous)
app.use('/ledger', optionalAuth, routerLedger);
```

---

## 📡 API Endpoints

### Base URL
`http://localhost:5000/auth`

### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe",
  "role": "accountant"
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "accountant"
  }
}
```

### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "accountant"
  }
}
```

### 3. Get Current User
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** (200 OK)
```json
{
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "accountant",
    "last_login": "2026-02-04T10:30:00.000Z",
    "created_at": "2026-02-01T08:00:00.000Z"
  }
}
```

### 4. Logout
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 5. Change Password
```http
POST /auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "current_password": "OldPassword123",
  "new_password": "NewSecurePassword456"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

---

## 🎨 Frontend Integration (React)

### Step 1: Create Auth Context

Create `src/frontend/src/context/AuthContext.jsx`:

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE } from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Step 2: Wrap App with AuthProvider

Update `src/frontend/src/main.jsx`:

```javascript
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### Step 3: Create Login Page

Create `src/frontend/src/Login.jsx`:

```javascript
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username or Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded mb-4"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Step 4: Protect Routes

Update `src/frontend/src/components/ProtectedRoute.jsx`:

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireRole && !requireRole.includes(user.role)) {
    return <div>Access Denied</div>;
  }

  return children;
}
```

### Step 5: Make Authenticated API Calls

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { token } = useAuth();

  const fetchData = async () => {
    const res = await fetch(`${API_BASE}/createInvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ /* ... */ })
    });
    // ...
  };
}
```

---

## 🔒 Role-Based Access Control (RBAC)

### Roles Hierarchy
1. **admin** - Full system access
2. **manager** - Can create/edit parties, items, invoices
3. **accountant** - Can create invoices, record payments
4. **viewer** - Read-only access

### Example Protection

```javascript
// Backend: Only admin and manager can create parties
app.use('/createParty', authenticateUser, requireRole('admin', 'manager'), router);

// Frontend: Conditional rendering
{user.role === 'admin' && <button>Delete</button>}
```

---

## ✅ Testing the Authentication

### 1. Create Default Admin
The database already has a default admin account:
- **Username**: `admin`
- **Email**: `admin@rkcasting.in`
- **Password**: `admin123` (change immediately!)

### 2. Test with cURL

```bash
# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get current user (replace TOKEN with the token from login response)
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 🛡️ Security Best Practices

✅ **Implemented:**
- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Session tracking with expiration
- Role-based access control
- HTTP-only approach (store JWT in httpOnly cookies for production)

⚠️ **Recommended Additions:**
- Add rate limiting for login attempts
- Implement refresh tokens
- Add 2FA (Two-Factor Authentication)
- Set up HTTPS in production
- Use httpOnly cookies instead of localStorage

---

## 📝 Migration Notes

When deploying to production:

1. Generate a strong JWT secret
2. Change the default admin password
3. Create user accounts for your team
4. Enable HTTPS
5. Consider adding rate limiting

---

## 🐛 Troubleshooting

### "Invalid or expired token"
- Token might have expired (default: 24h)
- JWT_SECRET might have changed
- User needs to login again

### "Insufficient permissions"
- User role doesn't match required role
- Check user permissions in database

### "User not found"
- Session expired or user deleted
- Clear localStorage and login again

---

Made with 🔒 for R.K Casting Billing System
