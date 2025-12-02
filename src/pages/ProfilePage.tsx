import { useAuthContext } from "@/hooks/useAuthContext";

function InfoCard({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div style={{ paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
      <label
        style={{
          display: "block",
          color: "#64748b",
          fontSize: "0.85rem",
          marginBottom: "0.25rem",
        }}>
        {label}
      </label>
      <p style={{ margin: 0, color: "#1e293b", fontWeight: 500, wordBreak: "break-word" }}>
        {value}
      </p>
    </div>
  );
}

export function ProfilePage() {
  const auth = useAuthContext();

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem", color: "#1e293b" }}>Your Profile</h1>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
        {auth.userInfo ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            <InfoCard label="Email" value={auth.userInfo.email} />
            <InfoCard label="Full Name" value={auth.userInfo.name} />
            <InfoCard label="First Name" value={auth.userInfo.given_name} />
            <InfoCard label="Last Name" value={auth.userInfo.family_name} />
            <InfoCard label="Username" value={auth.userInfo.preferred_username} />
            <InfoCard label="User ID (Sub)" value={auth.userInfo.sub} />
            {auth.userInfo.email_verified !== undefined && (
              <div style={{ paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
                <label
                  style={{
                    display: "block",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    marginBottom: "0.25rem",
                  }}>
                  Email Verified
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: auth.userInfo.email_verified ? "#10b981" : "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}>
                    {auth.userInfo.email_verified ? "✓" : "✕"}
                  </div>
                  <span style={{ color: "#1e293b", fontWeight: 500 }}>
                    {auth.userInfo.email_verified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            )}

            <div
              style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "2px solid #e2e8f0" }}>
              <h3 style={{ color: "#1e293b", marginBottom: "1rem" }}>Additional Information</h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    Authentication Method:
                  </span>
                  <p style={{ margin: 0, color: "#1e293b", fontWeight: 500 }}>
                    {auth.authMethod?.toUpperCase() || "Unknown"}
                  </p>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Account Status:</span>
                  <p style={{ margin: 0, color: "#1e293b", fontWeight: 500 }}>
                    {auth.isAuthenticated ? "✓ Active" : "✕ Inactive"}
                  </p>
                </div>
              </div>
            </div>

            <details style={{ marginTop: "1.5rem", cursor: "pointer" }}>
              <summary style={{ color: "#667eea", fontWeight: 500 }}>
                View Raw User Data (Dev)
              </summary>
              <pre
                style={{
                  background: "#f8fafc",
                  padding: "1rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  overflow: "auto",
                  maxHeight: 300,
                  fontSize: "0.75rem",
                  marginTop: "1rem",
                }}>
                {JSON.stringify(auth.userInfo, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
            <p>No user profile information available.</p>
            <p style={{ fontSize: "0.9rem" }}>Please ensure you are logged in.</p>
          </div>
        )}
      </div>
    </div>
  );
}
