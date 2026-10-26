import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'

/** Loads the signed-in user's own Outlook/Teams photo via Microsoft Graph. */
export function useMicrosoftProfilePhoto(email: string) {
  const { instance, accounts } = useMsal()
  const [url, setUrl] = useState<string | undefined>()
  const account = accounts.find(a => a.username.toLowerCase() === email.toLowerCase())
  useEffect(() => {
    if (!account) { setUrl(undefined); return }
    let cancelled = false
    let objectUrl: string | undefined
    void (async () => {
      try {
        const token = await instance.acquireTokenSilent({ scopes: ['User.Read'], account })
        const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: { Authorization: `Bearer ${token.accessToken}` },
        })
        if (!response.ok) return
        const blob = await response.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch { if (!cancelled) setUrl(undefined) }
    })()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [instance, account, email])
  return url
}
