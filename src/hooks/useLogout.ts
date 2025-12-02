import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "./useAuthContext";
import { useOidcAuth } from "./useOidcAuth";
import { useSamlAuth } from "./useSamlAuth";
import { performLocalLogout, saveLogoutState } from "@/utils/session";
import type { OidcConfig, SamlConfig } from "@/types/auth";

export interface UseLogoutReturn {
  logout: (options?: LogoutOptions) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface LogoutOptions {
  immediate?: boolean;
  showConfirmation?: boolean;
  redirectTo?: string;
}

export function useLogout(
  oidcConfig: OidcConfig,
  samlConfig: SamlConfig,
): UseLogoutReturn {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const oidcAuth = useOidcAuth(oidcConfig);
  const samlAuth = useSamlAuth(samlConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(
    async (options: LogoutOptions = {}) => {
      const { immediate = true, showConfirmation = false, redirectTo = "/login" } = options;

      if (showConfirmation && !immediate) {
        if (!confirm("Are you sure you want to log out?")) {
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const authMethod = auth.authMethod;
        const idToken = auth.tokens?.id_token;

        saveLogoutState({
          timestamp: Date.now(),
          method: authMethod || "oidc",
          returnUrl: redirectTo,
        });

        performLocalLogout();

        if (authMethod === "oidc" && idToken) {
          try {
            const logoutUrl = await oidcAuth.getLogoutUrl?.(idToken);
            if (logoutUrl) {
              window.location.href = logoutUrl;
              return;
            }
          } catch (err) {
            console.warn("OIDC logout URL generation failed, performing local logout:", err);
          }
        } else if (authMethod === "saml") {
          try {
            const sessionIndex = localStorage.getItem("saml_session_index");
            const nameId = auth.userInfo?.sub;
            if (sessionIndex && nameId) {
              samlAuth.startLogout(sessionIndex, nameId);
              return;
            }
          } catch (err) {
            console.warn("SAML logout failed, performing local logout:", err);
          }
        }

        navigate(redirectTo, { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Logout failed";
        setError(message);
        console.error("Logout error:", err);

        performLocalLogout();
        navigate(redirectTo, { replace: true });
      } finally {
        setIsLoading(false);
      }
    },
    [auth.authMethod, auth.tokens?.id_token, auth.userInfo?.sub, navigate, oidcAuth, samlAuth],
  );

  return {
    logout,
    isLoading,
    error,
  };
}
