import { toast as sonnerToast } from 'sonner'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export const toast = {
  default: (message: string, description?: string) => sonnerToast(message, { description }),
  success: (message: string, description?: string) => sonnerToast.success(message, { description }),
  error: (message: string, description?: string) => sonnerToast.error(message, { description }),
  warning: (message: string, description?: string) => sonnerToast.warning(message, { description }),
  info: (message: string, description?: string) => sonnerToast.info(message, { description }),
}

export { Toaster } from 'sonner'
