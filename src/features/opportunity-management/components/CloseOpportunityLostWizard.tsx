import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, ThumbsDown } from 'lucide-react'
import { type ReactNode } from 'react'
import { type UseFormReturn } from 'react-hook-form'

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
import {
  buildFollowUpOwnerOptions,
  LOST_REASON_OPTIONS,
} from '@/features/opportunity-management/config/lost-form.config'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import type { CloseAsLostInput } from '@/features/opportunity-management/domain/lost.schema'
import { useCloseOpportunityLostWizard } from '@/features/opportunity-management/hooks/useCloseOpportunityLostWizard'
import type { OpportunityStage } from '@/features/opportunity-management/types/opportunity.types'
import { cn } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'

export function CloseOpportunityLostWizard() {
  const wizard = useCloseOpportunityLostWizard()
  const { filterOptions } = useOpportunityManagement()
  const followUpOwnerOptions = buildFollowUpOwnerOptions(filterOptions.owners)

  if (!wizard.opportunity) return null

  const handleSubmit = async () => {
    try {
      wizard.form.setValue('confirmed', true, { shouldValidate: true })
      const result = await wizard.submit()
      if (!result) {
        sonnerToast.error('Please fix validation errors before submitting')
        return
      }
      sonnerToast.success('Opportunity closed as Lost', {
        description: `${result.opportunity.name} · ${wizard.buildSummary(wizard.values)}`,
      })
    } catch (error) {
      sonnerToast.error('Failed to close as lost', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Dialog open={wizard.lostWizardOpen} onOpenChange={(open) => !open && wizard.handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsDown className="size-5 text-destructive" />
            Close as Lost
          </DialogTitle>
          <DialogDescription>
            Step {wizard.step + 1} of {wizard.steps.length}: {wizard.steps[wizard.step]} ·{' '}
            {wizard.opportunity.name} · {wizard.displayName}
          </DialogDescription>
        </DialogHeader>

        {!wizard.canClose && (
          <Typography variant="caption" className="rounded-lg bg-destructive/10 p-3 text-destructive">
            {wizard.eligibilityMessage ??
              'Only opportunities in Commercial Review, Negotiation, or Contract Review can be marked as Lost.'}
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
            <LostStepContent
              step={wizard.step}
              form={wizard.form}
              values={wizard.values}
              errors={wizard.errors}
              opportunityName={wizard.opportunity.name}
              customer={wizard.opportunity.customer}
              stage={wizard.opportunity.stage}
              formatStage={wizard.formatStage}
              getLostReasonLabel={wizard.getLostReasonLabel}
              buildSummary={wizard.buildSummary}
              followUpOwnerOptions={followUpOwnerOptions}
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={wizard.handleCancel} disabled={wizard.isSubmitting}>
            Cancel
          </Button>
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
                variant="primary"
                onClick={() => void wizard.next()}
                disabled={wizard.isSubmitting || !wizard.canClose}
              >
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                onClick={() => void handleSubmit()}
                disabled={wizard.isSubmitting || !wizard.canClose}
              >
                {wizard.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Closing...
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Confirm Lost
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

function LostStepContent({
  step,
  form,
  values,
  errors,
  opportunityName,
  customer,
  stage,
  formatStage,
  getLostReasonLabel,
  buildSummary,
  followUpOwnerOptions,
}: {
  step: number
  form: UseFormReturn<CloseAsLostInput>
  values: CloseAsLostInput
  errors: UseFormReturn<CloseAsLostInput>['formState']['errors']
  opportunityName: string
  customer: string
  stage: OpportunityStage
  formatStage: (stage: OpportunityStage) => string
  getLostReasonLabel: (reason: CloseAsLostInput['lostReason']) => string
  buildSummary: (input: CloseAsLostInput) => string
  followUpOwnerOptions: ReturnType<typeof buildFollowUpOwnerOptions>
}) {
  const { register, setValue } = form

  if (step === 0) {
    return (
      <>
        <Typography variant="caption" tone="muted">
          Record why {opportunityName} at {customer} was lost.
        </Typography>
        <Field label="Lost Reason *" error={errors.lostReason?.message}>
          <Select
            value={values.lostReason}
            onValueChange={(v) =>
              setValue('lostReason', v as CloseAsLostInput['lostReason'], { shouldValidate: true })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOST_REASON_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </>
    )
  }

  if (step === 1) {
    return (
      <>
        <Field label="Competitor Name" error={errors.competitorName?.message}>
          <Input {...register('competitorName')} placeholder="Optional unless lost to competitor" />
        </Field>
        <Field label="Competitor Solution" error={errors.competitorSolution?.message}>
          <Input {...register('competitorSolution')} />
        </Field>
        <Field label="Price Difference" error={errors.priceDifference?.message}>
          <Input {...register('priceDifference')} placeholder="e.g. 15% higher" />
        </Field>
        <Field label="Remarks" error={errors.lostRemarks?.message}>
          <Textarea {...register('lostRemarks')} rows={3} />
        </Field>
      </>
    )
  }

  if (step === 2) {
    return (
      <>
        <Field label="Will revisit? *" error={errors.willRevisit?.message}>
          <Select
            value={values.willRevisit}
            onValueChange={(v) =>
              setValue('willRevisit', v as 'yes' | 'no', { shouldValidate: true })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {values.willRevisit === 'yes' && (
          <>
            <Field label="Expected Follow-up Date *" error={errors.followUpDate?.message}>
              <Input {...register('followUpDate')} type="date" />
            </Field>
            <Field label="Follow-up Owner *" error={errors.followUpOwner?.message}>
              <Select
                value={values.followUpOwner}
                onValueChange={(v) => setValue('followUpOwner', v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {followUpOwnerOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
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
    <>
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
        <Typography variant="body" className="font-semibold">{opportunityName}</Typography>
        <Typography variant="caption" tone="muted">{customer} · {formatStage(stage)}</Typography>
        <Typography variant="caption">{buildSummary(values)}</Typography>
        <Typography variant="caption" tone="muted">
          Reason: {getLostReasonLabel(values.lostReason)}
        </Typography>
        {values.competitorName && (
          <Typography variant="caption" tone="muted">
            Competitor: {values.competitorName}
          </Typography>
        )}
        {values.lostRemarks && (
          <Typography variant="caption" tone="muted">Remarks: {values.lostRemarks}</Typography>
        )}
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="lost-confirmed"
          checked={values.confirmed}
          onCheckedChange={(checked) =>
            setValue('confirmed', checked === true, { shouldValidate: true })
          }
        />
        <Label htmlFor="lost-confirmed" className="text-sm leading-snug">
          I confirm this opportunity should be closed as Lost and locked from further edits.
        </Label>
      </div>
      {errors.confirmed?.message && (
        <Typography variant="caption" className="text-destructive">{errors.confirmed.message}</Typography>
      )}
    </>
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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <Typography variant="caption" className="text-destructive">{error}</Typography>}
    </div>
  )
}
