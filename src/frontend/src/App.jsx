import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CompanyProvider } from "./context/CompanyContext.jsx";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

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

            {/* Protected Application Routes with Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path='/Invoice' element={<Invoice />} />
              <Route path='/Analytics' element={<Analytics />} />
              <Route path='/Quotation' element={<Quotation />} />
              <Route path='/Create_Party' element={<Create_Party />} />
              <Route path='/Preview' element={<Preview />} />
              <Route path='/Ledger' element={<Ledger />} />
            </Route>

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
