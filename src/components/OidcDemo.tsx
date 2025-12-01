import { useState, useEffect } from "react";
import type { OidcConfig } from "@/types/auth";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";

const defaultConfig: OidcConfig = {
  issuer: "",
  clientId: "",
  redirectUri: "",
  scopes: [],
};

function getCodeFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("code") || "";
}

export function OidcDemo() {
  const auth = useAuthContext();
  const [config, setConfig] = useState<OidcConfig>(defaultConfig);
  const [code, setCode] = useState<string>(getCodeFromUrl());
  const oidcAuth = useOidcAuth(config);
  const [error, setError] = useState<string>("");
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (code) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      (async () => {
        try {
          auth.setAuthMethod("oidc");
          await oidcAuth.exchangeCode(code);
          setCode("");
        } catch (error) {
          console.error("Token exchange failed:", error);
        }
      })();
    }
  }, [code, oidcAuth, auth]);

  useEffect(() => {
    if (auth.tokens?.access_token && auth.authMethod === "oidc" && !auth.userInfo) {
      oidcAuth.fetchUserInfo().catch(console.error);
    }
  }, [auth.tokens, auth.authMethod, auth.userInfo, oidcAuth]);

  return (
    <div
      style={{
        boxShadow: "0 2px 12px #e0e7ef",
        borderRadius: 12,
        background: "#f8fafc",
        padding: "2em",
      }}>
      <h2 style={{ color: "black" }}>OIDC Configuration & Flow</h2>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            Issuer URL
          </label>
          <input
            type="text"
            value={config.issuer}
            onChange={(e) => {
              setConfig({ ...config, issuer: e.target.value });
              setError("");
            }}
            placeholder="https://api.que.id/oidc/acme"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            Client ID
          </label>
          <input
            type="text"
            value={config.clientId}
            onChange={(e) => {
              setConfig({ ...config, clientId: e.target.value });
              setError("");
            }}
            placeholder="app_xxxx"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            Client Secret (optional)
          </label>
          <input
            type="password"
            value={config.clientSecret || ""}
            onChange={(e) => {
              setConfig({ ...config, clientSecret: e.target.value || undefined });
              setError("");
            }}
            placeholder="for confidential clients"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            Redirect URI
          </label>
          <input
            type="text"
            value={config.redirectUri}
            onChange={(e) => {
              setConfig({ ...config, redirectUri: e.target.value });
              setError("");
            }}
            placeholder="https://localhost:5173"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#1e293b" }}>
            Scopes
          </label>
          <input
            type="text"
            value={config.scopes?.join(" ") || ""}
            onChange={(e) => {
              setConfig({ ...config, scopes: e.target.value.split(" ").filter(Boolean) });
              setError("");
            }}
            placeholder="openid profile email"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          onClick={async () => {
            // Validate required fields
            if (!config.issuer || !config.clientId || !config.redirectUri) {
              setError("Please fill in Issuer URL, Client ID, and Redirect URI.");
              return;
            }
            // Optionally, validate URL format
            try {
              new URL(config.issuer);
              new URL(config.redirectUri);
            } catch {
              setError("Issuer URL and Redirect URI must be valid URLs.");
              return;
            }
            setError("");
            setLocalLoading(true);
            try {
              await oidcAuth.startLogin();
            } finally {
              setLocalLoading(false);
            }
          }}
          disabled={localLoading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            opacity: localLoading ? 0.7 : 1,
          }}>
          {localLoading ? "Starting..." : "Login with OIDC"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#991b1b",
            marginTop: "1rem",
            border: "1px solid #fca5a5",
            padding: "1rem",
            borderRadius: 4,
            background: "#fee2e2",
          }}>
          <strong>Error:</strong> {error}
          <button
            style={{
              marginLeft: "1rem",
              background: "transparent",
              border: "none",
              color: "#991b1b",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}
      {auth.tokens && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>Tokens</h3>
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
            {JSON.stringify(auth.tokens, null, 2)}
          </pre>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              onClick={() => oidcAuth.fetchUserInfo()}
              disabled={auth.isLoading}
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}>
              {auth.isLoading ? "Loading..." : "Get User Info"}
            </button>

            {auth.tokens.refresh_token && (
              <button
                onClick={() => oidcAuth.refreshToken()}
                disabled={auth.isLoading}
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}>
                Refresh Token
              </button>
            )}

            <button
              onClick={() => auth.logout()}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}>
              Logout
            </button>
          </div>
        </div>
      )}

      {auth.userInfo && (
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
