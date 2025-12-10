import { useState, useEffect } from "react";
import type { OidcConfig, SamlConfig } from "@/types/auth";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import { useSamlAuth } from "@/hooks/useSamlAuth";

const getApiIssuer = (issuer: string) =>
  issuer.includes("/api/") ? issuer : issuer.replace("://uni-que.id/", "://uni-que.id/api/");
const DEFAULT_OIDC_CONFIG: OidcConfig = {
  issuer: getApiIssuer(import.meta.env.VITE_OIDC_ISSUER_URL || ""),
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirectUri:
    import.meta.env.VITE_OIDC_REDIRECT_URI &&
    import.meta.env.VITE_OIDC_REDIRECT_URI.endsWith("/callback")
      ? import.meta.env.VITE_OIDC_REDIRECT_URI
      : `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

const DEFAULT_SAML_CONFIG: SamlConfig = {
  entityId: import.meta.env.VITE_SAML_ENTITY_ID || `${window.location.origin}/saml/metadata`,
  acsUrl: import.meta.env.VITE_SAML_ACS_URL || `${window.location.origin}/saml/acs`,
  spName: import.meta.env.VITE_SAML_SP_NAME || "Que-ID Service Provider",
  nameIdFormat:
    import.meta.env.VITE_SAML_NAMEID_FORMAT ||
    "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  idpSsoUrl: import.meta.env.VITE_SAML_IDP_SSO_URL || "",
  idpSloUrl: import.meta.env.VITE_SAML_IDP_SLO_URL || "",
};

export function LoginPage() {
  // Debug log to verify .env values
  console.log("OIDC ENV CONFIG:", {
    issuer: getApiIssuer(import.meta.env.VITE_OIDC_ISSUER_URL || ""),
    clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
    redirectUri:
      import.meta.env.VITE_OIDC_REDIRECT_URI &&
      import.meta.env.VITE_OIDC_REDIRECT_URI.endsWith("/callback")
        ? import.meta.env.VITE_OIDC_REDIRECT_URI
        : `${window.location.origin}/callback`,
  });
  const auth = useAuthContext();
  const [authMethod, setAuthMethod] = useState<"oidc" | "saml" | null>(null);
  const [oidcConfig] = useState(DEFAULT_OIDC_CONFIG);
  const [samlConfig] = useState(DEFAULT_SAML_CONFIG);
  const [error, setError] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

  // On mount, check if a PKCE login is already in progress in any tab
  // and listen for changes across tabs
  useEffect(() => {
    const checkVerifier = () => {
      const existingVerifier = window.localStorage.getItem("queid_sp_pkce_verifier");
      setLoginInProgress(!!existingVerifier);
    };
    checkVerifier();
    window.addEventListener("storage", checkVerifier);
    return () => {
      window.removeEventListener("storage", checkVerifier);
    };
  }, []);

  const oidcAuth = useOidcAuth(oidcConfig);
  const samlAuth = useSamlAuth(samlConfig);

  const handleOidcLogin = async () => {
    setError("");
    // Block login if a PKCE login is already in progress in any tab
    if (loginInProgress) {
      setError(
        "A login is already in progress in this browser. Please complete it or clear your browser storage before starting a new login.",
      );
      return;
    }
    if (!oidcConfig.issuer || !oidcConfig.clientId) {
      setError("Please fill in Issuer URL and Client ID");
      return;
    }
    try {
      await oidcAuth.startLogin();
      // Debug: Confirm PKCE verifier is set in storage
      const pkceVerifier = window.localStorage.getItem("queid_sp_pkce_verifier");
      console.log("PKCE verifier after startLogin:", pkceVerifier);
    } catch (err) {
      setError((err as Error).message || "OIDC login failed");
    }
  };

  const handleSamlLogin = () => {
    setError("");
    if (!samlConfig.idpSsoUrl) {
      setError("Please fill in IdP SSO URL");
      return;
    }
    try {
      samlAuth.startLogin(samlConfig.idpSsoUrl);
    } catch (err) {
      setError((err as Error).message || "SAML login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: "2.5rem",
          maxWidth: 500,
          width: "100%",
        }}>
        <h1 style={{ textAlign: "center", marginBottom: "0.5rem", color: "#1e293b" }}>
          Que-ID Login
        </h1>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: "2rem" }}>
          Select your authentication method
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              borderRadius: 6,
              padding: "1rem",
              marginBottom: "1.5rem",
            }}>
            {error}
          </div>
        )}
        {auth.isLoading && (
          <div style={{ textAlign: "center", marginBottom: "1.5rem", color: "#64748b" }}>
            Processing...
          </div>
        )}

        {!authMethod ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            <button
              onClick={() => setAuthMethod("oidc")}
              style={{
                padding: "1.2rem",
                border: "2px solid #e2e8f0",
                borderRadius: 8,
                background: "#f8fafc",
                cursor: "pointer",
                color: "#111",
                transition: "all 0.2s",
                fontSize: "1rem",
                fontWeight: 500,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.background = "#ede9fe";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "#f8fafc";
              }}>
              🔐 Login with OIDC
            </button>
            <button
              onClick={() => setAuthMethod("saml")}
              style={{
                padding: "1.2rem",
                border: "2px solid #e2e8f0",
                borderRadius: 8,
                background: "#f8fafc",
                color: "#111",
                cursor: "pointer",
                transition: "all 0.2s",
                fontSize: "1rem",
                fontWeight: 500,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#764ba2";
                e.currentTarget.style.background = "#faf5ff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "#f8fafc";
              }}>
              🛡️ Login with SAML
            </button>
          </div>
        ) : authMethod === "oidc" ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            <button
              onClick={handleOidcLogin}
              disabled={auth.isLoading}
              style={{
                padding: "1.2rem",
                background: "#667eea",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
                opacity: auth.isLoading ? 0.7 : 1,
                fontSize: "1rem",
              }}>
              {auth.isLoading ? "Processing..." : "Login with OIDC"}
            </button>
            <button
              onClick={() => setAuthMethod(null)}
              style={{
                padding: "1.2rem",
                background: "#e2e8f0",
                color: "#1e293b",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "1rem",
              }}>
              Back
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            <button
              onClick={handleSamlLogin}
              disabled={auth.isLoading}
              style={{
                padding: "1.2rem",
                background: "#764ba2",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
                opacity: auth.isLoading ? 0.7 : 1,
                fontSize: "1rem",
              }}>
              {auth.isLoading ? "Processing..." : "Login with SAML"}
            </button>
            <button
              onClick={() => setAuthMethod(null)}
              style={{
                padding: "1.2rem",
                background: "#e2e8f0",
                color: "#1e293b",
                border: "none",
                borderRadius: 8,
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "1rem",
              }}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
