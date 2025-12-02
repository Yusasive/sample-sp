import type { Tokens } from "@/types/auth";

export interface DecodedToken {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = parts[2];

    return { header, payload, signature };
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeJwt(token);
  if (!decoded || typeof decoded.payload.exp !== "number") return null;
  return new Date(decoded.payload.exp * 1000);
}

export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;
  return new Date() > expiration;
}

export function getTokenExpiresIn(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  return Math.max(0, Math.floor((expiration.getTime() - Date.now()) / 1000));
}

export function getTokensExpirationStatus(tokens: Tokens | null): {
  accessExpired: boolean;
  refreshExpired: boolean;
  accessExpiresIn: number;
  refreshExpiresIn: number;
} {
  return {
    accessExpired: tokens?.access_token ? isTokenExpired(tokens.access_token) : false,
    refreshExpired: tokens?.refresh_token ? isTokenExpired(tokens.refresh_token) : false,
    accessExpiresIn: tokens?.access_token ? getTokenExpiresIn(tokens.access_token) : 0,
    refreshExpiresIn: tokens?.refresh_token ? getTokenExpiresIn(tokens.refresh_token) : 0,
  };
}

export function formatTokenExpirationTime(seconds: number): string {
  if (seconds <= 0) return "Expired";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function maskToken(token: string, visibleChars: number = 10): string {
  if (token.length <= visibleChars) return token;
  const start = token.substring(0, visibleChars);
  const end = token.substring(token.length - visibleChars);
  const masked = "*".repeat(Math.max(10, token.length - visibleChars * 2));
  return `${start}${masked}${end}`;
}
