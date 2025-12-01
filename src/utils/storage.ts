export const STORAGE_KEYS = {
  TOKENS: "queid_sp_tokens",
  PKCE_VERIFIER: "queid_sp_pkce_verifier",
  AUTH_STATE: "queid_sp_auth_state",
  INTERACTION_ID: "queid_sp_interaction_id",
} as const;

export function getFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(`Failed to save to storage: ${key}`);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    console.error(`Failed to remove from storage: ${key}`);
  }
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => removeFromStorage(key));
}
