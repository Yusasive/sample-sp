import { createContext } from "react";
import type { Tokens, UserInfo } from "@/types/auth";

export interface AuthState {
  isAuthenticated: boolean;
  tokens: Tokens | null;
  userInfo: UserInfo | null;
  error: string | null;
  isLoading: boolean;
  authMethod: "oidc" | "saml" | null;
  codeVerifier: string | null;
}

export interface AuthContextType extends AuthState {
  setTokens: (tokens: Tokens | null) => void;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAuthMethod: (method: "oidc" | "saml" | null) => void;
  setCodeVerifier: (verifier: string | null) => void;
  logout: () => void;
  reset: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
