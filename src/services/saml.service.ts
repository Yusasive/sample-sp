import type { SamlConfig } from "@/types/auth";
import { AuthError, getErrorMessage } from "@/utils/errors";

export interface SamlAssertion {
  sessionIndex: string;
  nameId: string;
  nameIdFormat: string;
  attributes: Record<string, string>;
  notBefore: string;
  notOnOrAfter: string;
}

export interface SamlResponse {
  assertion: SamlAssertion;
  inResponseTo?: string;
  destination?: string;
}

export class SamlService {
  private config: SamlConfig;

  constructor(config: SamlConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: SamlConfig): void {
    if (!config.entityId) throw new AuthError("INVALID_CONFIG", "Entity ID is required");
    if (!config.acsUrl) throw new AuthError("INVALID_CONFIG", "ACS URL is required");
  }

  generateMetadata(): string {
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${this.escapeXml(this.config.entityId)}" validUntil="${oneYearFromNow}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>${this.escapeXml(this.config.nameIdFormat || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress")}</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${this.escapeXml(this.config.acsUrl)}" isDefault="true" index="1"/>
    ${this.config.sloUrl ? `<SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-${this.config.sloBinding === "POST" ? "POST" : "Redirect"}" Location="${this.escapeXml(this.config.sloUrl)}"/>` : ""}
    ${this.config.certificate ? `<KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>${this.extractCertificateContent(this.config.certificate)}</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>` : ""}
  </SPSSODescriptor>
  <Organization>
    <OrganizationName xml:lang="en">${this.escapeXml(this.config.spName || "Service Provider")}</OrganizationName>
  </Organization>
</EntityDescriptor>`;

    return metadata;
  }

  generateAuthRequest(): string {
    const requestId = `_${this.generateId()}`;
    const issueInstant = new Date().toISOString();

    const authRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${requestId}" Version="2.0" IssueInstant="${issueInstant}" Destination="${this.escapeXml(this.config.idpSsoUrl || "")}" AssertionConsumerServiceURL="${this.escapeXml(this.config.acsUrl)}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${this.escapeXml(this.config.entityId)}</saml:Issuer>
  <samlp:NameIDPolicy AllowCreate="true" Format="${this.escapeXml(this.config.nameIdFormat || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress")}"/>
</samlp:AuthnRequest>`;

    return authRequest;
  }

  generateAuthRedirectUrl(idpSsoUrl: string): string {
    try {
      const authRequest = this.generateAuthRequest();
      const encoded = this.deflateAndEncode(authRequest);

      const params = new URLSearchParams({
        SAMLRequest: encoded,
        RelayState: this.generateRelayState(),
      });

      return `${idpSsoUrl}?${params.toString()}`;
    } catch (error) {
      throw new AuthError("AUTH_REQUEST_FAILED", getErrorMessage(error));
    }
  }

  parseAcsResponse(samlResponseBase64: string): SamlResponse {
    try {
      const decoded = atob(samlResponseBase64);

      const nameIdMatch = decoded.match(/<saml:NameID[^>]*>(.*?)<\/saml:NameID>/);
      const nameIdFormatMatch = decoded.match(/<saml:NameID[^>]*Format="([^"]*)"[^>]*>/);

      const attributes: Record<string, string> = {};
      const attributeMatches = decoded.matchAll(
        /<saml:Attribute Name="([^"]*)"[^>]*>.*?<saml:AttributeValue>([^<]*)<\/saml:AttributeValue>/g,
      );

      for (const match of attributeMatches) {
        attributes[match[1]] = match[2];
      }

      const sessionIndexMatch = decoded.match(/SessionIndex="([^"]*)"/);

      return {
        assertion: {
          nameId: nameIdMatch?.[1] || "",
          nameIdFormat: nameIdFormatMatch?.[1] || "",
          attributes,
          sessionIndex: sessionIndexMatch?.[1] || "",
          notBefore: new Date().toISOString(),
          notOnOrAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        destination: this.config.acsUrl,
      };
    } catch (error) {
      throw new AuthError("PARSE_RESPONSE_FAILED", getErrorMessage(error));
    }
  }

  generateLogoutRequest(sessionIndex: string, nameId: string): string {
    const requestId = `_${this.generateId()}`;
    const issueInstant = new Date().toISOString();

    const logoutRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${requestId}" Version="2.0" IssueInstant="${issueInstant}" Destination="${this.escapeXml(this.config.idpSloUrl || "")}">
  <saml:Issuer>${this.escapeXml(this.config.entityId)}</saml:Issuer>
  <saml:NameID Format="${this.escapeXml("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress")}">${this.escapeXml(nameId)}</saml:NameID>
  <samlp:SessionIndex>${this.escapeXml(sessionIndex)}</samlp:SessionIndex>
</samlp:LogoutRequest>`;

    return logoutRequest;
  }

  generateLogoutRedirectUrl(sessionIndex: string, nameId: string, idpSloUrl: string): string {
    try {
      const logoutRequest = this.generateLogoutRequest(sessionIndex, nameId);
      const encoded = this.deflateAndEncode(logoutRequest);

      const params = new URLSearchParams({
        SAMLRequest: encoded,
        RelayState: this.generateRelayState(),
      });

      return `${idpSloUrl}?${params.toString()}`;
    } catch (error) {
      throw new AuthError("LOGOUT_REQUEST_FAILED", getErrorMessage(error));
    }
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private extractCertificateContent(cert: string): string {
    return cert
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\n/g, "")
      .replace(/\s/g, "");
  }

  private deflateAndEncode(xml: string): string {
    return btoa(xml);
  }

  private generateId(): string {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  }

  private generateRelayState(): string {
    return btoa(JSON.stringify({ timestamp: Date.now(), id: this.generateId() }));
  }

  updateConfig(config: Partial<SamlConfig>): void {
    this.config = { ...this.config, ...config };
    this.validateConfig(this.config);
  }

  getConfig(): SamlConfig {
    return { ...this.config };
  }
}
