import type { Configuration } from '@azure/msal-browser'

import { env } from '@/config/env'

export const msalConfig: Configuration = {
  auth: {
    clientId: env.VITE_MSAL_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/${env.VITE_MSAL_TENANT_ID ?? ''}`,
    redirectUri: env.VITE_MSAL_REDIRECT_URI,
    postLogoutRedirectUri: env.VITE_MSAL_REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
}

export const loginRequest = {
  // Request the API's delegated scope so the resulting access token has
  // the audience expected by the FastAPI backend.
  scopes: env.VITE_MSAL_API_SCOPE
    ? [env.VITE_MSAL_API_SCOPE, 'openid', 'profile', 'email']
    : [],
}
