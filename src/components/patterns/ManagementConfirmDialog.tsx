import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import type { ConfirmDialogState } from '@/types/confirm-dialog.types'

export interface ManagementConfirmDialogProps {
  confirmDialog: ConfirmDialogState | null
  hideConfirm: () => void
}

/** Binds shared ConfirmDialog to feature management provider state. */
export function ManagementConfirmDialog({ confirmDialog, hideConfirm }: ManagementConfirmDialogProps) {
  return <ConfirmDialog dialog={confirmDialog} onClose={hideConfirm} />
}
