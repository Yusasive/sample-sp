import type { OidcConfig, SamlConfig } from "@/types/auth";
import { saveToStorage, removeFromStorage, clearAllStorage } from "./storage";

export interface LogoutOptions {
  postLogoutRedirectUri?: string;
  idTokenHint?: string;
  state?: string;
}

export async function performOidcLogout(
  config: OidcConfig,
  idToken?: string,
  options?: LogoutOptions,
): Promise<string> {
  try {
    const params = new URLSearchParams({
      post_logout_redirect_uri: options?.postLogoutRedirectUri || `${window.location.origin}/login`,
      ...(idToken && { id_token_hint: idToken }),
      ...(options?.state && { state: options.state }),
    });

    const endSessionUrl = `${config.issuer}/.well-known/openid-configuration`;
    const response = await fetch(endSessionUrl);
    const config_data = (await response.json()) as { end_session_endpoint?: string };

    if (!config_data.end_session_endpoint) {
      throw new Error("End session endpoint not found in discovery document");
    }

    return `${config_data.end_session_endpoint}?${params.toString()}`;
  } catch (error) {
    console.error("Failed to build OIDC logout URL:", error);
    throw new Error("OIDC logout URL generation failed");
  }
}

export async function performSamlLogout(config: SamlConfig): Promise<string> {
  try {
    if (!config.idpSloUrl) {
      throw new Error("IdP SLO URL not configured");
    }

    return config.idpSloUrl;
  } catch (error) {
    console.error("Failed to build SAML logout URL:", error);
    throw new Error("SAML logout URL generation failed");
  }
}

export function saveLogoutState(state: {
  timestamp: number;
  method: "oidc" | "saml";
  returnUrl?: string;
}): void {
  saveToStorage("logout_state", state);
}

export function getLogoutState(): {
  timestamp: number;
  method: "oidc" | "saml";
  returnUrl?: string;
} | null {
  const state = localStorage.getItem("logout_state");
  if (!state) return null;
  try {
    return JSON.parse(state);
  } catch {
    return null;
  }
}

export function clearLogoutState(): void {
  removeFromStorage("logout_state");
}

export function performLocalLogout(): void {
  clearAllStorage();
  clearLogoutState();
}

export function getSessionDuration(createdAt: number): {
  seconds: number;
  formatted: string;
} {
  const seconds = Math.floor((Date.now() - createdAt) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let formatted = "";
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0 || hours > 0) formatted += `${minutes}m `;
  formatted += `${secs}s`;

  return { seconds, formatted };
}
