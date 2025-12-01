import type { Tokens, UserInfo, OidcConfig } from "@/types/auth";
import { AuthError, getErrorMessage } from "@/utils/errors";
import { generateCodeChallenge, generateState, generateNonce } from "@/utils/crypto";

interface DiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  [key: string]: unknown;
}

interface JWKSResponse {
  keys: Array<{ [key: string]: unknown }>;
}

export class OidcService {
  private config: OidcConfig;
  private discoveryCache: Map<string, DiscoveryDocument> = new Map();

  constructor(config: OidcConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: OidcConfig): void {
    if (!config.issuer) throw new AuthError("INVALID_CONFIG", "Issuer is required");
    if (!config.clientId) throw new AuthError("INVALID_CONFIG", "Client ID is required");
    if (!config.redirectUri) throw new AuthError("INVALID_CONFIG", "Redirect URI is required");
  }

  async getDiscovery(): Promise<DiscoveryDocument> {
    if (this.discoveryCache.has(this.config.issuer)) {
      return this.discoveryCache.get(this.config.issuer)!;
    }

    try {
      const response = await fetch(`${this.config.issuer}/.well-known/openid-configuration`);
      if (!response.ok) {
        throw new AuthError(
          "DISCOVERY_FAILED",
          `Failed to fetch discovery document: ${response.statusText}`,
        );
      }

      const document = (await response.json()) as DiscoveryDocument;
      this.discoveryCache.set(this.config.issuer, document);
      return document;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("DISCOVERY_FAILED", getErrorMessage(error));
    }
  }

  async getJWKS(): Promise<JWKSResponse> {
    try {
      const discovery = await this.getDiscovery();
      const response = await fetch(discovery.jwks_uri);

      if (!response.ok) {
        throw new AuthError("JWKS_FAILED", `Failed to fetch JWKS: ${response.statusText}`);
      }

      return (await response.json()) as JWKSResponse;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("JWKS_FAILED", getErrorMessage(error));
    }
  }

  async buildAuthorizationUrl(codeVerifier: string): Promise<string> {
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();
    const nonce = generateNonce();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes?.join(" ") || "openid profile email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce,
    });

    const discovery = await this.getDiscovery();
    return `${discovery.authorization_endpoint}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    clientSecret?: string,
  ): Promise<Tokens> {
    try {
      const discovery = await this.getDiscovery();

      const body: Record<string, string> = {
        grant_type: "authorization_code",
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        code_verifier: codeVerifier,
      };

      if (clientSecret) {
        body.client_secret = clientSecret;
      }

      const response = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as Tokens & { error_description?: string };

      if (!response.ok) {
        throw new AuthError(
          "TOKEN_EXCHANGE_FAILED",
          data.error_description || "Token exchange failed",
          data,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("TOKEN_EXCHANGE_FAILED", getErrorMessage(error));
    }
  }

  async refreshAccessToken(refreshToken: string, clientSecret?: string): Promise<Tokens> {
    try {
      const discovery = await this.getDiscovery();

      const body: Record<string, string> = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.config.clientId,
      };

      if (clientSecret) {
        body.client_secret = clientSecret;
      }

      const response = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as Tokens & { error_description?: string };

      if (!response.ok) {
        throw new AuthError(
          "TOKEN_REFRESH_FAILED",
          data.error_description || "Token refresh failed",
          data,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("TOKEN_REFRESH_FAILED", getErrorMessage(error));
    }
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const discovery = await this.getDiscovery();

      const response = await fetch(`${discovery.issuer}/userinfo`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = (await response.json()) as UserInfo & { error_description?: string };

      if (!response.ok) {
        throw new AuthError(
          "USERINFO_FAILED",
          data.error_description || "Failed to fetch user info",
          data,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("USERINFO_FAILED", getErrorMessage(error));
    }
  }

  async revokeToken(token: string, tokenTypeHint?: "access_token" | "refresh_token"): Promise<void> {
    try {
      const discovery = await this.getDiscovery();
      const issuerUrl = new URL(discovery.issuer);
      const revokeUrl = new URL(issuerUrl.pathname + "/revoke", issuerUrl.origin);

      const body: Record<string, string> = {
        token,
        client_id: this.config.clientId,
      };

      if (tokenTypeHint) {
        body.token_type_hint = tokenTypeHint;
      }

      if (this.config.clientSecret) {
        body.client_secret = this.config.clientSecret;
      }

      const response = await fetch(revokeUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new AuthError("TOKEN_REVOKE_FAILED", "Failed to revoke token");
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("TOKEN_REVOKE_FAILED", getErrorMessage(error));
    }
  }

  updateConfig(config: Partial<OidcConfig>): void {
    this.config = { ...this.config, ...config };
    this.validateConfig(this.config);
    this.discoveryCache.clear();
  }

  getConfig(): OidcConfig {
    return { ...this.config };
  }
}
