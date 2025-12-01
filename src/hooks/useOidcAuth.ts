import { useCallback, useRef, useEffect } from "react";
import { OidcService } from "@/services/oidc.service";
import type { OidcConfig, Tokens, UserInfo } from "@/types/auth";
import { useAuthContext } from "./useAuthContext";
import { generatePKCEPair } from "@/utils/crypto";
import { getErrorMessage, AuthError } from "@/utils/errors";
import { getFromStorage, STORAGE_KEYS } from "@/utils/storage";

export interface UseOidcAuthReturn {
  startLogin: () => Promise<void>;
  exchangeCode: (code: string) => Promise<Tokens>;
  fetchUserInfo: () => Promise<UserInfo>;
  refreshToken: () => Promise<Tokens>;
  revokeToken: (tokenHint?: "access_token" | "refresh_token") => Promise<void>;
  isConfigured: boolean;
}

export function useOidcAuth(config: OidcConfig): UseOidcAuthReturn {
  const auth = useAuthContext();
  const oidcServiceRef = useRef<OidcService | null>(null);

  const startLogin = useCallback(async () => {
    auth.setIsLoading(true);
    auth.setError(null);
    try {
      oidcServiceRef.current = new OidcService(config);
      const { verifier } = await generatePKCEPair();
      auth.setCodeVerifier(verifier);
      auth.setAuthMethod("oidc");
      const authUrl = await oidcServiceRef.current.buildAuthorizationUrl(verifier);
      window.location.href = authUrl;
    } catch (error) {
      const message = getErrorMessage(error);
      auth.setError(message);
      auth.setIsLoading(false);
      throw new AuthError("LOGIN_FAILED", message);
    }
  }, [auth, config]);

  const exchangeCode = useCallback(
    async (code: string): Promise<Tokens> => {
      if (!oidcServiceRef.current) {
        throw new AuthError("NOT_CONFIGURED", "OIDC not configured");
      }

      auth.setIsLoading(true);
      auth.setError(null);

      try {
        const verifier = auth.codeVerifier || getFromStorage<string>(STORAGE_KEYS.PKCE_VERIFIER);
        if (!verifier) {
          throw new AuthError("MISSING_VERIFIER", "Code verifier not found. Start login first.");
        }

        const tokens = await oidcServiceRef.current.exchangeCodeForTokens(
          code,
          verifier,
          config.clientSecret,
        );

        auth.setTokens(tokens);
        auth.setCodeVerifier(null);
        return tokens;
      } catch (error) {
        const message = getErrorMessage(error);
        auth.setError(message);
        throw error;
      } finally {
        auth.setIsLoading(false);
      }
    },
    [auth, config.clientSecret],
  );

  const fetchUserInfo = useCallback(async (): Promise<UserInfo> => {
    if (!oidcServiceRef.current || !auth.tokens?.access_token) {
      throw new AuthError("NOT_AUTHENTICATED", "Not authenticated");
    }

    auth.setIsLoading(true);
    auth.setError(null);

    try {
      const userInfo = await oidcServiceRef.current.getUserInfo(auth.tokens.access_token);
      auth.setUserInfo(userInfo);
      return userInfo;
    } catch (error) {
      const message = getErrorMessage(error);
      auth.setError(message);
      throw error;
    } finally {
      auth.setIsLoading(false);
    }
  }, [auth, oidcServiceRef]);

  const refreshToken = useCallback(async (): Promise<Tokens> => {
    if (!oidcServiceRef.current || !auth.tokens?.refresh_token) {
      throw new AuthError("NO_REFRESH_TOKEN", "Refresh token not available");
    }

    auth.setIsLoading(true);
    auth.setError(null);

    try {
      const tokens = await oidcServiceRef.current.refreshAccessToken(
        auth.tokens.refresh_token,
        config.clientSecret,
      );

      auth.setTokens(tokens);
      return tokens;
    } catch (error) {
      const message = getErrorMessage(error);
      auth.setError(message);
      throw error;
    } finally {
      auth.setIsLoading(false);
    }
  }, [auth, config.clientSecret]);

  const revokeToken = useCallback(
    async (tokenHint?: "access_token" | "refresh_token"): Promise<void> => {
      if (!oidcServiceRef.current || !auth.tokens) {
        throw new AuthError("NO_TOKENS", "No tokens to revoke");
      }

      auth.setIsLoading(true);
      auth.setError(null);

      try {
        const token =
          tokenHint === "refresh_token" ? auth.tokens.refresh_token : auth.tokens.access_token;
        if (!token) {
          throw new AuthError("NO_TOKEN", `${tokenHint} not available`);
        }

        await oidcServiceRef.current.revokeToken(token, tokenHint);
        if (tokenHint === "refresh_token") {
          auth.setTokens(null);
          auth.logout();
        }
      } catch (error) {
        const message = getErrorMessage(error);
        auth.setError(message);
        throw error;
      } finally {
        auth.setIsLoading(false);
      }
    },
    [auth],
  );

  return {
    startLogin,
    exchangeCode,
    fetchUserInfo,
    refreshToken,
    revokeToken,
    isConfigured: !!oidcServiceRef.current,
  };
}
