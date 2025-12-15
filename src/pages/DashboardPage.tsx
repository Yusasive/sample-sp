import { useEffect } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import { useTokenManagement } from "@/hooks/useTokenManagement";
import type { OidcConfig } from "@/types/auth";

const oidcConfig: OidcConfig = {
  issuer: import.meta.env.VITE_OIDC_ISSUER_URL || "",
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirectUri:
    import.meta.env.VITE_OIDC_REDIRECT_URI &&
    import.meta.env.VITE_OIDC_REDIRECT_URI.endsWith("/callback")
      ? import.meta.env.VITE_OIDC_REDIRECT_URI
      : `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

export function DashboardPage() {
  const auth = useAuthContext();
  const oidcAuth = useOidcAuth(oidcConfig);
  const tokenStatus = useTokenManagement(oidcConfig);

  useEffect(() => {
    if (auth.tokens?.access_token && !auth.userInfo) {
      if (auth.authMethod === "oidc") {
        oidcAuth.fetchUserInfo().catch(console.error);
      }
    }
  }, [auth.tokens, auth.userInfo, auth.authMethod, oidcAuth]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Welcome to Your Dashboard</h1>

      {auth.isLoading && (
        <div className="bg-blue-50 text-blue-900 border border-blue-300 rounded-lg p-4 mb-6">
          Loading user information...
        </div>
      )}

      {auth.error && (
        <div className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-4 mb-6">
          Error: {auth.error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">👤 User Profile</h2>
          {auth.userInfo ? (
            <div className="space-y-4">
              {auth.userInfo.email && (
                <div>
                  <label className="block text-slate-500 text-sm mb-1">Email</label>
                  <p className="text-slate-900 font-medium">{auth.userInfo.email}</p>
                </div>
              )}
              {auth.userInfo.given_name && (
                <div>
                  <label className="block text-slate-500 text-sm mb-1">First Name</label>
                  <p className="text-slate-900 font-medium">{auth.userInfo.given_name}</p>
                </div>
              )}
              {auth.userInfo.family_name && (
                <div>
                  <label className="block text-slate-500 text-sm mb-1">Last Name</label>
                  <p className="text-slate-900 font-medium">{auth.userInfo.family_name}</p>
                </div>
              )}
              {auth.userInfo.preferred_username && (
                <div>
                  <label className="block text-slate-500 text-sm mb-1">Username</label>
                  <p className="text-slate-900 font-medium">{auth.userInfo.preferred_username}</p>
                </div>
              )}
              {auth.userInfo.sub && (
                <div>
                  <label className="block text-slate-500 text-sm mb-1">User ID</label>
                  <p className="text-slate-900 font-medium text-sm break-all">
                    {auth.userInfo.sub}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-600">
              No user information loaded. Click the button below to fetch.
            </p>
          )}
          {auth.authMethod === "oidc" && !auth.userInfo && (
            <button
              onClick={() => oidcAuth.fetchUserInfo()}
              disabled={auth.isLoading}
              className="mt-4 px-4 py-2 bg-indigo-100 text-slate-900 font-semibold rounded-md hover:bg-indigo-200 disabled:opacity-70">
              {auth.isLoading ? "Loading..." : "Fetch User Info"}
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Authentication Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-500 text-sm mb-1">Authentication Method</label>
              <p className="text-slate-900 font-medium">
                {auth.authMethod?.toUpperCase() || "Unknown"}
              </p>
            </div>
            <div>
              <label className="block text-slate-500 text-sm mb-1">Status</label>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-3 h-3 rounded-full ${
                    auth.isAuthenticated ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-slate-900 font-semibold">
                  {auth.isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </span>
              </div>
            </div>
            {auth.tokens?.access_token && (
              <div>
                <label className="block text-slate-500 text-sm mb-1">Access Token Expires In</label>
                <p className="text-slate-900 font-medium">
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
                className="mt-2 px-4 py-2 bg-amber-100 text-amber-900 font-semibold rounded-md hover:bg-amber-200 disabled:opacity-70">
                {auth.isLoading ? "Refreshing..." : "Refresh Token"}
              </button>
            )}
          </div>
        </div>
      </div>

      {auth.tokens && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Token Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <label className="block text-green-700 text-sm mb-1">Access Token</label>
              <p className="text-green-900 font-semibold text-lg">
                {tokenStatus.isAccessExpired ? "🔴 Expired" : "🟢 Valid"}
              </p>
              <p className="text-green-700 text-sm mt-1">
                Expires: {tokenStatus.accessExpirationTime}
              </p>
            </div>

            {auth.tokens.refresh_token && (
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <label className="block text-blue-700 text-sm mb-1">Refresh Token</label>
                <p className="text-blue-900 font-semibold text-lg">
                  {tokenStatus.isRefreshExpired ? "🔴 Expired" : "🟢 Valid"}
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  Expires: {tokenStatus.refreshExpirationTime}
                </p>
              </div>
            )}
          </div>

          {tokenStatus.needsRefresh && auth.authMethod === "oidc" && (
            <div className="bg-amber-100 text-amber-900 border border-amber-300 rounded-lg p-4 mt-4">
              Token will be automatically refreshed shortly.
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">📋 Token Details</h2>
        <p className="text-slate-700 text-sm mb-4">
          For detailed token management and inspection, visit the{" "}
          <a href="/tokens" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Tokens page
          </a>
        </p>
        <details className="cursor-pointer">
          <summary className="text-indigo-600 font-medium hover:text-indigo-700">
            View Full Token Data (Dev)
          </summary>
          <pre className="bg-white p-4 rounded-lg border border-slate-200 overflow-auto max-h-80 text-xs mt-4">
            {JSON.stringify(auth.tokens, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
