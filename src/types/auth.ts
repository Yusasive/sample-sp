export interface Tokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  [key: string]: unknown;
}

export interface UserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  name?: string;
  [key: string]: unknown;
}

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: string[];
  responseType?: string;
  codeChallengeMethod?: string;
}

export interface SamlConfig {
  spName?: string;
  entityId: string;
  acsUrl: string;
  nameIdFormat?: string;
  sloUrl?: string;
  sloBinding?: string;
  certificate?: string;
  idpEntityId?: string;
  idpSsoUrl?: string;
  idpSloUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  tokens: Tokens | null;
  userInfo: UserInfo | null;
  error: string | null;
  isLoading: boolean;
  authMethod: "oidc" | "saml" | null;
}
