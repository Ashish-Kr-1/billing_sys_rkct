import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing_page from "./LandingPage.jsx";
import Create_Party from "./Create_Party.jsx";
import Invoice from "./Invoice.jsx";
import Preview from "./Preview.jsx";
import Ledger from "./Ledger.jsx";
import Outstanding from "./Outstanding.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTE (LOGIN) */}
        <Route path="/" element={<Landing_page />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/Create_Party"
          element={
            <ProtectedRoute>
              <Create_Party />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Invoice"
          element={
            <ProtectedRoute>
              <Invoice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Preview"
          element={
            <ProtectedRoute>
              <Preview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Ledger"
          element={
            <ProtectedRoute>
              <Ledger />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Outstanding"
          element={
            <ProtectedRoute>
              <Outstanding />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
