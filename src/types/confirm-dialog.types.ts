/** Shared confirm-dialog contract used by feature management providers. */
export interface ConfirmDialogState {
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}
