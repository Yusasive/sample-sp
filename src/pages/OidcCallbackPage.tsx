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
      console.log("Callback URL:", window.location.href);
      console.log("Code:", code);
      if (!code) {
        console.error("No code parameter found in callback URL.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        auth.setIsLoading(true);
        auth.setError(null);
        console.log("Exchanging code for tokens...");
        await oidcAuth.exchangeCode(code);
        console.log("Fetching user info...");
        await oidcAuth.fetchUserInfo(); // Fetch user details after login
        auth.setAuthMethod("oidc");
        console.log("OIDC login complete, redirecting to dashboard.");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      } catch (error) {
        // Print the error and any extra details if available
        console.error("OIDC callback error:", error);
        if (error instanceof Error && error.message.includes("Code verifier not found")) {
          auth.setError(
            "Unable to complete login: The code verifier required for secure login was not found.\n" +
              "This usually happens if you opened the magic link in a new tab or device.\n" +
              "For security, please use the same tab where you started the login process, or contact support if the problem persists.",
          );
        } else {
          auth.setError((error as Error).message || "Failed to complete OIDC login");
        }
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 4000);
      }
    };

    handleCallback();
  }, [code, navigate, auth, oidcAuth]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
      <div style={{ textAlign: "center", color: "#fff", width: "100%", maxWidth: 480 }}>
        {auth.error ? (
          <div
            style={{
              background: "#fff",
              color: "#d32f2f",
              border: "2px solid #d32f2f",
              borderRadius: 8,
              padding: "2rem 1rem 1.5rem 1rem",
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              fontWeight: 500,
              fontSize: "1.1rem",
              whiteSpace: "pre-line",
            }}>
            <span style={{ fontSize: 24, display: "block", marginBottom: 12 }}>❌</span>
            {auth.error}
            <br />
            <button
              style={{
                marginTop: 24,
                background: "#d32f2f",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                transition: "background 0.2s",
              }}
              onClick={() => navigate("/login", { replace: true })}>
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <h2>Completing OIDC Login...</h2>
            <div style={{ margin: "2rem auto", width: 48, height: 48 }}>
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
            <p>
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
