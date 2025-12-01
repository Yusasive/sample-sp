// import { useEffect } from "react";
import "./App.css";
import { AuthProvider } from "@/context/AuthContext";
import { Routes, Route, Link } from "react-router-dom";
import OidcDemoPage from "@/pages/OidcDemoPage";
import SamlDemoPage from "@/pages/SamlDemoPage";

function AppContent() {
  return (
    <div className="container" style={{ maxWidth: "100%", margin: 0, padding: "1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Que-ID Service Provider Demo</h1>
      <nav style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Link to="/oidc" style={{ marginRight: "2rem" }}>
          OIDC Demo
        </Link>
        <Link to="/saml">SAML Demo</Link>
      </nav>
      <Routes>
        <Route path="/oidc" element={<OidcDemoPage />} />
        <Route path="/saml" element={<SamlDemoPage />} />
        <Route path="*" element={<div style={{ textAlign: "center" }}>Select a demo above.</div>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
