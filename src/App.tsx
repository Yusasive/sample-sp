import { useEffect } from "react";
import "./App.css";
import { AuthProvider } from "@/context/AuthContext";
import { OidcDemo } from "@/components/OidcDemo";
import { SamlDemo } from "@/components/SamlDemo";

function AppContent() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="container" style={{ maxWidth: "100%", margin: 0, padding: "1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Que-ID Service Provider Demo</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div>
          <OidcDemo />
        </div>
        <div>
          <SamlDemo />
        </div>
      </div>
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
