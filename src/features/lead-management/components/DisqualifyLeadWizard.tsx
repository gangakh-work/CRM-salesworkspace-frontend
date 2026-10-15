import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Ban, Check, Loader2, RotateCcw } from 'lucide-react'
import { type ReactNode } from 'react'
import { type UseFormReturn } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'
import { DisqualificationReasonBadge } from '@/features/lead-management/components/LeadBadges'
import {
  DISQUALIFICATION_REASON_OPTIONS,
  buildFollowUpOwnerOptions,
  REVISIT_AFTER_OPTIONS,
} from '@/features/lead-management/config/disqualification-form.config'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import type { DisqualifyLeadInput } from '@/features/lead-management/domain/disqualification.schema'
import { useDisqualifyLeadWizard } from '@/features/lead-management/hooks/useDisqualifyLeadWizard'
import { cn } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'

export function DisqualifyLeadWizard() {
  const wizard = useDisqualifyLeadWizard()
  const { filterOptions } = useLeadManagement()
  const followUpOwnerOptions = buildFollowUpOwnerOptions(filterOptions.owners)

  if (!wizard.lead) return null

  const handleSubmit = async () => {
    try {
      const result = await wizard.submit()
      if (!result) {
        sonnerToast.error('Please fix validation errors before submitting')
        return
      }
      sonnerToast.warning('Lead disqualified', {
        description: `${result.lead.name} · ${wizard.formatReason(result.disqualification.reason)}`,
      })
    } catch (error) {
      sonnerToast.error('Failed to disqualify lead', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Dialog open={wizard.disqualifyWizardOpen} onOpenChange={(open) => !open && wizard.handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="size-5 text-destructive" />
            Disqualify Lead
          </DialogTitle>
          <DialogDescription>
            Step {wizard.step + 1} of {wizard.steps.length}: {wizard.steps[wizard.step]} ·{' '}
            {wizard.lead.name} · {wizard.displayName}
          </DialogDescription>
        </DialogHeader>

        {!wizard.canDisqualify && (
          <Typography variant="caption" className="rounded-lg bg-destructive/10 p-3 text-destructive">
            {wizard.eligibilityMessage ??
              'Only leads with status New, Contacted, or Qualified can be disqualified.'}
          </Typography>
        )}

        <div
          className="mb-4 flex gap-1"
          role="progressbar"
          aria-valuenow={wizard.step + 1}
          aria-valuemin={1}
          aria-valuemax={wizard.steps.length}
        >
          {wizard.steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= wizard.step ? 'bg-destructive' : 'bg-muted',
              )}
              aria-hidden
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={wizard.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <WizardStepContent
              step={wizard.step}
              form={wizard.form}
              values={wizard.values}
              errors={wizard.errors}
              leadName={wizard.lead.name}
              company={wizard.lead.company}
              previewRecord={wizard.previewRecord}
              formatReason={wizard.formatReason}
              followUpOwnerOptions={followUpOwnerOptions}
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={wizard.handleCancel} disabled={wizard.isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={wizard.handleReset}
              disabled={wizard.isSubmitting || !wizard.isDirty}
            >
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={wizard.back}
              disabled={wizard.step === 0 || wizard.isSubmitting}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            {wizard.step < wizard.steps.length - 1 ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => void wizard.next()}
                disabled={wizard.isSubmitting || !wizard.canDisqualify}
              >
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleSubmit()}
                disabled={wizard.isSubmitting || !wizard.canDisqualify}
              >
                {wizard.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Disqualifying...
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Confirm Disqualification
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function WizardStepContent({
  step,
  form,
  values,
  errors,
  leadName,
  company,
  previewRecord,
  formatReason,
  followUpOwnerOptions,
}: {
  step: number
  form: UseFormReturn<DisqualifyLeadInput>
  values: DisqualifyLeadInput
  errors: UseFormReturn<DisqualifyLeadInput>['formState']['errors']
  leadName: string
  company: string
  previewRecord: ReturnType<typeof useDisqualifyLeadWizard>['previewRecord']
  formatReason: (reason: DisqualifyLeadInput['reason']) => string
  followUpOwnerOptions: ReturnType<typeof buildFollowUpOwnerOptions>
}) {
  const { register, setValue } = form

  if (step === 0) {
    return (
      <Field label="Disqualification Reason *" error={errors.reason?.message}>
        <Select
          value={values.reason}
          onValueChange={(v) =>
            setValue('reason', v as DisqualifyLeadInput['reason'], { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            {DISQUALIFICATION_REASON_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    )
  }

  if (step === 1) {
    return (
      <>
        <Typography variant="caption" tone="muted">
          Optional details about the competitor or additional context.
        </Typography>
        <Field label="Competitor Name" error={errors.competitorName?.message}>
          <Input {...register('competitorName')} placeholder="Optional" />
        </Field>
        <Field label="Remarks" error={errors.remarks?.message}>
          <Textarea
            {...register('remarks')}
            rows={4}
            placeholder="Additional notes about why this lead was disqualified..."
          />
        </Field>
      </>
    )
  }

  if (step === 2) {
    return (
      <>
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <Checkbox
            id="scheduleFollowUp"
            checked={values.scheduleFollowUp}
            onCheckedChange={(checked) =>
              setValue('scheduleFollowUp', checked === true, { shouldValidate: true })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="scheduleFollowUp" className="cursor-pointer font-medium">
              Schedule future follow-up
            </Label>
            <Typography variant="caption" tone="muted">
              Create a revisit task when disqualifying this lead.
            </Typography>
          </div>
        </div>

        {values.scheduleFollowUp && (
          <>
            <Field label="Revisit After *" error={errors.revisitAfterDays?.message}>
              <Select
                value={values.revisitAfterDays ?? ''}
                onValueChange={(v) =>
                  setValue('revisitAfterDays', v as DisqualifyLeadInput['revisitAfterDays'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {REVISIT_AFTER_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Follow-up Owner *" error={errors.followUpOwner?.message}>
              <Select
                value={values.followUpOwner ?? ''}
                onValueChange={(v) => setValue('followUpOwner', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign owner" />
                </SelectTrigger>
                <SelectContent>
                  {followUpOwnerOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}
      </>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <Typography variant="heading-m" className="text-base">
        Review Disqualification
      </Typography>
      <ReviewRow label="Lead" value={`${leadName} · ${company}`} />
      <ReviewRow
        label="Reason"
        value={
          previewRecord ? (
            <DisqualificationReasonBadge reason={previewRecord.reason} />
          ) : (
            formatReason(values.reason)
          )
        }
      />
      {values.competitorName?.trim() && (
        <ReviewRow label="Competitor" value={values.competitorName} />
      )}
      {values.remarks?.trim() && <ReviewRow label="Remarks" value={values.remarks} />}
      <ReviewRow
        label="Future Follow-up"
        value={
          values.scheduleFollowUp ? (
            <Badge variant="warning">
              {values.revisitAfterDays} days · {values.followUpOwner}
            </Badge>
          ) : (
            'None scheduled'
          )
        }
      />
      <Typography variant="caption" tone="muted">
        Confirming will update the lead status to Disqualified, record timeline events, and refresh
        dashboard analytics.
      </Typography>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && (
        <Typography variant="caption" className="text-destructive">
          {error}
        </Typography>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <div className="text-right text-sm font-medium">{value}</div>
    </div>
  )
}
