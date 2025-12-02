import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      navigate(`/callback/oidc?code=${encodeURIComponent(code)}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <h2>Processing your login...</h2>
        <div style={{ margin: "2rem auto", width: 48, height: 48 }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="4" opacity="0.2" />
            <path
              d="M44 24c0-11.046-8.954-20-20-20"
              stroke="#fff"
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
          If you are not redirected automatically, <a href="/dashboard" style={{ color: "#fff" }}>click here</a>.
        </p>
      </div>
    </div>
  );
}
