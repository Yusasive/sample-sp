# Que-ID Service Provider Demo

This is a sample React + TypeScript app demonstrating how to integrate with the Que-ID platform as a
Service Provider (SP) using OIDC.

## Features

- Login with Que-ID (OIDC Authorization Code flow)
- Exchange authorization code for tokens
- Display access and refresh tokens
- Fetch and display user info

## Setup Instructions

1. Create a `.env` file in the project root and set your OIDC config:

```
VITE_OIDC_ISSUER=https://api.que.id/oidc/your-tenant
VITE_CLIENT_ID=your-client-id
```

2. Register your redirect URI (`http://localhost:5173` or your deployed URL) in the Que-ID
   application settings.
3. Run `npm install` to install dependencies.
4. Run `npm run dev` to start the app locally.
5. Click "Login with Que-ID" to start the authentication flow.
6. After login, copy the authorization code and exchange it for tokens.
7. Use the "Get User Info" button to fetch user profile data.

## Notes

- This demo uses placeholder PKCE values. For production, implement real PKCE challenge/verifier
  generation.
- The UI is minimal and intended for testing and demonstration purposes.
