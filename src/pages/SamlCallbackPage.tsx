import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useSamlAuth } from "@/hooks/useSamlAuth";
import type { SamlConfig } from "@/types/auth";

const mockConfig: SamlConfig = {
  entityId: `${window.location.origin}/saml/metadata`,
  acsUrl: `${window.location.origin}/saml/acs`,
};

export function SamlCallbackPage() {
  const navigate = useNavigate();
  const auth = useAuthContext();
  const [searchParams] = useSearchParams();
  const samlResponse = searchParams.get("SAMLResponse");
  const samlAuth = useSamlAuth(mockConfig);

  useEffect(() => {
    const handleCallback = async () => {
      if (!samlResponse) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        auth.setIsLoading(true);
        auth.setError(null);

        samlAuth.handleAcsCallback(samlResponse);
        auth.setAuthMethod("saml");

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      } catch (error) {
        auth.setError((error as Error).message || "Failed to complete SAML login");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [samlResponse, navigate, auth, samlAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-8">Completing SAML Login...</h2>
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
          Processing SAML response...
          <br />
          Please wait.
        </p>
      </div>
    </div>
  );
}
