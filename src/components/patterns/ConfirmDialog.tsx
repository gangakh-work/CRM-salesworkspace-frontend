import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ConfirmDialogState } from '@/types/confirm-dialog.types'

export interface ConfirmDialogProps {
  dialog: ConfirmDialogState | null
  onClose: () => void
}

/** Shared confirmation dialog consumed by feature management modules. */
export function ConfirmDialog({ dialog, onClose }: ConfirmDialogProps) {
  if (!dialog) return null

  const { title, description, confirmLabel = 'Confirm', variant = 'default', onConfirm } = dialog

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={variant === 'destructive' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
