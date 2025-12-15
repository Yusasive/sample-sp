import { useEffect } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import type { OidcConfig } from "@/types/auth";

function InfoCard({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="pb-4 border-b border-slate-200">
      <label className="block text-slate-500 text-sm mb-1">{label}</label>
      <p className="m-0 text-slate-900 font-medium break-word">{value}</p>
    </div>
  );
}

export function ProfilePage() {
  const auth = useAuthContext();
  // Use the same OIDC config logic as Dashboard (or adjust as needed)
  const oidcConfig: OidcConfig = {
    issuer: "",
    clientId: "",
    redirectUri: `${window.location.origin}/callback`,
    scopes: ["openid", "profile", "email"],
  };
  const oidcAuth = useOidcAuth(oidcConfig);

  useEffect(() => {
    if (auth.tokens?.access_token && !auth.userInfo) {
      if (auth.authMethod === "oidc") {
        oidcAuth.fetchUserInfo().catch(console.error);
      }
    }
  }, [auth.tokens, auth.userInfo, auth.authMethod, oidcAuth]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Profile</h1>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-slate-900">
        {auth.userInfo ? (
          <div className="space-y-4">
            <InfoCard label="Email" value={auth.userInfo.email} />
            <InfoCard label="Full Name" value={auth.userInfo.name} />
            <InfoCard label="First Name" value={auth.userInfo.given_name} />
            <InfoCard label="Last Name" value={auth.userInfo.family_name} />
            <InfoCard label="Username" value={auth.userInfo.preferred_username} />
            <InfoCard label="User ID (Sub)" value={auth.userInfo.sub} />
            {auth.userInfo.email_verified !== undefined && (
              <div className="pb-4 border-b border-slate-200">
                <label className="block text-slate-500 text-sm mb-2">Email Verified</label>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      auth.userInfo.email_verified ? "bg-green-500" : "bg-red-500"
                    }`}>
                    {auth.userInfo.email_verified ? "✓" : "✕"}
                  </div>
                  <span className="text-slate-900 font-medium">
                    {auth.userInfo.email_verified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t-2 border-slate-200">
              <h3 className="text-slate-900 mb-4 font-semibold">Additional Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 text-sm">Authentication Method:</span>
                  <p className="m-0 text-slate-900 font-medium">
                    {auth.authMethod?.toUpperCase() || "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Account Status:</span>
                  <p className="m-0 text-slate-900 font-medium">
                    {auth.isAuthenticated ? "✓ Active" : "✕ Inactive"}
                  </p>
                </div>
              </div>
            </div>

            <details className="mt-6 cursor-pointer">
              <summary className="text-indigo-600 font-medium hover:text-indigo-700">
                View Raw User Data (Dev)
              </summary>
              <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-auto max-h-80 text-xs mt-4">
                {JSON.stringify(auth.userInfo, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600">
            <p>No user profile information available.</p>
            <p className="text-sm">Please ensure you are logged in.</p>
          </div>
        )}
      </div>
    </div>
  );
}
