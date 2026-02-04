import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CompanyProvider } from "./context/CompanyContext.jsx";

// Auth Pages
import Login from "./pages/Login.jsx";
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
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/select-company" element={<CompanySelection />} />
            <Route path="/select-section" element={<SectionSelection />} />

            {/* Existing Routes - TODO: Add protection later */}
            <Route path='/' element={<Landing_page />} />
            <Route path='/Quotation' element={<Quotation />} />
            <Route path='/Create_Party' element={<Create_Party />} />
            <Route path='/Invoice' element={<Invoice />} />
            <Route path='/Preview' element={<Preview />} />
            <Route path='/Ledger' element={<Ledger />} />
            <Route path='/Analytics' element={<Analytics />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  )
}

export default App;
