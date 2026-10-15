import { z } from 'zod'

const envSchema = z.object({
  VITE_APP_NAME: z.string().default('Sales Workspace'),
  VITE_APP_VERSION: z.string().default('0.1.0'),
  VITE_ENVIRONMENT: z
    .enum(['development', 'uat', 'production'])
    .default('development'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8000/api/v1'),
  VITE_MSAL_CLIENT_ID: z.string().optional(),
  VITE_MSAL_TENANT_ID: z.string().optional(),
  VITE_MSAL_REDIRECT_URI: z.string().url().default('http://localhost:5173'),
  VITE_MSAL_API_SCOPE: z.string().optional(),
  /** Optional brand video for the welcome hero (mp4/webm URL). */
  VITE_WELCOME_VIDEO_URL: z.string().optional(),
  /** Optional poster image for the welcome hero. */
  VITE_WELCOME_VIDEO_POSTER: z.string().optional(),
  VITE_ENABLE_MOCK_AUTH: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
})

function parseEnv() {
  const result = envSchema.safeParse(import.meta.env)

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors)
    throw new Error('Invalid environment configuration')
  }

  if (result.data.VITE_ENVIRONMENT === 'production' && result.data.VITE_ENABLE_MOCK_AUTH) {
    throw new Error('VITE_ENABLE_MOCK_AUTH must be false in production')
  }

  if (!result.data.VITE_ENABLE_MOCK_AUTH) {
    const missing = [
      !result.data.VITE_MSAL_CLIENT_ID && 'VITE_MSAL_CLIENT_ID',
      !result.data.VITE_MSAL_TENANT_ID && 'VITE_MSAL_TENANT_ID',
      !result.data.VITE_MSAL_API_SCOPE && 'VITE_MSAL_API_SCOPE',
    ].filter(Boolean)
    if (missing.length) {
      throw new Error(`Microsoft sign-in is not configured. Missing: ${missing.join(', ')}`)
    }
  }

  return result.data
}

export const env = parseEnv()

export type Env = z.infer<typeof envSchema>
