import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import type { OidcConfig } from "@/types/auth";

const getApiIssuer = (issuer: string) =>
  issuer.includes("/api/") ? issuer : issuer.replace("://uni-que.id/", "://uni-que.id/api/");
const oidcConfig: OidcConfig = {
  issuer: getApiIssuer(import.meta.env.VITE_OIDC_ISSUER_URL || ""),
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirectUri:
    import.meta.env.VITE_OIDC_REDIRECT_URI &&
    import.meta.env.VITE_OIDC_REDIRECT_URI.endsWith("/callback")
      ? import.meta.env.VITE_OIDC_REDIRECT_URI
      : `${window.location.origin}/callback`,
  scopes: ["openid", "profile", "email"],
};

export function OidcCallbackPage() {
  const navigate = useNavigate();
  const auth = useAuthContext();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  console.log("OIDC Config:", oidcConfig);
  const oidcAuth = useOidcAuth(oidcConfig);

  useEffect(() => {
    const handleCallback = async () => {
      console.debug("[OIDC] Callback URL:", window.location.href);
      console.debug("[OIDC] Code:", code);
      if (!code) {
        console.error("No code parameter found in callback URL.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        auth.setIsLoading(true);
        auth.setError(null);
        console.debug("[OIDC] Exchanging code for tokens...");
        await oidcAuth.exchangeCode(code);
        console.debug("[OIDC] Fetching user info...");
        await oidcAuth.fetchUserInfo(); // Fetch user details after login
        auth.setAuthMethod("oidc");
        console.debug("[OIDC] Login complete, redirecting to dashboard.");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      } catch (error) {
        // Print the error and any extra details if available
        console.error("OIDC callback error:", error);
        if (
          error instanceof Error &&
          (error.message.includes("Code verifier not found") ||
            error.message.includes("Login could not be completed"))
        ) {
          auth.setError(
            "Unable to complete login: The code verifier required for secure login was not found.\n" +
              "This usually happens if you opened the magic link in a new tab or device, or your session expired.\n" +
              "For security, please use the same tab where you started the login process, or click 'Restart Login' below.",
          );
        } else {
          auth.setError((error as Error).message || "Failed to complete OIDC login");
        }
        // Do not auto-redirect to login; let user use the button
      }
    };

    handleCallback();
  }, [code, navigate, auth, oidcAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <div className="text-center text-white w-full max-w-xl">
        {auth.error ? (
          <div className="bg-white text-red-600 border-2 border-red-600 rounded-lg p-8 mb-6 shadow-lg font-medium text-lg whitespace-pre-line">
            <span className="text-4xl block mb-3">❌</span>
            {auth.error}
            <br />
            <button
              className="mt-6 bg-red-600 text-white border-none rounded px-8 py-3 text-base cursor-pointer font-semibold shadow-sm hover:bg-red-700 transition-colors"
              onClick={() => navigate("/login", { replace: true })}>
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-8">Completing OIDC Login...</h2>
            <div className="mx-auto w-12 h-12 mb-6">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="4" opacity="0.2" />
                <path
                  d="M44 24c0-11.046-8.954-20-20-20"
                  stroke="#fff"
                  strokeWidth="4"
                  strokeLinecap="round">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 24 24"
                    to="360 24 24"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </div>
            <p className="text-lg">
              Exchanging authorization code for tokens...
              <br />
              Please wait.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
