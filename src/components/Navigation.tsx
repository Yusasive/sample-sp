import { Link } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useLogout } from "@/hooks/useLogout";
import type { OidcConfig, SamlConfig } from "@/types/auth";

const mockOidcConfig: OidcConfig = {
  issuer: "",
  clientId: "",
  redirectUri: `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

const mockSamlConfig: SamlConfig = {
  entityId: `${window.location.origin}/saml/metadata`,
  acsUrl: `${window.location.origin}/saml/acs`,
};

export function Navigation() {
  const auth = useAuthContext();
  const { logout, isLoading } = useLogout(mockOidcConfig, mockSamlConfig);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout({ showConfirmation: false });
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <nav
      style={{
        background: "#1e293b",
        color: "#fff",
        padding: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <Link
          to="/dashboard"
          style={{ color: "#fff", textDecoration: "none", fontSize: "1.2rem", fontWeight: "bold" }}>
          Que-ID SP
        </Link>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link
            to="/dashboard"
            style={{ color: "#e2e8f0", textDecoration: "none", transition: "color 0.2s" }}>
            Dashboard
          </Link>
          <Link
            to="/profile"
            style={{ color: "#e2e8f0", textDecoration: "none", transition: "color 0.2s" }}>
            Profile
          </Link>
          <Link
            to="/tokens"
            style={{ color: "#e2e8f0", textDecoration: "none", transition: "color 0.2s" }}>
            Tokens
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
          {auth.userInfo?.email || auth.userInfo?.sub || "User"}
        </span>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "0.5rem 1rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            opacity: isLoading ? 0.7 : 1,
          }}>
          {isLoading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </nav>
  );
}
