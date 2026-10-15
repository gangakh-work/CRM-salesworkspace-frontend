import { motion } from 'framer-motion'
import {
  Ban,
  Calendar,
  CheckSquare,
  FileText,
  Mail,
  Phone,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { toast as sonnerToast } from 'sonner'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { canQualifyLead } from '@/features/lead-management/services/lead-qualification.service'
import { canDisqualifyLead } from '@/features/lead-management/services/lead-disqualification.service'
import { canConvertLead } from '@/features/lead-management/services/lead-conversion.service'
import type { Lead } from '@/features/lead-management/types/lead.types'
import {
  fadeIn,
  staggerContainer,
} from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

type DialogType =
  | 'email'
  | 'meeting'
  | 'task'
  | 'proposal'
  | 'assign'
  | null

type ActionDef = {
  id: string
  label: string
  icon: typeof Phone
  tooltip: string
  variant?: 'primary' | 'outline' | 'destructive'
  group: 'engage' | 'pipeline' | 'utility'
}

const ACTIONS: ActionDef[] = [
  {
    id: 'call',
    label: 'Call',
    icon: Phone,
    tooltip: 'Log an outbound call and update last activity.',
    group: 'engage',
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    tooltip: 'Send a follow-up email and track it on the timeline.',
    group: 'engage',
  },
  {
    id: 'meeting',
    label: 'Meeting',
    icon: Calendar,
    tooltip: 'Schedule a discovery or follow-up meeting.',
    group: 'engage',
  },
  {
    id: 'task',
    label: 'Task',
    icon: CheckSquare,
    tooltip: 'Create a follow-up task assigned to the owner.',
    group: 'engage',
  },
  {
    id: 'proposal',
    label: 'Proposal',
    icon: FileText,
    tooltip: 'Send and log a proposal in proposal history.',
    group: 'engage',
  },
  {
    id: 'qualify',
    label: 'Qualify',
    icon: Target,
    tooltip:
      'Mark as qualified and sync Account, Contact, and Opportunity in Dataverse.',
    variant: 'primary',
    group: 'pipeline',
  },
  {
    id: 'convert',
    label: 'Convert',
    icon: TrendingUp,
    tooltip:
      'Convert a qualified lead into CRM records and an opportunity.',
    variant: 'primary',
    group: 'pipeline',
  },
  {
    id: 'disqualify',
    label: 'Disqualify',
    icon: Ban,
    tooltip:
      'Close the lead as lost with a reason code in Dataverse.',
    variant: 'destructive',
    group: 'pipeline',
  },
  {
    id: 'share',
    label: 'Share',
    icon: Share2,
    tooltip: 'Share or copy a link to this lead profile.',
    group: 'utility',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    icon: Sparkles,
    tooltip:
      'Open the AI Assistant with this lead as context.',
    group: 'utility',
  },
  {
    id: 'assign',
    label: 'Assign',
    icon: UserPlus,
    tooltip:
      'Assign or reassign the lead owner in Dataverse.',
    group: 'utility',
  },
]

function ActionButton({
  action,
  disabled,
  onClick,
}: {
  action: ActionDef
  disabled: boolean
  onClick: () => void
}) {
  const Icon = action.icon
  const isPrimary = action.variant === 'primary'
  const isDestructive =
    action.variant === 'destructive'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={
            isPrimary ? 'primary' : 'outline'
          }
          size="sm"
          disabled={disabled}
          className={cn(
            'h-9 gap-1.5 px-3 text-xs shadow-sm transition-all duration-200',
            'hover:-translate-y-0.5 hover:shadow-md',
            isDestructive &&
              'border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive',
            disabled &&
              'pointer-events-auto opacity-50 hover:translate-y-0 hover:shadow-sm',
          )}
          onClick={onClick}
        >
          <Icon className="size-3.5" />
          <span className="hidden sm:inline">
            {action.label}
          </span>
        </Button>
      </TooltipTrigger>

      <TooltipContent
        side="bottom"
        align="center"
        sideOffset={8}
        collisionPadding={16}
        className="max-w-[220px] text-center leading-snug"
      >
        {action.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export function Lead360QuickToolbar({
  lead,
}: {
  lead: Lead
}) {
  const {
    logCall,
    sendEmail,
    scheduleMeeting,
    createTask,
    sendProposal,
    openConvertWizard,
    openDisqualifyWizard,
    openQualifyWizard,
    assignOwner,
    filterOptions,
  } = useLeadManagement()

  const { open: openAssistant } =
    useAiCopilot()

  const [dialog, setDialog] =
    useState<DialogType>(null)

  const [inputValue, setInputValue] =
    useState('')

  const [ownerValue, setOwnerValue] =
    useState(lead.owner)

  const terminal =
    lead.status === 'converted' ||
    lead.status === 'disqualified'

  const closeDialog = () => {
    setDialog(null)
    setInputValue('')
  }

  const isDisabled = (id: string) => {
    if (
      terminal &&
      id !== 'share' &&
      id !== 'assistant'
    ) {
      return true
    }

    if (id === 'qualify') {
      return !canQualifyLead(lead.status)
    }

    if (id === 'convert') {
      return !canConvertLead(
        lead.status,
        lead.convertedOpportunityId,
      )
    }

    if (id === 'disqualify') {
      return !canDisqualifyLead(lead.status)
    }

    return false
  }

  const shareLead = async () => {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: lead.name,
          text: `Lead: ${lead.name} — ${lead.company}`,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)

      sonnerToast.success(
        'Lead link copied to clipboard',
      )
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return
      }

      try {
        await navigator.clipboard.writeText(url)

        sonnerToast.success(
          'Lead link copied to clipboard',
        )
      } catch {
        sonnerToast.error(
          'Unable to share lead',
          {
            description:
              'Please copy the URL from the browser address bar.',
          },
        )
      }
    }
  }

  const handleAction = (id: string) => {
    if (isDisabled(id)) return

    switch (id) {
      case 'call':
        logCall(lead.id)
        break

      case 'email':
        setDialog('email')
        setInputValue(
          'Follow-up: Next Steps',
        )
        break

      case 'meeting':
        setDialog('meeting')
        setInputValue('Discovery Call')
        break

      case 'task':
        setDialog('task')
        setInputValue(
          `Follow up: ${lead.company}`,
        )
        break

      case 'proposal':
        setDialog('proposal')
        setInputValue(
          `${lead.company} Enterprise Proposal`,
        )
        break

      case 'qualify':
        openQualifyWizard(lead.id)
        break

      case 'convert':
        openConvertWizard(lead.id)
        break

      case 'disqualify':
        openDisqualifyWizard(lead.id)
        break

      case 'share':
        void shareLead()
        break

      case 'assistant':
        openAssistant({
          mode: 'docked',
          prompt: `Help me with this lead: ${lead.name} at ${lead.company}.`,
        })
        break

      case 'assign':
        setOwnerValue(lead.owner)
        setDialog('assign')
        break
    }
  }

  const submitDialog = () => {
    if (dialog === 'assign') {
      if (!ownerValue.trim()) return

      assignOwner(
        lead.id,
        ownerValue,
      )

      closeDialog()
      return
    }

    if (!inputValue.trim()) return

    switch (dialog) {
      case 'email':
        sendEmail(
          lead.id,
          inputValue,
        )
        break

      case 'meeting':
        scheduleMeeting(
          lead.id,
          inputValue,
        )
        break

      case 'task':
        createTask(
          lead.id,
          inputValue,
        )
        break

      case 'proposal':
        sendProposal(
          lead.id,
          inputValue,
        )
        break
    }

    closeDialog()
  }

  const engageActions = ACTIONS.filter(
    (a) => a.group === 'engage',
  )

  const pipelineActions = ACTIONS.filter(
    (a) => a.group === 'pipeline',
  )

  const utilityActions = ACTIONS.filter(
    (a) => a.group === 'utility',
  )

  return (
    <>
      <TooltipProvider delayDuration={400}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center gap-3"
        >
          <motion.div
            variants={fadeIn}
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/50 bg-background/70 p-1.5 shadow-sm backdrop-blur-md"
          >
            <Typography
              variant="caption"
              tone="muted"
              className="hidden px-2 font-semibold uppercase tracking-wider lg:inline"
            >
              Engage
            </Typography>

            {engageActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                disabled={isDisabled(action.id)}
                onClick={() =>
                  handleAction(action.id)
                }
              />
            ))}
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-1.5 shadow-sm backdrop-blur-md"
          >
            <Typography
              variant="caption"
              className="hidden px-2 font-semibold uppercase tracking-wider text-primary/80 lg:inline"
            >
              Pipeline
            </Typography>

            {pipelineActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                disabled={isDisabled(action.id)}
                onClick={() =>
                  handleAction(action.id)
                }
              />
            ))}
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="flex items-center"
          >
            {utilityActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                disabled={isDisabled(action.id)}
                onClick={() =>
                  handleAction(action.id)
                }
              />
            ))}
          </motion.div>
        </motion.div>
      </TooltipProvider>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) =>
          !open && closeDialog()
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'email' &&
                'Send Email'}
              {dialog === 'meeting' &&
                'Schedule Meeting'}
              {dialog === 'task' &&
                'Create Task'}
              {dialog === 'proposal' &&
                'Send Proposal'}
              {dialog === 'assign' &&
                'Assign Owner'}
            </DialogTitle>
          </DialogHeader>

          {dialog === 'assign' ? (
            <div className="space-y-2">
              <Label>Owner</Label>

              <Select
                value={ownerValue}
                onValueChange={setOwnerValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>

                <SelectContent>
                  {[
                    ...new Set(
                      [
                        lead.owner,
                        ...filterOptions.owners,
                      ].filter(Boolean),
                    ),
                  ].map((owner) => (
                    <SelectItem
                      key={owner}
                      value={owner}
                    >
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                {dialog === 'email'
                  ? 'Subject'
                  : 'Title'}
              </Label>

              <Input
                value={inputValue}
                onChange={(e) =>
                  setInputValue(
                    e.target.value,
                  )
                }
              />
            </div>
          )}

          {dialog === 'proposal' && (
            <Typography
              variant="caption"
              tone="muted"
            >
              Proposal will be logged and added
              to proposal history.
            </Typography>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={submitDialog}
              disabled={
                dialog === 'assign'
                  ? !ownerValue.trim()
                  : !inputValue.trim()
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}