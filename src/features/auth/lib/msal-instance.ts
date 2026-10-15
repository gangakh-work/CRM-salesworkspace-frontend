import { PublicClientApplication } from '@azure/msal-browser'

import { msalConfig } from '@/config/msalConfig'

export const msalInstance = new PublicClientApplication(msalConfig)

let initializePromise: Promise<void> | null = null

export function ensureMsalInitialized(): Promise<void> {
  if (!initializePromise) {
    initializePromise = msalInstance.initialize().then(() => undefined)
  }
  return initializePromise
}
