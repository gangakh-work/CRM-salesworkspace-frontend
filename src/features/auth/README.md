# Authentication

Microsoft Entra ID (MSAL) for UAT/production; mock auth for local development.

## Folder Structure

```
features/auth/
├── components/
│   ├── CompanyLogo.tsx
│   ├── LoginBackground.tsx
│   ├── LoginCard.tsx           # Sign in with Microsoft (or mock)
│   └── MsalAppProvider.tsx     # MSAL init + MsalProvider wrapper
├── constants/
│   └── mock-user.ts
├── context/
│   ├── auth-context.ts         # Shared AuthContext type + hook
│   ├── AuthProvider.tsx        # Mock auth (VITE_ENABLE_MOCK_AUTH=true)
│   └── MsalAuthProvider.tsx    # Real SSO (VITE_ENABLE_MOCK_AUTH=false)
├── hooks/
│   ├── useAuth.ts
│   ├── useSession.ts
│   └── useUser.ts
├── lib/
│   ├── auth-storage.ts         # Mock session persistence
│   ├── msal-instance.ts        # Singleton PublicClientApplication
│   ├── msal-token.ts           # API access token acquisition
│   └── msal-user.ts            # Map MSAL account → User
└── pages/
    └── LoginPage.tsx
```

## Provider Selection

`AppProviders` chooses auth mode from env:

| `VITE_ENABLE_MOCK_AUTH` | Provider stack |
|-------------------------|----------------|
| `true` (local dev default) | `AuthProvider` → mock login |
| `false` (UAT/production) | `MsalAppProvider` → `MsalAuthProvider` → Microsoft SSO |

## Environment Variables

See `frontend/.env.example` (local) and `frontend/.env.uat.example` (UAT SWA).

## UAT Deployment

- **Frontend:** Azure Static Web App — `https://yellow-grass-0d1449000.7.azurestaticapps.net`
- **Entra redirect URI:** must include the SWA URL in `app-sales-crm-hub-web` → Authentication
- **API:** `https://sales-workspace-api-uat.azurewebsites.net/api/v1` (App Service — deploy separately)
