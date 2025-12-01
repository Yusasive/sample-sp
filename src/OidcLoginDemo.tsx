import React, { useState, useRef } from "react";

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

const defaultIssuer = import.meta.env.VITE_OIDC_ISSUER_URL || "";
const defaultClientId = import.meta.env.VITE_OIDC_CLIENT_ID || "";
const defaultRedirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI || "";

const OidcLoginDemo: React.FC = () => {
  const [issuer, setIssuer] = useState(defaultIssuer);
  const [clientId, setClientId] = useState(defaultClientId);
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(defaultRedirectUri);
  const [scope, setScope] = useState("openid profile email offline_access");
  const [nonce, setNonce] = useState("");
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState("");
  const codeVerifierRef = useRef<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const buildAuthUrl = async () => {
    const verifier = generateCodeVerifier();
    codeVerifierRef.current = verifier;
    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams({
      response_type: "code",
      clientId,
      redirectUri,
      scope,
      state: "demo-state",
      code_challenge: challenge,
      code_challenge_method: "S256",
      nonce,
    });
    return `${issuer}/authorize?${params.toString()}`;
  };

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

  const handleUserInfo = async () => {
    setError("");
    try {
      const res = await fetch(`${issuer}/userinfo`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokens?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || "UserInfo failed");
      setUserInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setCode(codeParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  React.useEffect(() => {
    if (code) {
      (async () => {
        setIsLoading(true);
        setError("");
        try {
          const res = await fetch(`${issuer}/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grant_type: "authorization_code",
              code,
              redirectUri,
              clientId,
              code_verifier: codeVerifierRef.current,
              client_secret: clientSecret,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error_description || "Token exchange failed");
          setTokens(data);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [code, issuer, clientId, clientSecret, redirectUri]);

  React.useEffect(() => {
    if (tokens && tokens.access_token) {
      (async () => {
        setError("");
        try {
          const res = await fetch(`${issuer}/userinfo`, {
            method: "GET",
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error_description || "UserInfo failed");
          setUserInfo(data);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      })();
    }
  }, [tokens, issuer]);

  return (
    <div>
      <h2 style={{ color: "black" }} >OIDC Configuration & Flow</h2>
      <div className="sp-grid">
        <div>
          <label>Issuer URL</label>
          <input
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="http://api.local.queid:3000/oidc/acme"
          />
        </div>
        <div>
          <label>Client ID</label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="app_xxxx"
          />
        </div>
        <div>
          <label>Client Secret (optional)</label>
          <input
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="for confidential clients"
          />
        </div>
        <div>
          <label>Redirect URI</label>
          <input
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder="http://sp.local.queid:5174/callback"
          />
        </div>
        <div>
          <label>Scopes</label>
          <input value={scope} onChange={(e) => setScope(e.target.value)} />
        </div>
        <div>
          <label>Nonce (optional)</label>
          <input
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            placeholder="auto-generated if empty"
          />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={handleLogin} disabled={isLoading} style={{ marginRight: 8 }}>
          {isLoading ? "Starting..." : "Login with OIDC"}
        </button>
      </div>
      {tokens && (
        <div style={{ marginTop: 16 }}>
          <h3>Tokens</h3>
          <pre>{JSON.stringify(tokens, null, 2)}</pre>
          <button onClick={handleUserInfo} disabled={isLoading} style={{ marginRight: 8 }}>
            {isLoading ? "Loading..." : "Get User Info"}
          </button>
          <button
            onClick={() => {
              setTokens(null);
              setUserInfo(null);
            }}
            style={{ marginLeft: 8 }}>
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
  );
};

export default OidcLoginDemo;
