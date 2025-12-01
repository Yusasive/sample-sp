import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Callback page for OIDC redirect URI.
 * Reads the code from the URL and redirects to the main app page.
 */
export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Redirect to main page with code param
      navigate(`/?code=${encodeURIComponent(code)}`);
    } else {
      // No code found, redirect to home
      navigate("/");
    }
  }, [navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Processing login...</h2>
      <div style={{ margin: "2rem auto", width: 48, height: 48 }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="#2563eb" strokeWidth="4" opacity="0.2" />
          <path
            d="M44 24c0-11.046-8.954-20-20-20"
            stroke="#2563eb"
            strokeWidth="4"
            strokeLinecap="round">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 24 24"
              to="360 24 24"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>
      <p>
        Please wait while we complete your login.
        <br />
        If you are not redirected automatically, <a href="/">click here</a>.
      </p>
    </div>
  );
}
