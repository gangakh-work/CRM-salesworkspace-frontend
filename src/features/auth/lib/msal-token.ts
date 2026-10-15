import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser'

import { loginRequest } from '@/config/msalConfig'

export async function acquireApiAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo,
  options?: { interactiveOnFailure?: boolean },
): Promise<string | null> {
  try {
    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account,
    })
    return response.accessToken
  } catch {
    if (options?.interactiveOnFailure) {
      await instance.acquireTokenRedirect({
        ...loginRequest,
        account,
      })
    }
    return null
  }
}
