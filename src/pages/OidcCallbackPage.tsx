import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOidcAuth } from "@/hooks/useOidcAuth";
import type { OidcConfig } from "@/types/auth";

const oidcConfig: OidcConfig = {
  issuer: import.meta.env.VITE_OIDC_ISSUER_URL || "",
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/callback`,
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
        if (error && typeof error === "object" && "details" in error && error.details) {
          console.error("OIDC token endpoint error details:", (error as any).details);
        }
        auth.setError((error as Error).message || "Failed to complete OIDC login");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
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
      <div style={{ textAlign: "center", color: "#fff" }}>
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
      </div>
    </div>
  );
}
