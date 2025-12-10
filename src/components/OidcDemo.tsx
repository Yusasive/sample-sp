import { useState, useEffect, useRef } from "react";
import type { OidcConfig } from "@/types/auth";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";

const getApiIssuer = (issuer: string) =>
  issuer.includes("/api/") ? issuer : issuer.replace("://uni-que.id/", "://uni-que.id/api/");
const defaultConfig: OidcConfig = {
  issuer: getApiIssuer(import.meta.env.VITE_OIDC_ISSUER_URL || ""),
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirectUri:
    import.meta.env.VITE_OIDC_REDIRECT_URI &&
    import.meta.env.VITE_OIDC_REDIRECT_URI.endsWith("/callback")
      ? import.meta.env.VITE_OIDC_REDIRECT_URI
      : `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

function getCodeFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("code") || "";
}

export function OidcDemo() {
  const auth = useAuthContext();
  const [config] = useState<OidcConfig>(defaultConfig);
  const [code, setCode] = useState<string>(getCodeFromUrl());
  const oidcAuth = useOidcAuth(config);
  const [error, setError] = useState<string>("");
  const errorTimeoutRef = useRef<number | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  // Store errorDetails as a string for safe rendering
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [code]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [error]);

  useEffect(() => {
    if (code) {
      (async () => {
        try {
          auth.setAuthMethod("oidc");
          await oidcAuth.exchangeCode(code);
          setCode("");
        } catch (error) {
          setError(
            "Token exchange failed: " + (error instanceof Error ? error.message : "Unknown error"),
          );
          let details: string;
          if (typeof error === "string") {
            details = error;
          } else if (error instanceof Error) {
            details = error.stack || error.message;
          } else if (typeof error === "object" && error !== null) {
            try {
              details = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
            } catch {
              details = "[Unable to display error details]";
            }
          } else {
            details = String(error);
          }
          setErrorDetails(details);
          console.error("Token exchange failed:", error);
          if (error instanceof Error) {
            auth.setError(error.message);
          } else if (typeof error === "object" && error && "message" in error) {
            auth.setError((error as { message: string }).message);
          } else {
            auth.setError("An unknown error occurred");
          }
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
        position: "relative",
        minHeight: "600px",
      }}>
      <h2 style={{ color: "black" }}>OIDC Configuration & Flow</h2>

      {/* Prominent error display at top */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            minWidth: 320,
            maxWidth: 480,
            background: "#fee2e2",
            color: "#991b1b",
            border: "2px solid #fca5a5",
            borderRadius: 8,
            boxShadow: "0 2px 8px #e0e7ef",
            padding: "1.2rem 1.5rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}>
          <span>
            <strong>Error:</strong> {error}
          </span>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "#991b1b",
              cursor: "pointer",
              textDecoration: "underline",
              fontWeight: 500,
              fontSize: "1rem",
            }}
            onClick={() => setError("")}
            aria-label="Dismiss error">
            Dismiss
          </button>
        </div>
      )}

      {/* Config form removed: always use .env values, never show config UI */}

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
            color: "#111",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            opacity: localLoading ? 0.7 : 1,
            fontWeight: 700,
            textShadow: "none",
            letterSpacing: 0.5,
          }}>
          {localLoading ? "Starting..." : "Login with OIDC"}
        </button>
        {/* Prominent error display at top with details */}
        {error && (
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              minWidth: 320,
              maxWidth: 480,
              background: "#fee2e2",
              color: "#991b1b",
              border: "2px solid #fca5a5",
              borderRadius: 8,
              boxShadow: "0 2px 8px #e0e7ef",
              padding: "1.2rem 1.5rem",
              fontWeight: 500,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <span>
                <strong>Error:</strong> {error}
              </span>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#991b1b",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 500,
                  fontSize: "1rem",
                }}
                onClick={() => {
                  setError("");
                  setErrorDetails(null);
                }}
                aria-label="Dismiss error">
                Dismiss
              </button>
            </div>
            {errorDetails && (
              <pre
                style={{
                  background: "#fff0f0",
                  color: "#991b1b",
                  borderRadius: 4,
                  border: "1px solid #fca5a5",
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                  maxHeight: 180,
                  overflow: "auto",
                  width: "100%",
                }}>
                {errorDetails}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* ...existing code... */}
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
