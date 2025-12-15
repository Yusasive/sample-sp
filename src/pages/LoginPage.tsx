import { useState, useEffect } from "react";
import type { OidcConfig, SamlConfig } from "@/types/auth";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import { useSamlAuth } from "@/hooks/useSamlAuth";

const getApiIssuer = (issuer: string) =>
  issuer.includes("/api/") ? issuer : issuer.replace("://uni-que.id/", "://uni-que.id/api/");
const DEFAULT_OIDC_CONFIG: OidcConfig = {
  issuer: getApiIssuer(import.meta.env.VITE_OIDC_ISSUER_URL || ""),
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirectUri:
    import.meta.env.VITE_OIDC_REDIRECT_URI &&
    import.meta.env.VITE_OIDC_REDIRECT_URI.endsWith("/callback")
      ? import.meta.env.VITE_OIDC_REDIRECT_URI
      : `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

const DEFAULT_SAML_CONFIG: SamlConfig = {
  entityId: import.meta.env.VITE_SAML_ENTITY_ID || `${window.location.origin}/saml/metadata`,
  acsUrl: import.meta.env.VITE_SAML_ACS_URL || `${window.location.origin}/saml/acs`,
  spName: import.meta.env.VITE_SAML_SP_NAME || "Que-ID Service Provider",
  nameIdFormat:
    import.meta.env.VITE_SAML_NAMEID_FORMAT ||
    "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  idpSsoUrl: import.meta.env.VITE_SAML_IDP_SSO_URL || "",
  idpSloUrl: import.meta.env.VITE_SAML_IDP_SLO_URL || "",
};

export function LoginPage() {
  // Debug log to verify .env values
  console.log("OIDC ENV CONFIG:", {
    issuer: getApiIssuer(import.meta.env.VITE_OIDC_ISSUER_URL || ""),
    clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
    redirectUri:
      import.meta.env.VITE_OIDC_REDIRECT_URI &&
      import.meta.env.VITE_OIDC_REDIRECT_URI.endsWith("/callback")
        ? import.meta.env.VITE_OIDC_REDIRECT_URI
        : `${window.location.origin}/callback`,
  });
  const auth = useAuthContext();
  const [authMethod, setAuthMethod] = useState<"oidc" | "saml" | null>(null);
  const [oidcConfig] = useState(DEFAULT_OIDC_CONFIG);
  const [samlConfig] = useState(DEFAULT_SAML_CONFIG);
  const [error, setError] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

  // On mount, check if a PKCE login is already in progress in any tab
  // and listen for changes across tabs
  useEffect(() => {
    const checkVerifier = () => {
      const existingVerifier = window.localStorage.getItem("queid_sp_pkce_verifier");
      setLoginInProgress(!!existingVerifier);
    };
    checkVerifier();
    window.addEventListener("storage", checkVerifier);
    return () => {
      window.removeEventListener("storage", checkVerifier);
    };
  }, []);

  const oidcAuth = useOidcAuth(oidcConfig);
  const samlAuth = useSamlAuth(samlConfig);

  const handleOidcLogin = async () => {
    setError("");
    // Block login if a PKCE login is already in progress in any tab
    if (loginInProgress) {
      setError(
        "A login is already in progress in this browser. Please complete it or clear your browser storage before starting a new login.",
      );
      return;
    }
    if (!oidcConfig.issuer || !oidcConfig.clientId) {
      setError("Please fill in Issuer URL and Client ID");
      return;
    }
    try {
      await oidcAuth.startLogin();
      // Debug: Confirm PKCE verifier is set in storage
      const pkceVerifier = window.localStorage.getItem("queid_sp_pkce_verifier");
      console.log("PKCE verifier after startLogin:", pkceVerifier);
    } catch (err) {
      setError((err as Error).message || "OIDC login failed");
    }
  };

  const handleSamlLogin = () => {
    setError("");
    if (!samlConfig.idpSsoUrl) {
      setError("Please fill in IdP SSO URL");
      return;
    }
    try {
      samlAuth.startLogin(samlConfig.idpSsoUrl);
    } catch (err) {
      setError((err as Error).message || "SAML login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full">
        <h1 className="text-center text-2xl font-bold text-slate-900 mb-2">
          Que-ID Login
        </h1>
        <p className="text-center text-slate-500 mb-8">
          Select your authentication method
        </p>

        {error && (
          <div className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}
        {auth.isLoading && (
          <div className="text-center text-slate-500 mb-6">
            Processing...
          </div>
        )}

        {!authMethod ? (
          <div className="space-y-4">
            <button
              onClick={() => setAuthMethod("oidc")}
              className="w-full p-4 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium transition-all hover:border-indigo-500 hover:bg-indigo-50">
               Login with OIDC
            </button>
            <button
              onClick={() => setAuthMethod("saml")}
              className="w-full p-4 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium transition-all hover:border-purple-600 hover:bg-purple-50">
               Login with SAML
            </button>
          </div>
        ) : authMethod === "oidc" ? (
          <div className="space-y-4">
            <button
              onClick={handleOidcLogin}
              disabled={auth.isLoading}
              className="w-full p-3 bg-indigo-500 text-white font-medium rounded-lg transition-opacity disabled:opacity-70 hover:bg-indigo-600">
              {auth.isLoading ? "Processing..." : "Login with OIDC"}
            </button>
            <button
              onClick={() => setAuthMethod(null)}
              className="w-full p-3 bg-slate-200 text-slate-900 font-medium rounded-lg hover:bg-slate-300">
              Back
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleSamlLogin}
              disabled={auth.isLoading}
              className="w-full p-3 bg-purple-600 text-white font-medium rounded-lg transition-opacity disabled:opacity-70 hover:bg-purple-700">
              {auth.isLoading ? "Processing..." : "Login with SAML"}
            </button>
            <button
              onClick={() => setAuthMethod(null)}
              className="w-full p-3 bg-slate-200 text-slate-900 font-medium rounded-lg hover:bg-slate-300">
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
