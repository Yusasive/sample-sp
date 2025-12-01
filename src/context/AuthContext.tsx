import { useState, useCallback } from "react";
import type { ReactNode, FC } from "react";
import type { Tokens, UserInfo } from "@/types/auth";
import { getFromStorage, saveToStorage, removeFromStorage, STORAGE_KEYS } from "@/utils/storage";
import { AuthContext, type AuthContextType, type AuthState } from "./AuthContexts";

export { AuthContext, type AuthContextType, type AuthState };

const initialState: AuthState = {
  isAuthenticated: false,
  tokens: null,
  userInfo: null,
  error: null,
  isLoading: false,
  authMethod: null,
  codeVerifier: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const storedTokens = getFromStorage<Tokens>(STORAGE_KEYS.TOKENS);
    return {
      ...initialState,
      tokens: storedTokens,
      isAuthenticated: !!storedTokens?.access_token,
    };
  });

  const setTokens = useCallback((tokens: Tokens | null) => {
    setState((prev) => ({
      ...prev,
      tokens,
      isAuthenticated: !!tokens?.access_token,
    }));
    if (tokens) {
      saveToStorage(STORAGE_KEYS.TOKENS, tokens);
    } else {
      removeFromStorage(STORAGE_KEYS.TOKENS);
    }
  }, []);

  const setUserInfo = useCallback((userInfo: UserInfo | null) => {
    setState((prev) => ({
      ...prev,
      userInfo,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const setAuthMethod = useCallback((method: "oidc" | "saml" | null) => {
    setState((prev) => ({
      ...prev,
      authMethod: method,
    }));
  }, []);

  const setCodeVerifier = useCallback((verifier: string | null) => {
    setState((prev) => ({
      ...prev,
      codeVerifier: verifier,
    }));
    if (verifier) {
      saveToStorage(STORAGE_KEYS.PKCE_VERIFIER, verifier);
    } else {
      removeFromStorage(STORAGE_KEYS.PKCE_VERIFIER);
    }
  }, []);

  const logout = useCallback(() => {
    setState({
      ...initialState,
      tokens: null,
      userInfo: null,
    });
    removeFromStorage(STORAGE_KEYS.TOKENS);
    removeFromStorage(STORAGE_KEYS.PKCE_VERIFIER);
  }, []);

  const reset = useCallback(() => {
    setState({
      isAuthenticated: false,
      tokens: null,
      userInfo: null,
      error: null,
      isLoading: false,
      authMethod: null,
      codeVerifier: null,
    });
  }, []);

  const value: AuthContextType = {
    ...state,
    setTokens,
    setUserInfo,
    setError,
    setIsLoading,
    setAuthMethod,
    setCodeVerifier,
    logout,
    reset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
