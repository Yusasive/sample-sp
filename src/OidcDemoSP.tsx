import React, { useState, useRef } from "react";

const OidcDemoSP: React.FC = () => {
  // OIDC State
  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [scope, setScope] = useState("openid profile email offline_access");
  const [nonce, setNonce] = useState("");
  const [code, setCode] = useState("");
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
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState("");
  const codeVerifierRef = useRef<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // SAML State
  const [samlEntityId, setSamlEntityId] = useState("");
  const [samlAcsUrl, setSamlAcsUrl] = useState("");
  const [samlSloUrl, setSamlSloUrl] = useState("");
  const [samlCertificate, setSamlCertificate] = useState("");
  const [samlAttributes, setSamlAttributes] = useState<string>("");

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

  // OIDC Authorization URL
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

  // Start OIDC login
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

  // Handle code from URL and automate token exchange & user info fetch
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setCode(codeParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  React.useEffect(() => {
    // Automatically exchange code for tokens when code is set
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
    // Automatically fetch user info when tokens are set
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
    <div className="sp-shell">
      <div className="sp-card">
        <h1>🧪 Sample Service Provider (OIDC & SAML Demo)</h1>
        <p>
          This page simulates a Service Provider (SP) using OIDC and SAML to connect to an
          authorization server.
        </p>
        <div
          style={{
            background: "#fef3c7",
            padding: 12,
            borderRadius: 8,
            margin: "12px 0",
            borderLeft: "4px solid #f59e0b",
          }}>
          <strong>⚠ Setup Required:</strong>
          <br />
          1. Set <strong>Issuer URL</strong> to your OIDC issuer
          <br />
          2. Set <strong>Client ID</strong>, <strong>Redirect URI</strong>, and other fields
          <br />
          3. Add this page's origin to <strong>allowedOrigins</strong> in your OIDC app
          <br />
          4. Log in to the IdP before testing authorization.
          <br />
          5. For SAML, set Entity ID, ACS URL, SLO URL, and certificate as required by your IdP.
        </div>

        <h2>OIDC Configuration & Flow</h2>
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

        <h2 style={{ marginTop: 32 }}>SAML Configuration (Simulation)</h2>
        <div className="sp-grid">
          <div>
            <label>Entity ID</label>
            <input
              value={samlEntityId}
              onChange={(e) => setSamlEntityId(e.target.value)}
              placeholder="urn:queid:sp:demo"
            />
          </div>
          <div>
            <label>ACS URL</label>
            <input
              value={samlAcsUrl}
              onChange={(e) => setSamlAcsUrl(e.target.value)}
              placeholder="http://sp.local.queid:5174/saml/acs"
            />
          </div>
          <div>
            <label>SLO URL</label>
            <input
              value={samlSloUrl}
              onChange={(e) => setSamlSloUrl(e.target.value)}
              placeholder="http://sp.local.queid:5174/saml/slo"
            />
          </div>
          <div>
            <label>Certificate</label>
            <textarea
              value={samlCertificate}
              onChange={(e) => setSamlCertificate(e.target.value)}
              placeholder="Paste X.509 certificate here"
              rows={3}
            />
          </div>
          <div>
            <label>Attributes (comma separated)</label>
            <input
              value={samlAttributes}
              onChange={(e) => setSamlAttributes(e.target.value)}
              placeholder="email,name,role"
            />
          </div>
        </div>
        <div style={{ marginTop: 16, color: "#666" }}>
          <em>
            SAML flow simulation only. For real SAML, integrate with a SAML library or backend.
          </em>
        </div>
      </div>
    </div>
  );
};

export default OidcDemoSP;
