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
    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-4 text-slate-900">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="m-0 mb-2 text-slate-900 font-semibold">{title}</h3>
          <p className="m-0 text-slate-600 text-sm">
            Type: {type} • Expires in: {formatTokenExpirationTime(expiresIn)}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="bg-slate-200 hover:bg-slate-300 border-none rounded px-3 py-2 cursor-pointer text-sm font-medium">
          {expanded ? "Hide" : "Show"}
        </button>
      </div>

      {expanded && (
        <div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <p className="m-0 mb-2 text-slate-600 text-sm">
              Token Value:
            </p>
            <code className="block break-all text-slate-900 text-xs font-mono">
              {maskToken(token, 20)}
            </code>
          </div>

          {decoded && (
            <div>
              <div className="mb-4">
                <p className="m-0 mb-2 text-slate-600 text-sm">
                  Header:
                </p>
                <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 m-0 overflow-auto max-h-40 text-xs">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>

              <div className="mb-4">
                <p className="m-0 mb-2 text-slate-600 text-sm">
                  Payload:
                </p>
                <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 m-0 overflow-auto max-h-80 text-xs">
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
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Token Management
        </h1>
        <div className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-6 text-center">
          <p className="m-0">No tokens available. Please log in first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Token Management</h1>

      <div className="mb-8">
        <div className="bg-blue-50 text-blue-900 border border-blue-300 rounded-lg p-4 mb-6">
          <p className="m-0 text-sm">
             View and manage your authentication tokens. Tokens are automatically refreshed when
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

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <h3 className="m-0 mb-4 text-slate-900 font-semibold">Token Actions</h3>
        <div className="grid md:grid-cols-2 gap-4">
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
              className="bg-amber-100 text-amber-900 border-none rounded-lg px-4 py-2 cursor-pointer font-semibold hover:bg-amber-200 disabled:opacity-70">
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
              className="bg-red-100 text-red-900 border-none rounded-lg px-4 py-2 cursor-pointer font-semibold hover:bg-red-200 disabled:opacity-70">
              {auth.isLoading ? "Revoking..." : "Revoke Refresh Token"}
            </button>
          )}
        </div>
      </div>

      <details className="cursor-pointer mt-6 max-w-2xl">
        <summary className="text-indigo-600 font-bold mb-4 text-lg p-2 pb-3 border-b border-slate-200 bg-slate-100 rounded-lg hover:bg-slate-200">
          🛠️ View Raw Token Data (Dev)
        </summary>
        <div className="relative mt-4">
          <button
            onClick={() => {
              if (auth.tokens) {
                navigator.clipboard.writeText(JSON.stringify(auth.tokens, null, 2));
              }
            }}
            className="absolute top-3 right-3 bg-indigo-100 text-indigo-600 border-none rounded px-3 py-1 text-sm font-semibold cursor-pointer shadow-sm z-10 hover:bg-indigo-200"
            title="Copy JSON to clipboard">
            Copy
          </button>
          <pre className="bg-slate-50 text-slate-900 border border-slate-200 rounded-lg p-5 pt-10 overflow-auto max-h-96 text-sm font-mono shadow-sm">
            {JSON.stringify(auth.tokens, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
