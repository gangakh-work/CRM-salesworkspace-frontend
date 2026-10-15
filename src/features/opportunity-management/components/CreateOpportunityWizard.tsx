import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast as sonnerToast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { useCreateOpportunity } from '@/features/opportunity-management/hooks/useOpportunityQueries'
import { useUser } from '@/features/auth/hooks/useUser'

export function CreateOpportunityWizard() {
  const { createWizardOpen, closeCreateWizard, refresh } = useOpportunityManagement()
  const { displayName, email } = useUser()
  const createMutation = useCreateOpportunity({ showToast: false })
  const [name, setName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [expectedRevenue, setExpectedRevenue] = useState('50000')
  const [closeDate, setCloseDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 3)
    return date.toISOString().slice(0, 10)
  })
  const [description, setDescription] = useState('')

  const reset = () => {
    setName('')
    setCustomerName('')
    setExpectedRevenue('50000')
    setDescription('')
  }

  const handleClose = () => {
    if (createMutation.isPending) return
    closeCreateWizard()
    reset()
  }

  const handleSubmit = async () => {
    if (!name.trim() || !customerName.trim()) {
      sonnerToast.error('Name and customer are required')
      return
    }

    try {
      const created = await createMutation.mutateAsync({
        name: name.trim(),
        customerName: customerName.trim(),
        estimatedvalue: Number(expectedRevenue) || 0,
        estimatedclosedate: closeDate,
        closeprobability: 25,
        description: description.trim() || undefined,
        ownerName: displayName,
        ownerEmail: email,
      })
      sonnerToast.success('Opportunity created', {
        description: `${name.trim()} saved in Dynamics 365 UAT.`,
        action: created.crmUrl
          ? {
              label: 'Open in CRM',
              onClick: () => window.open(created.crmUrl, '_blank', 'noopener,noreferrer'),
            }
          : undefined,
      })
      await refresh()
      handleClose()
    } catch (error) {
      sonnerToast.error('Failed to create opportunity', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Dialog open={createWizardOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Opportunity</DialogTitle>
          <DialogDescription>
            Add a new opportunity in Dynamics 365 UAT ({displayName}). Records are assigned to you so they appear under My Opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="opp-name">Opportunity name</Label>
            <Input id="opp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme — Enterprise Deal" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-customer">Customer</Label>
            <Input id="opp-customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Acme Corporation" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opp-revenue">Expected revenue</Label>
              <Input id="opp-revenue" type="number" min={0} value={expectedRevenue} onChange={(e) => setExpectedRevenue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-close">Expected close date</Label>
              <Input id="opp-close" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-desc">Description (optional)</Label>
            <Textarea id="opp-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating…
              </>
            ) : (
              'Create Opportunity'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
