import { useState, useEffect } from "react";
import type { SamlConfig } from "@/types/auth";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useSamlAuth } from "@/hooks/useSamlAuth";

const defaultConfig: SamlConfig = {
  spName: "Demo Service Provider",
  entityId: "urn:queid:sp:demo",
  acsUrl: `${window.location.origin}/saml/acs`,
  nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  sloUrl: `${window.location.origin}/saml/slo`,
  sloBinding: "REDIRECT",
  idpSsoUrl: "",
  idpSloUrl: "",
};

export function SamlDemo() {
  const auth = useAuthContext();
  const [config, setConfig] = useState<SamlConfig>(defaultConfig);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showAcsHandler, setShowAcsHandler] = useState(false);
  const [acsResponse, setAcsResponse] = useState("");
  const samlAuth = useSamlAuth(config);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const samlResponseParam = params.get("SAMLResponse");
    if (samlResponseParam && auth.authMethod === "saml") {
      try {
        samlAuth.handleAcsCallback(samlResponseParam);
      } catch (error) {
        console.error("SAML callback failed:", error);
      }
    }
  }, [auth.authMethod, samlAuth]);

  const handleGenerateMetadata = () => {
    try {
      const metadata = samlAuth.generateMetadata();
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/xml;charset=utf-8," + encodeURIComponent(metadata));
      element.setAttribute("download", "sp-metadata.xml");
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      auth.setError((error as Error).message);
    }
  };

  const handleStartLogin = () => {
    try {
      samlAuth.startLogin(config.idpSsoUrl);
    } catch (error) {
      auth.setError((error as Error).message);
    }
  };

  const handleTestAcsResponse = () => {
    if (!acsResponse.trim()) {
      auth.setError("Please enter a base64-encoded SAML response");
      return;
    }
    try {
      samlAuth.handleAcsCallback(acsResponse);
      setShowAcsHandler(false);
      setAcsResponse("");
    } catch (error) {
      auth.setError((error as Error).message);
    }
  };

  const handleStartLogout = () => {
    if (!auth.userInfo?.sub) {
      auth.setError("No user logged in");
      return;
    }
    try {
      const sessionIndex =
        localStorage.getItem("saml_session_index") || "session-index-placeholder";
      samlAuth.startLogout(sessionIndex, auth.userInfo.sub, config.idpSloUrl);
    } catch (error) {
      auth.setError((error as Error).message);
    }
  };

  return (
    <div
      style={{
        boxShadow: "0 2px 12px #e0e7ef",
        borderRadius: 12,
        background: "#f8fafc",
        padding: "2em",
      }}>
      <h2 style={{ color: "black" }}>SAML Configuration & Flow</h2>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            Service Provider Name
          </label>
          <input
            type="text"
            value={config.spName || ""}
            onChange={(e) => setConfig({ ...config, spName: e.target.value })}
            placeholder="Demo Service Provider"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            Entity ID
          </label>
          <input
            type="text"
            value={config.entityId}
            onChange={(e) => setConfig({ ...config, entityId: e.target.value })}
            placeholder="urn:queid:sp:demo"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            ACS URL
          </label>
          <input
            type="text"
            value={config.acsUrl}
            onChange={(e) => setConfig({ ...config, acsUrl: e.target.value })}
            placeholder="https://localhost:5173/saml/acs"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            IdP SSO URL
          </label>
          <input
            type="text"
            value={config.idpSsoUrl || ""}
            onChange={(e) => setConfig({ ...config, idpSsoUrl: e.target.value })}
            placeholder="https://idp.example.com/sso"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            IdP SLO URL (optional)
          </label>
          <input
            type="text"
            value={config.idpSloUrl || ""}
            onChange={(e) => setConfig({ ...config, idpSloUrl: e.target.value })}
            placeholder="https://idp.example.com/slo"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            SLO URL (optional)
          </label>
          <input
            type="text"
            value={config.sloUrl || ""}
            onChange={(e) => setConfig({ ...config, sloUrl: e.target.value })}
            placeholder="https://localhost:5173/saml/slo"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={handleStartLogin}
          disabled={auth.isLoading || !samlAuth.isConfigured || !config.idpSsoUrl}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            opacity: auth.isLoading || !config.idpSsoUrl ? 0.7 : 1,
            fontSize: "0.95rem",
          }}>
          {auth.isLoading ? "Starting..." : "Login with SAML"}
        </button>

        <button
          onClick={handleGenerateMetadata}
          disabled={!samlAuth.isConfigured}
          style={{
            background: "#8b5cf6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: "0.95rem",
          }}>
          Download Metadata
        </button>

        <button
          onClick={() => setShowMetadata(!showMetadata)}
          style={{
            background: "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: "0.95rem",
          }}>
          {showMetadata ? "Hide" : "Show"} Metadata
        </button>

        <button
          onClick={() => setShowAcsHandler(!showAcsHandler)}
          style={{
            background: "#06b6d4",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: "0.95rem",
          }}>
          {showAcsHandler ? "Hide" : "Test"} ACS Response
        </button>
      </div>

      {showMetadata && (
        <div style={{ marginBottom: "1.5rem", width: "100%", boxSizing: "border-box" }}>
          <h3>SP Metadata</h3>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <pre
              style={{
                background: "#fff",
                color: "#111",
                padding: "1rem",
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                overflow: "auto",
                maxHeight: "300px",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}>
              {samlAuth.generateMetadata()}
            </pre>
          </div>
        </div>
      )}

      {showAcsHandler && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3>Test ACS Response</h3>
          <textarea
            value={acsResponse}
            onChange={(e) => setAcsResponse(e.target.value)}
            placeholder="Paste base64-encoded SAML response here..."
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #ccc",
              minHeight: "100px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              onClick={handleTestAcsResponse}
              disabled={!acsResponse.trim()}
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}>
              Process Response
            </button>
            <button
              onClick={() => {
                setShowAcsHandler(false);
                setAcsResponse("");
              }}
              style={{
                background: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {auth.tokens && auth.authMethod === "saml" && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>Session</h3>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={handleStartLogout}
              disabled={auth.isLoading}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}>
              {auth.isLoading ? "Processing..." : "Logout"}
            </button>

            <button
              onClick={() => auth.logout()}
              style={{
                background: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}>
              Local Logout
            </button>
          </div>
        </div>
      )}

      {auth.userInfo && auth.authMethod === "saml" && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>User Info</h3>
          <pre
            style={{
              background: "#fff",
              padding: "1rem",
              borderRadius: 4,
              border: "1px solid #e5e7eb",
              overflow: "auto",
              maxHeight: "300px",
              fontSize: "0.85rem",
            }}>
            {JSON.stringify(auth.userInfo, null, 2)}
          </pre>
        </div>
      )}

      {auth.error && (
        <div
          style={{
            color: "#991b1b",
            marginTop: "1.5rem",
            border: "1px solid #fca5a5",
            padding: "1rem",
            borderRadius: 4,
            background: "#fee2e2",
          }}>
          <strong>Error:</strong> {auth.error}
          <button
            onClick={() => auth.setError(null)}
            style={{
              marginLeft: "1rem",
              background: "transparent",
              border: "none",
              color: "#991b1b",
              cursor: "pointer",
              textDecoration: "underline",
            }}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
