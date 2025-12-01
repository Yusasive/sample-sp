import React, { useState } from "react";

/**
 * SAML Demo Component
 * Simulates SAML configuration for a Service Provider.
 * For real SAML integration, connect to a backend or use a SAML library.
 */
const SamlDemo: React.FC = () => {
  const [samlEntityId, setSamlEntityId] = useState("");
  const [samlAcsUrl, setSamlAcsUrl] = useState("");
  const [samlSloUrl, setSamlSloUrl] = useState("");
  const [samlCertificate, setSamlCertificate] = useState("");
  const [samlAttributes, setSamlAttributes] = useState<string>("");

  return (
    <div>
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
        <em>SAML flow simulation only. For real SAML, integrate with a SAML library or backend.</em>
      </div>
    </div>
  );
};

export default SamlDemo;
