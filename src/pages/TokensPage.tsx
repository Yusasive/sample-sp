import { useState } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import { decodeJwt, maskToken, formatTokenExpirationTime, getTokenExpiresIn } from "@/utils/token";
import type { OidcConfig } from "@/types/auth";

const mockOidcConfig: OidcConfig = {
  issuer: "",
  clientId: "",
  redirectUri: `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

function TokenCard({ title, token, type }: { title: string; token: string; type: string }) {
  const [expanded, setExpanded] = useState(false);
  const decoded = decodeJwt(token);
  const expiresIn = getTokenExpiresIn(token);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "1.5rem",
        marginBottom: "1rem",
        color: "#1e293b",
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}>
        <div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontWeight: 600 }}>{title}</h3>
          <p style={{ margin: 0, color: "#334155", fontSize: "0.85rem" }}>
            Type: {type} Expires in: {formatTokenExpirationTime(expiresIn)}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "#e2e8f0",
            border: "none",
            borderRadius: 4,
            padding: "0.5rem 1rem",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}>
          {expanded ? "Hide" : "Show"}
        </button>
      </div>

      {expanded && (
        <div>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "1rem",
              marginBottom: "1rem",
            }}>
            <p style={{ margin: "0 0 0.5rem 0", color: "#334155", fontSize: "0.85rem" }}>
              Token Value:
            </p>
            <code
              style={{
                display: "block",
                wordBreak: "break-all",
                color: "#1e293b",
                fontSize: "0.75rem",
                fontFamily: "monospace",
              }}>
              {maskToken(token, 20)}
            </code>
          </div>

          {decoded && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem 0", color: "#334155", fontSize: "0.85rem" }}>
                  Header:
                </p>
                <pre
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "0.75rem",
                    margin: 0,
                    overflow: "auto",
                    maxHeight: 150,
                    fontSize: "0.75rem",
                  }}>
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem 0", color: "#334155", fontSize: "0.85rem" }}>
                  Payload:
                </p>
                <pre
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "0.75rem",
                    margin: 0,
                    overflow: "auto",
                    maxHeight: 300,
                    fontSize: "0.75rem",
                  }}>
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TokensPage() {
  const auth = useAuthContext();
  const oidcAuth = useOidcAuth(mockOidcConfig);

  if (!auth.tokens) {
    return (
      <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: "2rem", color: "#1e293b", fontWeight: 700 }}>
          Token Management
        </h1>
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: "1.5rem",
            textAlign: "center",
          }}>
          <p style={{ margin: 0 }}>No tokens available. Please log in first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", color: "#1e293b", fontWeight: 700 }}>Token Management</h1>

      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            background: "#dbeafe",
            color: "#1e40af",
            border: "1px solid #93c5fd",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "1.5rem",
          }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            💡 View and manage your authentication tokens. Tokens are automatically refreshed when
            they expire.
          </p>
        </div>
      </div>

      {auth.tokens.access_token && (
        <TokenCard
          title="Access Token"
          token={auth.tokens.access_token}
          type={auth.tokens.token_type || "Bearer"}
        />
      )}

      {auth.tokens.id_token && (
        <TokenCard
          title="ID Token"
          token={auth.tokens.id_token}
          type={auth.tokens.token_type || "Bearer"}
        />
      )}

      {auth.tokens.refresh_token && (
        <TokenCard
          title="Refresh Token"
          token={auth.tokens.refresh_token}
          type={auth.tokens.token_type || "Bearer"}
        />
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "1.5rem",
          marginBottom: "1rem",
        }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "#1e293b", fontWeight: 600 }}>Token Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {auth.tokens.refresh_token && auth.authMethod === "oidc" && (
            <button
              onClick={async () => {
                try {
                  await oidcAuth.refreshToken();
                } catch (error) {
                  console.error("Token refresh failed:", error);
                }
              }}
              disabled={auth.isLoading}
              style={{
                background: "#fef3c7",
                color: "#92400e",
                border: "none",
                borderRadius: 6,
                padding: "0.75rem 1rem",
                cursor: "pointer",
                fontWeight: 600,
                opacity: auth.isLoading ? 0.7 : 1,
              }}>
              {auth.isLoading ? "Refreshing..." : "Refresh Tokens"}
            </button>
          )}

          {auth.tokens.refresh_token && auth.authMethod === "oidc" && (
            <button
              onClick={async () => {
                if (confirm("Are you sure you want to revoke the refresh token?")) {
                  try {
                    await oidcAuth.revokeToken("refresh_token");
                  } catch (error) {
                    console.error("Token revocation failed:", error);
                  }
                }
              }}
              disabled={auth.isLoading}
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border: "none",
                borderRadius: 6,
                padding: "0.75rem 1rem",
                cursor: "pointer",
                fontWeight: 600,
                opacity: auth.isLoading ? 0.7 : 1,
              }}>
              {auth.isLoading ? "Revoking..." : "Revoke Refresh Token"}
            </button>
          )}
        </div>
      </div>

      <details style={{ cursor: "pointer", marginTop: "1.5rem" }}>
        <summary style={{ color: "#4338ca", fontWeight: 600, marginBottom: "1rem" }}>
          View Raw Token Data (Dev)
        </summary>
        <pre
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            padding: "1rem",
            overflow: "auto",
            maxHeight: 300,
            fontSize: "0.75rem",
            marginTop: "1rem",
          }}>
          {JSON.stringify(auth.tokens, null, 2)}
        </pre>
      </details>
    </div>
  );
}
