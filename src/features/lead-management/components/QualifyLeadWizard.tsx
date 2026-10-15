import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from 'lucide-react'
import { type ReactNode } from 'react'
import { type UseFormReturn } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  BUDGET_RANGE_OPTIONS,
  BUYING_TIMELINE_OPTIONS,
  PRIORITY_OPTIONS,
  PRODUCT_OPTIONS,
  YES_NO_OPTIONS,
} from '@/features/lead-management/config/qualification-form.config'
import type { QualifyLeadInput } from '@/features/lead-management/domain/qualification.schema'
import { QualificationRatingBadge } from '@/features/lead-management/components/LeadBadges'
import { useQualifyLeadWizard } from '@/features/lead-management/hooks/useQualifyLeadWizard'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'

export function QualifyLeadWizard() {
  const wizard = useQualifyLeadWizard()

  if (!wizard.lead) return null

  const handleSubmit = async () => {
    try {
      const result = await wizard.submit()
      if (!result) {
        sonnerToast.error('Please fix validation errors before submitting')
        return
      }
      sonnerToast.success('Lead qualified successfully', {
        description: `${result.lead.name} is now Qualified · ${wizard.formatRating(result.qualification.qualificationRating)} (${result.qualification.qualificationScore})`,
      })
    } catch (error) {
      sonnerToast.error('Failed to qualify lead', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Dialog open={wizard.qualifyWizardOpen} onOpenChange={(open) => !open && wizard.handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Qualify Lead</DialogTitle>
          <DialogDescription>
            Step {wizard.step + 1} of {wizard.steps.length}: {wizard.steps[wizard.step]} ·{' '}
            {wizard.lead.name} · {wizard.displayName}
          </DialogDescription>
        </DialogHeader>

        {!wizard.canQualify && (
          <Typography variant="caption" className="rounded-lg bg-destructive/10 p-3 text-destructive">
            Only leads with status New or Contacted can be qualified.
          </Typography>
        )}

        <div className="mb-4 flex gap-1" role="progressbar" aria-valuenow={wizard.step + 1} aria-valuemin={1} aria-valuemax={wizard.steps.length}>
          {wizard.steps.map((s, i) => (
            <div
              key={s}
              className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= wizard.step ? 'bg-primary' : 'bg-muted')}
              aria-hidden
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={wizard.step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <WizardStepContent step={wizard.step} form={wizard.form} values={wizard.values} errors={wizard.errors} leadName={wizard.lead.name} company={wizard.lead.company} previewScore={wizard.previewScore} />
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={wizard.handleCancel} disabled={wizard.isSubmitting}>Cancel</Button>
            <Button type="button" variant="outline" onClick={wizard.handleReset} disabled={wizard.isSubmitting || !wizard.isDirty}>
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={wizard.back} disabled={wizard.step === 0 || wizard.isSubmitting}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {wizard.step < wizard.steps.length - 1 ? (
              <Button type="button" onClick={() => void wizard.next()} disabled={wizard.isSubmitting || !wizard.canQualify}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={() => void handleSubmit()} disabled={wizard.isSubmitting || !wizard.canQualify}>
                {wizard.isSubmitting ? (<><Loader2 className="size-4 animate-spin" /> Qualifying...</>) : (<><Check className="size-4" /> Qualify Lead</>)}
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
  previewScore,
}: {
  step: number
  form: UseFormReturn<QualifyLeadInput>
  values: QualifyLeadInput
  errors: UseFormReturn<QualifyLeadInput>['formState']['errors']
  leadName: string
  company: string
  previewScore: ReturnType<typeof useQualifyLeadWizard>['previewScore']
}) {
  const { register, setValue } = form

  if (step === 0) {
    return (
      <>
        <Field label="Products Interested *" error={errors.productsInterested?.message}>
          <Select value={values.productsInterested} onValueChange={(v) => setValue('productsInterested', v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>{PRODUCT_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Expected Revenue ($) *" error={errors.expectedRevenue?.message}>
          <Input type="number" min="1" {...register('expectedRevenue')} />
        </Field>
        <Field label="Priority *" error={errors.priority?.message}>
          <Select value={values.priority} onValueChange={(v) => setValue('priority', v as QualifyLeadInput['priority'], { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITY_OPTIONS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </>
    )
  }

  if (step === 1) {
    return (
      <>
        <Field label="Budget Range *" error={errors.budgetRange?.message}>
          <Select value={values.budgetRange} onValueChange={(v) => setValue('budgetRange', v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger>
            <SelectContent>{BUDGET_RANGE_OPTIONS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Buying Timeline *" error={errors.buyingTimeline?.message}>
          <Select value={values.buyingTimeline} onValueChange={(v) => setValue('buyingTimeline', v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
            <SelectContent>{BUYING_TIMELINE_OPTIONS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Decision Maker *" error={errors.decisionMaker?.message}>
          <Input {...register('decisionMaker')} placeholder="Name and title" />
        </Field>
        <Field label="Competitors" error={errors.competitors?.message}>
          <Input {...register('competitors')} placeholder="Optional" />
        </Field>
      </>
    )
  }

  if (step === 2) {
    return (
      <>
        {(['needConfirmed', 'budgetConfirmed', 'authorityConfirmed', 'timelineConfirmed'] as const).map((field) => (
          <Field key={field} label={`${bantLabel(field)} *`} error={errors[field]?.message}>
            <Select value={values[field]} onValueChange={(v) => setValue(field, v as 'yes' | 'no', { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{YES_NO_OPTIONS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        ))}
        <Field label="Pain Points *" error={errors.painPoints?.message}>
          <Textarea {...register('painPoints')} rows={3} placeholder="Describe key business pain points..." />
        </Field>
      </>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
      <ReviewRow label="Lead" value={`${leadName} · ${company}`} />
      <ReviewRow label="Products" value={values.productsInterested} />
      <ReviewRow label="Revenue" value={values.expectedRevenue ? formatCurrency(Number(values.expectedRevenue)) : ''} />
      <ReviewRow label="Priority" value={values.priority} />
      <ReviewRow label="Budget Range" value={BUDGET_RANGE_OPTIONS.find((o) => o.value === values.budgetRange)?.label ?? values.budgetRange} />
      <ReviewRow label="Timeline" value={BUYING_TIMELINE_OPTIONS.find((o) => o.value === values.buyingTimeline)?.label ?? values.buyingTimeline} />
      <ReviewRow label="Decision Maker" value={values.decisionMaker} />
      <ReviewRow label="BANT Confirmed" value={`${bantCount(values)}/4 criteria`} />
      <ReviewRow label="Pain Points" value={values.painPoints.slice(0, 80)} />
      {previewScore && (
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground">Qualification Score</span>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{previewScore.score}</Badge>
            <QualificationRatingBadge rating={previewScore.rating} />
          </div>
        </div>
      )}
    </div>
  )
}

function bantLabel(field: keyof QualifyLeadInput): string {
  const labels: Record<string, string> = {
    needConfirmed: 'Need Confirmed',
    budgetConfirmed: 'Budget Confirmed',
    authorityConfirmed: 'Authority Confirmed',
    timelineConfirmed: 'Timeline Confirmed',
  }
  return labels[field] ?? field
}

function bantCount(values: QualifyLeadInput): number {
  return [values.needConfirmed, values.budgetConfirmed, values.authorityConfirmed, values.timelineConfirmed].filter((v) => v === 'yes').length
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <Typography variant="caption" className="text-destructive">{error}</Typography>}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value || '—'}</span>
    </div>
  )
}
