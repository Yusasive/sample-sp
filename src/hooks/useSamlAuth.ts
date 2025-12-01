import { useCallback, useRef } from "react";
import { SamlService, type SamlResponse } from "@/services/saml.service";
import type { SamlConfig, UserInfo } from "@/types/auth";
import { useAuthContext } from "./useAuthContext";
import { getErrorMessage, AuthError } from "@/utils/errors";
import { saveToStorage, removeFromStorage, STORAGE_KEYS } from "@/utils/storage";

export interface UseSamlAuthReturn {
  generateMetadata: () => string;
  startLogin: (idpSsoUrl?: string) => void;
  parseAcsResponse: (samlResponseBase64: string) => SamlResponse;
  startLogout: (sessionIndex: string, nameId: string, idpSloUrl?: string) => void;
  handleAcsCallback: (samlResponseBase64: string) => UserInfo;
  isConfigured: boolean;
}

export function useSamlAuth(config: SamlConfig): UseSamlAuthReturn {
  const auth = useAuthContext();
  const samlServiceRef = useRef<SamlService | null>(null);

  const generateMetadata = useCallback((): string => {
    if (!samlServiceRef.current) {
      throw new AuthError("NOT_CONFIGURED", "SAML not configured");
    }
    return samlServiceRef.current.generateMetadata();
  }, []);

  const startLogin = useCallback(
    (idpSsoUrl?: string) => {
      auth.setIsLoading(true);
      auth.setError(null);
      auth.setAuthMethod("saml");
      try {
        samlServiceRef.current = new SamlService(config);
        const ssoUrl = idpSsoUrl || config.idpSsoUrl;
        if (!ssoUrl) {
          throw new AuthError("MISSING_IDP_SSO_URL", "IdP SSO URL is required");
        }
        const loginUrl = samlServiceRef.current.generateAuthRedirectUrl(ssoUrl);
        window.location.href = loginUrl;
      } catch (error) {
        const message = getErrorMessage(error);
        auth.setError(message);
        auth.setIsLoading(false);
        throw new AuthError("LOGIN_FAILED", message);
      }
    },
    [auth, config],
  );

  const parseAcsResponse = useCallback(
    (samlResponseBase64: string): SamlResponse => {
      if (!samlServiceRef.current) {
        throw new AuthError("NOT_CONFIGURED", "SAML not configured");
      }

      try {
        return samlServiceRef.current.parseAcsResponse(samlResponseBase64);
      } catch (error) {
        const message = getErrorMessage(error);
        auth.setError(message);
        throw error;
      }
    },
    [auth],
  );

  const handleAcsCallback = useCallback(
    (samlResponseBase64: string): UserInfo => {
      auth.setIsLoading(true);
      auth.setError(null);

      try {
        const response = parseAcsResponse(samlResponseBase64);
        const { assertion } = response;

        const userInfo: UserInfo = {
          sub: assertion.nameId,
          email: assertion.attributes["email"] || assertion.nameId,
          given_name: assertion.attributes["givenName"],
          family_name: assertion.attributes["surname"],
          preferred_username: assertion.attributes["uid"],
        };

        const mockTokens = {
          access_token: `saml_${Math.random().toString(36).substring(2)}`,
          id_token: samlResponseBase64,
          token_type: "Bearer",
          expires_in: 3600,
        };

        saveToStorage(STORAGE_KEYS.TOKENS, mockTokens);
        auth.setTokens(mockTokens);
        auth.setUserInfo(userInfo);

        if (assertion.sessionIndex) {
          saveToStorage("saml_session_index", assertion.sessionIndex);
        }

        return userInfo;
      } catch (error) {
        const message = getErrorMessage(error);
        auth.setError(message);
        throw error;
      } finally {
        auth.setIsLoading(false);
      }
    },
    [auth, parseAcsResponse],
  );

  const startLogout = useCallback(
    (sessionIndex: string, nameId: string, idpSloUrl?: string) => {
      if (!samlServiceRef.current) {
        throw new AuthError("NOT_CONFIGURED", "SAML not configured");
      }

      auth.setIsLoading(true);
      auth.setError(null);

      try {
        const sloUrl = idpSloUrl || config.idpSloUrl;
        if (!sloUrl) {
          console.warn("IdP SLO URL not configured, performing local logout only");
          auth.logout();
          return;
        }

        const logoutUrl = samlServiceRef.current.generateLogoutRedirectUrl(
          sessionIndex,
          nameId,
          sloUrl,
        );
        removeFromStorage("saml_session_index");
        window.location.href = logoutUrl;
      } catch (error) {
        const message = getErrorMessage(error);
        auth.setError(message);
        auth.setIsLoading(false);
        throw new AuthError("LOGOUT_FAILED", message);
      }
    },
    [auth, config.idpSloUrl],
  );

  return {
    generateMetadata,
    startLogin,
    parseAcsResponse,
    handleAcsCallback,
    startLogout,
    isConfigured: !!samlServiceRef.current,
  };
}
