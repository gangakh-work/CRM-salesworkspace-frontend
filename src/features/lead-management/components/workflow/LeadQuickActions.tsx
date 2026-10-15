import {
  Ban,
  Calendar,
  CheckSquare,
  Mail,
  MessageSquare,
  Phone,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { getNextStatuses, formatWorkflowStatus, isTerminalStatus } from '@/features/lead-management/lib/lead-workflow'
import { canQualifyLead } from '@/features/lead-management/services/lead-qualification.service'
import { canDisqualifyLead } from '@/features/lead-management/services/lead-disqualification.service'
import { canConvertLead } from '@/features/lead-management/services/lead-conversion.service'
import type { Lead } from '@/features/lead-management/types/lead.types'

type DialogType = 'note' | 'email' | 'meeting' | 'task' | null

export function LeadQuickActions({ lead }: { lead: Lead }) {
  const {
    logCall,
    sendEmail,
    scheduleMeeting,
    createTask,
    addNote,
    openConvertWizard,
    openDisqualifyWizard,
    openQualifyWizard,
    transitionStatus,
  } = useLeadManagement()

  const [dialog, setDialog] = useState<DialogType>(null)
  const [inputValue, setInputValue] = useState('')
  const terminal = isTerminalStatus(lead.status)
  const nextStatuses = getNextStatuses(lead.status).filter((s) => s !== 'disqualified')

  const closeDialog = () => {
    setDialog(null)
    setInputValue('')
  }

  const submitDialog = () => {
    if (!inputValue.trim()) return
    switch (dialog) {
      case 'note':
        addNote(lead.id, inputValue)
        break
      case 'email':
        sendEmail(lead.id, inputValue)
        break
      case 'meeting':
        scheduleMeeting(lead.id, inputValue)
        break
      case 'task':
        createTask(lead.id, inputValue)
        break
    }
    closeDialog()
  }

  const handleConvert = () => {
    if (canConvertLead(lead.status, lead.convertedOpportunityId)) {
      openConvertWizard(lead.id)
    }
  }

  const handleDisqualify = () => {
    openDisqualifyWizard(lead.id)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={terminal} onClick={() => logCall(lead.id)}>
          <Phone className="size-3.5" />
          Call
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={terminal} onClick={() => { setDialog('email'); setInputValue('Follow-up') }}>
          <Mail className="size-3.5" />
          Email
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={terminal} onClick={() => { setDialog('meeting'); setInputValue('Discovery Call') }}>
          <Calendar className="size-3.5" />
          Meeting
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={terminal} onClick={() => { setDialog('task'); setInputValue(`Follow up: ${lead.company}`) }}>
          <CheckSquare className="size-3.5" />
          Task
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={terminal} onClick={() => setDialog('note')}>
          <MessageSquare className="size-3.5" />
          Note
        </Button>

        {!terminal && canQualifyLead(lead.status) && (
          <Button variant="primary" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openQualifyWizard(lead.id)}>
            <Target className="size-3.5" />
            Qualify
          </Button>
        )}

        {!terminal && canConvertLead(lead.status, lead.convertedOpportunityId) && (
          <Button variant="primary" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleConvert}>
            <TrendingUp className="size-3.5" />
            Convert
          </Button>
        )}
        {!terminal && canDisqualifyLead(lead.status) && (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={handleDisqualify}>
            <Ban className="size-3.5" />
            Disqualify
          </Button>
        )}

        {nextStatuses.filter((s) => s !== 'converted').map((status) => (
          <Button
            key={status}
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => transitionStatus(lead.id, status)}
          >
            → {formatWorkflowStatus(status)}
          </Button>
        ))}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'note' && 'Add Note'}
              {dialog === 'email' && 'Send Email'}
              {dialog === 'meeting' && 'Schedule Meeting'}
              {dialog === 'task' && 'Create Task'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{dialog === 'note' ? 'Note' : dialog === 'email' ? 'Subject' : 'Title'}</Label>
            {dialog === 'note' ? (
              <Textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} rows={4} placeholder="Enter note..." />
            ) : (
              <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="primary" onClick={submitDialog} disabled={!inputValue.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
