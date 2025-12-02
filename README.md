# Que-ID Service Provider Project

This project is a React + TypeScript demo showing how to act as a Service Provider (SP) using both
OIDC and SAML authentication flows with the Que-ID platform.

## Features

- Login with OIDC (OpenID Connect)
- Login with SAML (Security Assertion Markup Language)
- Automatic configuration via environment variables
- Token management and refresh
- User profile display
- Logout support

## Configuration

All authentication settings are managed via the `.env` file. Example:

```
# OIDC
VITE_OIDC_ISSUER_URL=https://your-idp.com/oidc
VITE_OIDC_CLIENT_ID=your-client-id
VITE_OIDC_REDIRECT_URI=http://localhost:3000/callback

# SAML
VITE_SAML_SP_NAME=Your Service Provider
VITE_SAML_ENTITY_ID=your-entity-id
VITE_SAML_ACS_URL=http://localhost:3000/saml/acs
VITE_SAML_NAMEID_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
VITE_SAML_SLO_URL=http://localhost:3000/saml/slo
VITE_SAML_SLO_BINDING=POST
VITE_SAML_IDP_SSO_URL=https://your-idp.com/sso
VITE_SAML_IDP_SLO_URL=https://your-idp.com/slo
```

**Note:** Never commit secrets in `.env` to version control. Use `.env.example` for sharing variable
names only.

## Setup Instructions

1. Add your OIDC and SAML settings to `.env` as shown above.
2. Register your redirect URIs with your IdP (OIDC and SAML).
3. Run `npm install` to install dependencies.
4. Run `npm run dev` to start the app locally.
5. Use the UI to test OIDC and SAML login flows.

## Usage

- **Login:** Click the login button for OIDC or SAML. You will be redirected to the IdP, then back
  to the app.
- **Profile:** After login, your user details will be shown on the profile page.
- **Tokens:** View and manage your tokens on the tokens page.
- **Logout:** Use the logout button to end your session and optionally redirect to the IdP logout
  endpoint.

## Project Structure

- `src/components/OidcDemo.tsx` – OIDC login flow UI and logic
- `src/components/SamlDemo.tsx` – SAML login flow UI and logic
- `src/hooks/` – Custom React hooks for authentication and token management
- `src/services/` – Service classes for OIDC and SAML protocol handling

## Notes

- The UI is minimal and intended for testing and demonstration.
- For production, ensure secure handling of tokens and secrets.
- You can extend the project to support more advanced features as needed.

---

For questions or support, contact the Que-ID team or refer to the official documentation.
