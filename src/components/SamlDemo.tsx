import { useState, useEffect } from "react";
import type { SamlConfig } from "@/types/auth";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useSamlAuth } from "@/hooks/useSamlAuth";

const defaultConfig: SamlConfig = {
  spName: import.meta.env.VITE_SAML_SP_NAME || "",
  entityId: import.meta.env.VITE_SAML_ENTITY_ID || "",
  acsUrl: import.meta.env.VITE_SAML_ACS_URL || "",
  nameIdFormat: import.meta.env.VITE_SAML_NAMEID_FORMAT || "",
  sloUrl: import.meta.env.VITE_SAML_SLO_URL || "",
  sloBinding: import.meta.env.VITE_SAML_SLO_BINDING || "",
  idpSsoUrl: import.meta.env.VITE_SAML_IDP_SSO_URL || "",
  idpSloUrl: import.meta.env.VITE_SAML_IDP_SLO_URL || "",
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

      {/* Config form removed: always use .env values, never show config UI */}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={handleStartLogin}
          disabled={auth.isLoading || !samlAuth.isConfigured || !config.idpSsoUrl}
          style={{
            background: "#2563eb",
            color: "#111",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            opacity: auth.isLoading || !config.idpSsoUrl ? 0.7 : 1,
            fontSize: "0.95rem",
            fontWeight: 700,
            textShadow: "none",
            letterSpacing: 0.5,
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
          {/* Hide config form if all required values are present from .env */}
          {!(config.spName && config.entityId && config.acsUrl && config.idpSsoUrl) && (
            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              {/* ...existing config form fields... */}
            </div>
          )}
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
