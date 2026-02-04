import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CompanyProvider } from "./context/CompanyContext.jsx";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute.jsx";

// Auth Pages
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import CompanySelection from "./pages/CompanySelection.jsx";
import SectionSelection from "./pages/SectionSelection.jsx";

// Existing Pages
import Landing_page from "./LandingPage.jsx";
import Create_Party from "./Create_Party.jsx";
import Invoice from "./Invoice.jsx";
import Preview from "./Preview.jsx";
import Ledger from "./Ledger.jsx";
import Analytics from "./Analytics.jsx";
import Quotation from "./Quotation.jsx";

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes - Redirect to company selection if already logged in */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Protected Auth Flow Routes */}
            <Route
              path="/select-company"
              element={
                <ProtectedRoute>
                  <CompanySelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/select-section"
              element={
                <ProtectedRoute>
                  <SectionSelection />
                </ProtectedRoute>
              }
            />

            {/* Protected Application Routes */}
            <Route
              path='/Invoice'
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />
            <Route
              path='/Analytics'
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path='/Quotation'
              element={
                <ProtectedRoute>
                  <Quotation />
                </ProtectedRoute>
              }
            />
            <Route
              path='/Create_Party'
              element={
                <ProtectedRoute>
                  <Create_Party />
                </ProtectedRoute>
              }
            />
            <Route
              path='/Preview'
              element={
                <ProtectedRoute>
                  <Preview />
                </ProtectedRoute>
              }
            />
            <Route
              path='/Ledger'
              element={
                <ProtectedRoute>
                  <Ledger />
                </ProtectedRoute>
              }
            />

            {/* Root redirect */}
            <Route path='/' element={<Navigate to="/login" replace />} />

            {/* Catch all - redirect to login */}
            <Route path='*' element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  )
}

export default App;
