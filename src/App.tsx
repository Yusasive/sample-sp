import { useState, useEffect, useRef } from "react";

interface Tokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  [key: string]: unknown;
}

interface UserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  [key: string]: unknown;
}
import "./App.css";

// OIDC config from environment variables
const OIDC_ISSUER = import.meta.env.VITE_OIDC_ISSUER;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = window.location.origin;

// PKCE helpers
function base64UrlEncode(arrayBuffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateCodeVerifier(length = 64) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

function App() {
  // Removed unused authUrl state
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState<Tokens | null>(() => {
    try {
      const stored = localStorage.getItem("queid_sp_tokens");
      return stored ? (JSON.parse(stored) as Tokens) : null;
    } catch {
      return null;
    }
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const codeVerifierRef = useRef<string>("");

  // Persist tokens to localStorage
  const persistTokens = (data: Tokens) => {
    setTokens(data);
    try {
      localStorage.setItem("queid_sp_tokens", JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  // Build OIDC authorization URL with real PKCE
  const buildAuthUrl = async () => {
    // Generate PKCE values
    const verifier = generateCodeVerifier();
    codeVerifierRef.current = verifier;
    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "openid profile email",
      state: "demo-state",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return `${OIDC_ISSUER}/authorize?${params.toString()}`;
  };

  // Start login
  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const url = await buildAuthUrl();
      window.location.href = url;
    } catch (e) {
      setError("Failed to start login: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  // Exchange code for tokens
  // Removed unused handleTokenExchange function

  // Fetch user info
  const handleUserInfo = async () => {
    setError("");
    try {
      const res = await fetch(`${OIDC_ISSUER}/userinfo`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokens?.access_token}` },
      });
      const data: UserInfo = await res.json();
      if (!res.ok)
        throw new Error(
          typeof data.error_description === "string" ? data.error_description : "UserInfo failed",
        );
      setUserInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // Handle code from URL and automate token exchange & user info fetch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setCode(codeParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Automatically exchange code for tokens when code is set
    if (code) {
      (async () => {
        setIsLoading(true);
        setError("");
        try {
          const res = await fetch(`${OIDC_ISSUER}/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grant_type: "authorization_code",
              code,
              redirect_uri: REDIRECT_URI,
              client_id: CLIENT_ID,
              code_verifier: codeVerifierRef.current,
            }),
          });
          const data = await res.json();
          if (!res.ok)
            throw new Error(
              typeof data.error_description === "string"
                ? data.error_description
                : "Token exchange failed",
            );
          persistTokens(data);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [code]);

  useEffect(() => {
    // Automatically fetch user info when tokens are set
    if (tokens && tokens.access_token) {
      (async () => {
        setError("");
        try {
          const res = await fetch(`${OIDC_ISSUER}/userinfo`, {
            method: "GET",
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const data = await res.json();
          if (!res.ok)
            throw new Error(
              typeof data.error_description === "string"
                ? data.error_description
                : "UserInfo failed",
            );
          setUserInfo(data);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      })();
    }
  }, [tokens]);

  // Load tokens from localStorage on mount (already handled in useState initializer)

  return (
    <div className="container" style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: 8 }}>Que-ID Service Provider Demo</h1>
      <div
        className="card"
        style={{
          boxShadow: "0 2px 12px #e0e7ef",
          borderRadius: 12,
          background: "#f8fafc",
          padding: "2em",
        }}>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 24px",
            fontSize: 18,
            cursor: "pointer",
            marginBottom: 16,
            boxShadow: isLoading ? "none" : "0 1px 4px #cbd5e1",
            opacity: isLoading ? 0.7 : 1,
          }}>
          {isLoading ? "Starting..." : "Login with Que-ID"}
        </button>
        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
        {/* OIDC flow is now fully automatic; no manual code entry or exchange button needed */}
        {tokens && (
          <div style={{ marginTop: 16 }}>
            <h3>Tokens</h3>
            <pre>{JSON.stringify(tokens, null, 2)}</pre>
            <button onClick={handleUserInfo} disabled={isLoading}>
              {isLoading ? "Loading..." : "Get User Info"}
            </button>
            <button
              style={{
                marginLeft: 12,
                background: "#eee",
                color: "#333",
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: "4px 12px",
              }}
              onClick={() => {
                setTokens(null);
                setUserInfo(null);
                localStorage.removeItem("queid_sp_tokens");
              }}>
              Logout
            </button>
          </div>
        )}
        {userInfo && (
          <div style={{ marginTop: 16 }}>
            <h3>User Info</h3>
            <pre>{JSON.stringify(userInfo, null, 2)}</pre>
          </div>
        )}
        {error && (
          <div
            style={{
              color: "red",
              marginTop: 16,
              border: "1px solid #f00",
              padding: 8,
              borderRadius: 4,
              background: "#fff0f0",
            }}>
            <strong>Error:</strong> {error}
            <button style={{ marginLeft: 12 }} onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 32 }}>
        <h2>Setup Instructions</h2>
        <ol>
          <li>
            Update <b>OIDC_ISSUER</b> and <b>CLIENT_ID</b> in <code>src/App.tsx</code> to match your
            Que-ID platform settings.
          </li>
          <li>
            Register your redirect URI (<code>{REDIRECT_URI}</code>) in the Que-ID application
            settings.
          </li>
          <li>
            Run <code>npm install</code> and <code>npm run dev</code> to start the app.
          </li>
          <li>Click "Login with Que-ID" to start the authentication flow.</li>
          <li>After login, copy the authorization code and exchange it for tokens.</li>
          <li>Use the "Get User Info" button to fetch user profile data.</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
