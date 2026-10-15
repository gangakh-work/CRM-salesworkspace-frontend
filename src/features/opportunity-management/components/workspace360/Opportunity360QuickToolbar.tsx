import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckSquare,
  Copy,
  FileText,
  Mail,
  MoreHorizontal,
  PauseCircle,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  UserPlus,
  Share2,
  Sparkles,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUser } from '@/features/auth/hooks/useUser'
import { useAiCopilot } from '@/features/ai-copilot/context/AiCopilotProvider'
import { toast as sonnerToast } from 'sonner'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { isOpportunityAdmin } from '@/features/opportunity-management/lib/auth-roles'
import {
  canMarkAsLost,
  canMarkAsWon,
  formatStage,
  getAllowedTargetStages,
  getNextStage,
  getPreviousStage,
  isOpportunityLocked,
} from '@/features/opportunity-management/lib/opportunity-workflow'
import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'

type DialogType =
  | 'email'
  | 'meeting'
  | 'task'
  | 'assign'
  | null

export function Opportunity360QuickToolbar({
  opp,
}: {
  opp: Opportunity
}) {
  const {
    generateProposal,
    scheduleMeeting,
    createTask,
    sendEmail,
    transitionStage,
    moveToNextStage,
    moveToPreviousStage,
    markOnHold,
    assignOwner,
    markWon,
    markLost,
    duplicateOpportunity,
    deleteOpportunity,
    filterOptions,
  } = useOpportunityManagement()

  const { open: openAssistant } =
    useAiCopilot()

  const { roles } = useUser()
  const isAdmin = isOpportunityAdmin(roles)

  const [dialog, setDialog] =
    useState<DialogType>(null)

  const [inputValue, setInputValue] =
    useState('')

  const [ownerValue, setOwnerValue] =
    useState(opp.owner)

  const closed =
    opp.status === 'won' ||
    opp.status === 'lost'

  const locked =
    isOpportunityLocked(opp) &&
    !isAdmin

  const nextStage =
    getNextStage(opp.stage)

  const prevStage =
    getPreviousStage(opp.stage)

  const allowedStages =
    getAllowedTargetStages(
      opp.stage,
      { isAdmin },
    )

  const closeDialog = () => {
    setDialog(null)
    setInputValue('')
  }

  const shareOpportunity = async () => {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: opp.name,
          text: `Opportunity: ${opp.name}`,
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)

      sonnerToast.success(
        'Opportunity link copied',
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
          'Opportunity link copied',
        )
      } catch {
        sonnerToast.error(
          'Unable to share opportunity',
          {
            description:
              'Please copy the URL from the browser address bar.',
          },
        )
      }
    }
  }

  const submitDialog = () => {
    switch (dialog) {
      case 'email':
        if (!inputValue.trim()) return
        sendEmail(
          opp.id,
          inputValue,
        )
        break

      case 'meeting':
        if (!inputValue.trim()) return
        scheduleMeeting(
          opp.id,
          inputValue,
        )
        break

      case 'task':
        if (!inputValue.trim()) return
        createTask(
          opp.id,
          inputValue,
        )
        break

      case 'assign':
        assignOwner(
          opp.id,
          ownerValue,
        )
        break
    }

    closeDialog()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={
            closed ||
            locked ||
            !nextStage ||
            opp.onHold
          }
          onClick={() =>
            moveToNextStage(opp.id)
          }
        >
          <ArrowRight className="size-4" />
          Next Stage
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={
            closed ||
            !prevStage ||
            opp.onHold
          }
          onClick={() =>
            moveToPreviousStage(opp.id)
          }
        >
          <ArrowLeft className="size-4" />
          Move Back
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={closed}
          onClick={() =>
            markOnHold(
              opp.id,
              !opp.onHold,
            )
          }
        >
          <PauseCircle className="size-4" />
          {opp.onHold
            ? 'Resume'
            : 'On Hold'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          disabled={closed || locked}
          onClick={() =>
            generateProposal(opp.id)
          }
        >
          <FileText className="size-4" />
          Generate Proposal
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void shareOpportunity()
          }
        >
          <Share2 className="size-4" />
          Share
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            openAssistant({
              mode: 'docked',
              prompt: `Help me with this opportunity: ${opp.name} for ${opp.customer}.`,
            })
          }
        >
          <Sparkles className="size-4" />
          Assistant
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={closed}
          onClick={() => {
            setDialog('meeting')
            setInputValue(
              'Executive Review',
            )
          }}
        >
          <Calendar className="size-4" />
          Schedule Meeting
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={closed}
          onClick={() => {
            setDialog('task')
            setInputValue(
              `Follow up: ${opp.customer}`,
            )
          }}
        >
          <CheckSquare className="size-4" />
          Add Activity
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={closed}
          onClick={() => {
            setDialog('email')
            setInputValue(
              `RE: ${opp.name}`,
            )
          }}
        >
          <Mail className="size-4" />
          Send Email
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={
                closed ||
                opp.onHold
              }
            >
              <TrendingUp className="size-4" />
              Update Stage
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            {allowedStages.map(
              (stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={() =>
                    transitionStage(
                      opp.id,
                      stage,
                    )
                  }
                >
                  {formatStage(stage)}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          disabled={
            closed ||
            !canMarkAsWon(opp.stage) ||
            opp.onHold
          }
          onClick={() =>
            markWon(opp.id)
          }
        >
          <ThumbsUp className="size-4" />
          Mark Won
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={
            closed ||
            locked ||
            !canMarkAsLost(opp.stage) ||
            opp.onHold
          }
          onClick={() =>
            markLost(opp.id)
          }
        >
          <ThumbsDown className="size-4" />
          Mark Lost
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setOwnerValue(
                  opp.owner,
                )
                setDialog('assign')
              }}
            >
              <UserPlus className="size-4" />
              Assign Owner
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                duplicateOpportunity(
                  opp.id,
                )
              }
            >
              <Copy className="size-4" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => deleteOpportunity(opp.id)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) =>
          !open && closeDialog()
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === 'email'
                ? 'Send Email'
                : dialog === 'meeting'
                  ? 'Schedule Meeting'
                  : dialog === 'assign'
                    ? 'Assign Owner'
                    : 'Add Activity'}
            </DialogTitle>
          </DialogHeader>

          {dialog === 'assign' ? (
            <div className="space-y-2">
              <Label>Owner</Label>

              <Select
                value={ownerValue}
                onValueChange={
                  setOwnerValue
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {filterOptions.owners.map(
                    (owner) => (
                      <SelectItem
                        key={owner}
                        value={owner}
                      >
                        {owner}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                {dialog === 'email'
                  ? 'Subject'
                  : dialog === 'meeting'
                    ? 'Meeting Title'
                    : 'Activity Subject'}
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
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}