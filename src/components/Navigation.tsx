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
    <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
      <div className="flex gap-8 items-center">
        <Link
          to="/dashboard"
          className="text-white no-underline text-xl font-bold hover:text-slate-200 transition-colors">
          Que-ID SP
        </Link>
        <div className="flex gap-6">
          <Link
            to="/dashboard"
            className="text-slate-200 no-underline transition-colors hover:text-white">
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="text-slate-200 no-underline transition-colors hover:text-white">
            Profile
          </Link>
          <Link
            to="/tokens"
            className="text-slate-200 no-underline transition-colors hover:text-white">
            Tokens
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-300">
          {auth.userInfo?.email || auth.userInfo?.sub || "User"}
        </span>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="bg-red-500 text-white border-none rounded px-4 py-2 cursor-pointer text-sm hover:bg-red-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
          {isLoading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </nav>
  );
}
