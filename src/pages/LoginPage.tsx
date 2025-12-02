import { useState } from "react";
import type { OidcConfig, SamlConfig } from "@/types/auth";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import { useSamlAuth } from "@/hooks/useSamlAuth";

const DEFAULT_OIDC_CONFIG: OidcConfig = {
  issuer: "",
  clientId: "",
  redirectUri: `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

const DEFAULT_SAML_CONFIG: SamlConfig = {
  entityId: `${window.location.origin}/saml/metadata`,
  acsUrl: `${window.location.origin}/saml/acs`,
  spName: "Que-ID Service Provider",
  nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
};

export function LoginPage() {
  const auth = useAuthContext();
  const [authMethod, setAuthMethod] = useState<"oidc" | "saml" | null>(null);
  const [oidcConfig, setOidcConfig] = useState(DEFAULT_OIDC_CONFIG);
  const [samlConfig, setSamlConfig] = useState(DEFAULT_SAML_CONFIG);
  const [error, setError] = useState("");

  const oidcAuth = useOidcAuth(oidcConfig);
  const samlAuth = useSamlAuth(samlConfig);

  const handleOidcLogin = async () => {
    setError("");
    if (!oidcConfig.issuer || !oidcConfig.clientId) {
      setError("Please fill in Issuer URL and Client ID");
      return;
    }
    try {
      await oidcAuth.startLogin();
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
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Issuer URL
              </label>
              <input
                type="text"
                value={oidcConfig.issuer}
                onChange={(e) => {
                  setOidcConfig({ ...oidcConfig, issuer: e.target.value });
                  setError("");
                }}
                placeholder="https://api.que.id/oidc/acme"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Client ID
              </label>
              <input
                type="text"
                value={oidcConfig.clientId}
                onChange={(e) => {
                  setOidcConfig({ ...oidcConfig, clientId: e.target.value });
                  setError("");
                }}
                placeholder="app_xxxx"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                Client Secret (optional)
              </label>
              <input
                type="password"
                value={oidcConfig.clientSecret || ""}
                onChange={(e) => {
                  setOidcConfig({
                    ...oidcConfig,
                    clientSecret: e.target.value || undefined,
                  });
                  setError("");
                }}
                placeholder="Leave empty for public clients"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                onClick={handleOidcLogin}
                disabled={auth.isLoading}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#667eea",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: auth.isLoading ? 0.7 : 1,
                }}>
                {auth.isLoading ? "Processing..." : "Login"}
              </button>
              <button
                onClick={() => setAuthMethod(null)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#e2e8f0",
                  color: "#1e293b",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 500,
                  cursor: "pointer",
                }}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                IdP SSO URL
              </label>
              <input
                type="text"
                value={samlConfig.idpSsoUrl || ""}
                onChange={(e) => {
                  setSamlConfig({ ...samlConfig, idpSsoUrl: e.target.value });
                  setError("");
                }}
                placeholder="https://idp.example.com/sso"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                IdP SLO URL (optional)
              </label>
              <input
                type="text"
                value={samlConfig.idpSloUrl || ""}
                onChange={(e) => {
                  setSamlConfig({ ...samlConfig, idpSloUrl: e.target.value });
                  setError("");
                }}
                placeholder="https://idp.example.com/slo"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                onClick={handleSamlLogin}
                disabled={auth.isLoading}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#764ba2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: auth.isLoading ? 0.7 : 1,
                }}>
                {auth.isLoading ? "Processing..." : "Login"}
              </button>
              <button
                onClick={() => setAuthMethod(null)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#e2e8f0",
                  color: "#1e293b",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 500,
                  cursor: "pointer",
                }}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
