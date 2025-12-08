import { useEffect } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import { useTokenManagement } from "@/hooks/useTokenManagement";
import type { OidcConfig } from "@/types/auth";

const mockOidcConfig: OidcConfig = {
  issuer: "",
  clientId: "",
  redirectUri: `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};



export function DashboardPage() {
  const auth = useAuthContext();
  const oidcAuth = useOidcAuth(mockOidcConfig);
  const tokenStatus = useTokenManagement(mockOidcConfig);

  useEffect(() => {
    if (auth.tokens?.access_token && !auth.userInfo) {
      if (auth.authMethod === "oidc") {
        oidcAuth.fetchUserInfo().catch(console.error);
      }
    }
  }, [auth.tokens, auth.userInfo, auth.authMethod, oidcAuth]);

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", color: "#1e293b" }}>Welcome to Your Dashboard</h1>

      {auth.isLoading && (
        <div
          style={{
            background: "#dbeafe",
            color: "#1e40af",
            border: "1px solid #93c5fd",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "1.5rem",
          }}>
          Loading user information...
        </div>
      )}

      {auth.error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "1.5rem",
          }}>
          Error: {auth.error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}>
        {/* User Profile Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
          <h2 style={{ marginBottom: "1.5rem", color: "#1e293b", fontSize: "1.25rem" }}>
            👤 User Profile
          </h2>
          {auth.userInfo ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              {auth.userInfo.email && (
                <div>
                  <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                    Email
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#1e293b", fontWeight: 500 }}>
                    {auth.userInfo.email}
                  </p>
                </div>
              )}
              {auth.userInfo.given_name && (
                <div>
                  <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                    First Name
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#1e293b", fontWeight: 500 }}>
                    {auth.userInfo.given_name}
                  </p>
                </div>
              )}
              {auth.userInfo.family_name && (
                <div>
                  <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                    Last Name
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#1e293b", fontWeight: 500 }}>
                    {auth.userInfo.family_name}
                  </p>
                </div>
              )}
              {auth.userInfo.preferred_username && (
                <div>
                  <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                    Username
                  </label>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#1e293b", fontWeight: 500 }}>
                    {auth.userInfo.preferred_username}
                  </p>
                </div>
              )}
              {auth.userInfo.sub && (
                <div>
                  <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                    User ID
                  </label>
                  <p
                    style={{
                      margin: "0.25rem 0 0 0",
                      color: "#1e293b",
                      fontWeight: 500,
                      fontSize: "0.85rem",
                      wordBreak: "break-all",
                    }}>
                    {auth.userInfo.sub}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "#64748b" }}>
              No user information loaded. Click the button below to fetch.
            </p>
          )}
          {auth.authMethod === "oidc" && !auth.userInfo && (
            <button
              onClick={() => oidcAuth.fetchUserInfo()}
              disabled={auth.isLoading}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "#667eea",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                opacity: auth.isLoading ? 0.7 : 1,
              }}>
              {auth.isLoading ? "Loading..." : "Fetch User Info"}
            </button>
          )}
        </div>

        {/* Authentication Details Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}>
          <h2 style={{ marginBottom: "1.5rem", color: "#1e293b", fontSize: "1.25rem" }}>
            🔐 Authentication Details
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                Authentication Method
              </label>
              <p style={{ margin: "0.25rem 0 0 0", color: "#1e293b", fontWeight: 500 }}>
                {auth.authMethod?.toUpperCase() || "Unknown"}
              </p>
            </div>
            <div>
              <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                Status
              </label>
              <div
                style={{
                  marginTop: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: auth.isAuthenticated ? "#10b981" : "#ef4444",
                  }}
                />
                <span style={{ color: "#1e293b", fontWeight: 500 }}>
                  {auth.isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </span>
              </div>
            </div>
            {auth.tokens?.access_token && (
              <div>
                <label style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>
                  Access Token Expires In
                </label>
                <p style={{ margin: "0.25rem 0 0 0", color: "#1e293b", fontWeight: 500 }}>
                  {auth.tokens?.expires_in
                    ? `${Math.round(auth.tokens.expires_in / 60)} minutes`
                    : "Unknown"}
                </p>
              </div>
            )}
            {auth.tokens?.refresh_token && (
              <button
                onClick={async () => {
                  if (auth.authMethod === "oidc") {
                    try {
                      await oidcAuth.refreshToken();
                    } catch (err) {
                      console.error("Token refresh failed:", err);
                    }
                  }
                }}
                disabled={auth.isLoading}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  opacity: auth.isLoading ? 0.7 : 1,
                }}>
                {auth.isLoading ? "Refreshing..." : "Refresh Token"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Token Status & Management */}
      {auth.tokens && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "1.5rem",
            marginBottom: "2rem",
          }}>
          <h2 style={{ marginBottom: "1.5rem", color: "#1e293b", fontSize: "1.25rem" }}>
            ⏱️ Token Status
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "1rem",
              }}>
              <label style={{ display: "block", color: "#16a34a", fontSize: "0.85rem" }}>
                Access Token
              </label>
              <p
                style={{
                  margin: "0.5rem 0 0 0",
                  color: "#15803d",
                  fontWeight: 600,
                  fontSize: "1rem",
                }}>
                {tokenStatus.isAccessExpired ? "🔴 Expired" : "🟢 Valid"}
              </p>
              <p style={{ margin: "0.25rem 0 0 0", color: "#16a34a", fontSize: "0.85rem" }}>
                Expires: {tokenStatus.accessExpirationTime}
              </p>
            </div>

            {auth.tokens.refresh_token && (
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 8,
                  padding: "1rem",
                }}>
                <label style={{ display: "block", color: "#0369a1", fontSize: "0.85rem" }}>
                  Refresh Token
                </label>
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    color: "#075985",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}>
                  {tokenStatus.isRefreshExpired ? "🔴 Expired" : "🟢 Valid"}
                </p>
                <p style={{ margin: "0.25rem 0 0 0", color: "#0369a1", fontSize: "0.85rem" }}>
                  Expires: {tokenStatus.refreshExpirationTime}
                </p>
              </div>
            )}
          </div>

          {tokenStatus.needsRefresh && auth.authMethod === "oidc" && (
            <div
              style={{
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fcd34d",
                borderRadius: 8,
                padding: "1rem",
                marginTop: "1rem",
              }}>
              ⚠️ Token will be automatically refreshed shortly.
            </div>
          )}
        </div>
      )}

      {/* Token Details (Dev View) */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "1.5rem",
        }}>
        <h2 style={{ marginBottom: "1rem", color: "#1e293b", fontSize: "1.25rem" }}>
          📋 Token Details
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
          For detailed token management and inspection, visit the{" "}
          <a href="/tokens" style={{ color: "#667eea", textDecoration: "none", fontWeight: 500 }}>
            Tokens page
          </a>
        </p>
        <details style={{ cursor: "pointer" }}>
          <summary style={{ color: "#667eea", fontWeight: 500 }}>
            View Full Token Data (Dev)
          </summary>
          <pre
            style={{
              background: "#fff",
              padding: "1rem",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              overflow: "auto",
              maxHeight: 300,
              fontSize: "0.75rem",
              marginTop: "1rem",
            }}>
            {JSON.stringify(auth.tokens, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
