
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import {
  PublicClientApplication,
  InteractionRequiredAuthError,
} from '@azure/msal-browser'
import {
  MsalProvider,
  useMsal,
  useIsAuthenticated,
} from '@azure/msal-react'

import Icon from './components/Icon'
import BrandLogo from './components/BrandLogo'

const AuthContext = createContext({
  profile: null,
  photo: '',
  signOut: () => {},
})

export const useAuth = () => useContext(AuthContext)

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID || import.meta.env.VITE_ENTRA_CLIENT_ID || ''
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID || import.meta.env.VITE_ENTRA_TENANT_ID || 'common'
const redirectUri =
  import.meta.env.VITE_ENTRA_REDIRECT_URI || window.location.origin

const msal = new PublicClientApplication({
  auth: {
    clientId:
      clientId || '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
})

const scopes = ['User.Read', 'email', 'profile']

// CRM backend API scope
const backendScope = import.meta.env.VITE_MSAL_API_SCOPE || ''

// Acquire Microsoft Graph delegated token for calendar actions.
export async function getMicrosoftGraphToken() {
  const accounts = msal.getAllAccounts()

  if (!accounts.length) {
    throw new Error('Please sign in with Microsoft first.')
  }

  const requested = (
    import.meta.env.VITE_MS_GRAPH_SCOPES || ''
  )
    .split(/[ ,]+/)
    .filter(Boolean)

  if (!requested.length) {
    throw new Error(
      'Calendar integration is ready in the UI, but VITE_MS_GRAPH_SCOPES is not configured. Add Calendars.ReadWrite after Graph permission is approved.'
    )
  }

  try {
    const result = await msal.acquireTokenSilent({
      scopes: requested,
      account: accounts[0],
    })

    return result.accessToken
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      const result = await msal.acquireTokenPopup({
        scopes: requested,
        account: accounts[0],
      })

      return result.accessToken
    }

    throw error
  }
}

// Get Microsoft access token for the CRM backend
export async function getBackendAccessToken() {
  const accounts = msal.getAllAccounts()

  if (!accounts.length) {
    throw new Error('Please sign in with Microsoft first.')
  }

  if (!backendScope) {
    throw new Error(
      'VITE_MSAL_API_SCOPE is missing from frontend .env'
    )
  }

  try {
    const result = await msal.acquireTokenSilent({
      scopes: [backendScope],
      account: accounts[0],
    })

    return result.accessToken
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      const result = await msal.acquireTokenPopup({
        scopes: [backendScope],
        account: accounts[0],
      })

      return result.accessToken
    }

    throw error
  }
}

function SignInGate({ children }) {
  const { instance, accounts } = useMsal()
  const authenticated = useIsAuthenticated()

  const [photo, setPhoto] = useState('')
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authenticated || !accounts[0]) return

    let objectUrl = ''

    ;(async () => {
      try {
        const token = await instance
          .acquireTokenSilent({
            scopes,
            account: accounts[0],
          })
          .catch(async (e) => {
            if (e instanceof InteractionRequiredAuthError) {
              return instance.acquireTokenPopup({
                scopes,
                account: accounts[0],
              })
            }

            throw e
          })

        const headers = {
          Authorization: `Bearer ${token.accessToken}`,
        }

        const me = await fetch(
          'https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName,jobTitle',
          { headers }
        )

        if (me.ok) {
          setProfile(await me.json())
        }

        const image = await fetch(
          'https://graph.microsoft.com/v1.0/me/photo/$value',
          { headers }
        )

        if (image.ok) {
          objectUrl = URL.createObjectURL(await image.blob())
          setPhoto(objectUrl)
        }
      } catch (e) {
        setError(
          e.message || 'Unable to retrieve Microsoft profile.'
        )
      }
    })()

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [authenticated, accounts, instance])

  const account = accounts[0]

  const resolvedProfile =
    profile ||
    (account
      ? {
          displayName: account.name,
          mail: account.username,
          userPrincipalName: account.username,
        }
      : null)

  const authValue = {
    profile: resolvedProfile,
    photo,
    signOut: () => instance.logoutRedirect(),
  }

  if (authenticated) {
    return (
      <AuthContext.Provider value={authValue}>
        <div className="signed-shell">
          {children}
          {error && (
            <div className="auth-note">
              Microsoft profile: {error}
            </div>
          )}
        </div>
      </AuthContext.Provider>
    )
  }

  const startMicrosoftSignIn = () => {
    if (
      !clientId ||
      !(import.meta.env.VITE_MSAL_TENANT_ID || import.meta.env.VITE_ENTRA_TENANT_ID) ||
      !backendScope
    ) {
      setError(
        'Microsoft sign-in configuration is incomplete. Check VITE_ENTRA_CLIENT_ID, VITE_ENTRA_TENANT_ID and VITE_MSAL_API_SCOPE, then restart Vite.'
      )
      return
    }

    instance.loginRedirect({
      scopes,
      prompt: 'select_account',
    })
  }

  return (
    <main className="login-screen">
      <div className="login-bg-image" />
      <div className="login-warm-overlay" />

      <header className="login-topbar">
        <div className="login-top-brand">
          <BrandLogo className="sonata-logo-header" />
          <span>
            <small>CRM Sales Workspace</small>
          </span>
        </div>
      </header>

      <div className="login-landing">
        <section className="login-hero">
          <div className="login-badge">
            <i />
            Enterprise CRM Workspace
          </div>

          <h1>
            The AI-Powered


            CRM for <em>Sales Teams</em>
          </h1>

          <p className="login-hero-copy">
            Unify leads, opportunities, RFPs and proposals. Work smarter
            <br className="desktop-break" />
            with AI agents, real-time CRM data and guided next steps.
          </p>

          <div className="login-features">
            <div>
              <span>
                <Icon name="users" size={30} />
              </span>
              <b>Manage Leads</b>
              <small>Capture · Qualify · Convert</small>
            </div>

            <div>
              <span>
                <Icon name="chart" size={30} />
              </span>
              <b>Drive Opportunities</b>
              <small>Track · Prioritize · Grow</small>
            </div>

            <div>
              <span>
                <Icon name="doc" size={30} />
              </span>
              <b>Accelerate Deals</b>
              <small>RFPs · Proposals · Commercials</small>
            </div>

            <div>
              <span>
                <Icon name="sparkle" size={30} />
              </span>
              <b>AI Sales Assistant</b>
              <small>Insights · Actions · Next Steps</small>
            </div>
          </div>
        </section>

        <section className="login-form-card microsoft-only-card">
          <div className="login-card-brand">
            <BrandLogo className="sonata-logo-card" />
          </div>

          <div className="login-card-eyebrow">
            SIGN IN TO CONTINUE
          </div>

          <h2>Welcome back</h2>

          <p className="login-card-sub">
            Use your Microsoft work account to access Sonata CRM.
            Secure access is reserved for authorized Sonata users.
          </p>

          <button
            type="button"
            className="microsoft-signin"
            disabled={!clientId}
            onClick={startMicrosoftSignIn}
          >
            <span className="ms-grid" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            Sign in with Microsoft
          </button>

          {error && (
            <p className="auth-note" role="alert">
              {error}
            </p>
          )}

          {(!clientId ||
            !(import.meta.env.VITE_MSAL_TENANT_ID || import.meta.env.VITE_ENTRA_TENANT_ID) ||
            !backendScope) && (
            <p className="auth-note">
              Microsoft sign-in requires VITE_ENTRA_CLIENT_ID,
              VITE_ENTRA_TENANT_ID and VITE_MSAL_API_SCOPE in the
              frontend .env file. Restart Vite after updating it.
            </p>
          )}

          <div className="login-card-footer">
            <span>Secured session</span>
            <span>Sonata Software</span>
          </div>
        </section>
      </div>

      <svg
        className="login-waves"
        viewBox="0 0 1600 280"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 130 C220 10 310 250 520 145 S850 45 1030 145 S1350 250 1600 80" />
        <path d="M0 185 C210 55 360 290 610 165 S940 75 1130 175 S1400 255 1600 125" />
        <path d="M0 225 C260 110 360 290 650 205 S980 120 1190 215 S1430 260 1600 180" />
      </svg>
    </main>
  )
}

export default function AuthShell({ children }) {
  return (
    <MsalProvider instance={msal}>
      <SignInGate>{children}</SignInGate>
    </MsalProvider>
  )
}

