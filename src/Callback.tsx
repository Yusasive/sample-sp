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
      <p>
        If you are not redirected automatically, <a href="/">click here</a>.
      </p>
    </div>
  );
}
