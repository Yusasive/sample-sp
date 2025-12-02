import { useEffect, useRef, useCallback } from "react";
import { useAuthContext } from "./useAuthContext";
import {
  getTokensExpirationStatus,

  formatTokenExpirationTime,
} from "@/utils/token";
import { useOidcAuth } from "./useOidcAuth";
import type { OidcConfig } from "@/types/auth";

export interface TokenStatus {
  isAccessExpired: boolean;
  isRefreshExpired: boolean;
  accessExpiresIn: number;
  refreshExpiresIn: number;
  accessExpirationTime: string;
  refreshExpirationTime: string;
  needsRefresh: boolean;
}

const REFRESH_THRESHOLD = 5 * 60;

export function useTokenManagement(oidcConfig: OidcConfig): TokenStatus {
  const auth = useAuthContext();
  const oidcAuth = useOidcAuth(oidcConfig);
  const refreshTimeoutRef = useRef<number | null>(null);
  const lastRefreshAttemptRef = useRef<number>(0);

  const getTokenStatus = useCallback((): TokenStatus => {
    const { accessExpired, refreshExpired, accessExpiresIn, refreshExpiresIn } =
      getTokensExpirationStatus(auth.tokens);

    return {
      isAccessExpired: accessExpired,
      isRefreshExpired: refreshExpired,
      accessExpiresIn,
      refreshExpiresIn,
      accessExpirationTime: formatTokenExpirationTime(accessExpiresIn),
      refreshExpirationTime: formatTokenExpirationTime(refreshExpiresIn),
      needsRefresh: accessExpiresIn < REFRESH_THRESHOLD && !accessExpired,
    };
  }, [auth.tokens]);

  const attemptTokenRefresh = useCallback(async () => {
    if (
      !auth.tokens?.refresh_token ||
      auth.authMethod !== "oidc" ||
      auth.isLoading
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < 1000) {
      return;
    }

    lastRefreshAttemptRef.current = now;

    try {
      await oidcAuth.refreshToken();
    } catch (error) {
      console.error("Automatic token refresh failed:", error);
    }
  }, [auth.tokens?.refresh_token, auth.authMethod, auth.isLoading, oidcAuth]);

  useEffect(() => {
    const status = getTokenStatus();

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (status.isRefreshExpired) {
      auth.logout();
      return;
    }

    if (status.needsRefresh) {
      attemptTokenRefresh();
      refreshTimeoutRef.current = window.setTimeout(() => {
        attemptTokenRefresh();
      }, (status.accessExpiresIn - REFRESH_THRESHOLD + 60) * 1000);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [auth.tokens, auth.authMethod, attemptTokenRefresh, getTokenStatus, auth]);

  return getTokenStatus();
}
