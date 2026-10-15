import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, Trophy } from 'lucide-react'
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
import { Typography } from '@/components/ui/typography'
import {
  BUSINESS_UNIT_OPTIONS,
  CURRENCY_OPTIONS,
  buildDeliveryOwnerOptions,
} from '@/features/opportunity-management/config/win-form.config'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import type { CloseAsWonInput } from '@/features/opportunity-management/domain/win.schema'
import { useCloseOpportunityWonWizard } from '@/features/opportunity-management/hooks/useCloseOpportunityWonWizard'
import { cn } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'

export function CloseOpportunityWonWizard() {
  const wizard = useCloseOpportunityWonWizard()
  const { filterOptions } = useOpportunityManagement()
  const deliveryOwnerOptions = buildDeliveryOwnerOptions(filterOptions.owners)

  if (!wizard.opportunity) return null

  const handleSubmit = async () => {
    try {
      wizard.form.setValue('confirmed', true, { shouldValidate: true })
      const result = await wizard.submit()
      if (!result) {
        sonnerToast.error('Please fix validation errors before submitting')
        return
      }
      sonnerToast.success('Opportunity closed as Won', {
        description: `${result.opportunity.name} · ${wizard.buildSummary(wizard.values)}`,
      })
    } catch (error) {
      sonnerToast.error('Failed to close as won', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Dialog open={wizard.winWizardOpen} onOpenChange={(open) => !open && wizard.handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-emerald-600" />
            Close as Won
          </DialogTitle>
          <DialogDescription>
            Step {wizard.step + 1} of {wizard.steps.length}: {wizard.steps[wizard.step]} ·{' '}
            {wizard.opportunity.name} · {wizard.displayName}
          </DialogDescription>
        </DialogHeader>

        {!wizard.canClose && (
          <Typography variant="caption" className="rounded-lg bg-destructive/10 p-3 text-destructive">
            {wizard.eligibilityMessage ??
              'Only opportunities in Negotiation or Contract Review can be marked as Won.'}
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
                i <= wizard.step ? 'bg-emerald-500' : 'bg-muted',
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
            <WinStepContent
              step={wizard.step}
              form={wizard.form}
              values={wizard.values}
              errors={wizard.errors}
              opportunityName={wizard.opportunity.name}
              customer={wizard.opportunity.customer}
              stage={wizard.opportunity.stage}
              formatStage={wizard.formatStage}
              formatCurrency={wizard.formatCurrency}
              buildSummary={wizard.buildSummary}
              deliveryOwnerOptions={deliveryOwnerOptions}
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
                variant="primary"
                onClick={() => void handleSubmit()}
                disabled={wizard.isSubmitting || !wizard.canClose}
              >
                {wizard.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Closing...
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Confirm Win
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

function WinStepContent({
  step,
  form,
  values,
  errors,
  opportunityName,
  customer,
  stage,
  formatStage,
  formatCurrency,
  buildSummary,
  deliveryOwnerOptions,
}: {
  step: number
  form: UseFormReturn<CloseAsWonInput>
  values: CloseAsWonInput
  errors: UseFormReturn<CloseAsWonInput>['formState']['errors']
  opportunityName: string
  customer: string
  stage: string
  formatStage: (stage: import('@/features/opportunity-management/types/opportunity.types').OpportunityStage) => string
  formatCurrency: (amount: number, currency: string) => string
  buildSummary: (input: CloseAsWonInput) => string
  deliveryOwnerOptions: ReturnType<typeof buildDeliveryOwnerOptions>
}) {
  const { register, setValue } = form

  if (step === 0) {
    return (
      <>
        <Typography variant="caption" tone="muted">
          Final commercial terms for {opportunityName} at {customer}.
        </Typography>
        <Field label="Final Revenue *" error={errors.finalRevenue?.message}>
          <Input {...register('finalRevenue')} type="number" min={0} />
        </Field>
        <Field label="Currency *" error={errors.currency?.message}>
          <Select
            value={values.currency}
            onValueChange={(v) => setValue('currency', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Contract Value *" error={errors.contractValue?.message}>
          <Input {...register('contractValue')} type="number" min={0} />
        </Field>
        <Field label="Margin (%) *" error={errors.margin?.message}>
          <Input {...register('margin')} type="number" min={0} max={100} />
        </Field>
        <Field label="Discount (%) *" error={errors.discount?.message}>
          <Input {...register('discount')} type="number" min={0} max={100} />
        </Field>
      </>
    )
  }

  if (step === 1) {
    return (
      <>
        <Field label="Decision Maker *" error={errors.decisionMaker?.message}>
          <Input {...register('decisionMaker')} />
        </Field>
        <Field label="Contract Start Date *" error={errors.contractStartDate?.message}>
          <Input {...register('contractStartDate')} type="date" />
        </Field>
        <Field label="Contract End Date *" error={errors.contractEndDate?.message}>
          <Input {...register('contractEndDate')} type="date" />
        </Field>
      </>
    )
  }

  if (step === 2) {
    return (
      <>
        <Field label="Expected Kickoff *" error={errors.expectedKickoff?.message}>
          <Input {...register('expectedKickoff')} type="date" />
        </Field>
        <Field label="Delivery Owner *" error={errors.deliveryOwner?.message}>
          <Select
            value={values.deliveryOwner}
            onValueChange={(v) => setValue('deliveryOwner', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {deliveryOwnerOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Business Unit *" error={errors.businessUnit?.message}>
          <Select
            value={values.businessUnit}
            onValueChange={(v) => setValue('businessUnit', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUSINESS_UNIT_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
        <Typography variant="body" className="font-semibold">{opportunityName}</Typography>
        <Typography variant="caption" tone="muted">{customer} · {formatStage(stage as import('@/features/opportunity-management/types/opportunity.types').OpportunityStage)}</Typography>
        <Typography variant="caption">{buildSummary(values)}</Typography>
        <Typography variant="caption" tone="muted">
          Final: {formatCurrency(Number(values.finalRevenue), values.currency)} · Contract{' '}
          {values.contractStartDate} → {values.contractEndDate}
        </Typography>
        <Typography variant="caption" tone="muted">
          Kickoff {values.expectedKickoff} · {values.deliveryOwner} · {values.businessUnit}
        </Typography>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="win-confirmed"
          checked={values.confirmed}
          onCheckedChange={(checked) =>
            setValue('confirmed', checked === true, { shouldValidate: true })
          }
        />
        <Label htmlFor="win-confirmed" className="text-sm leading-snug">
          I confirm the win details are accurate and this opportunity should be locked as Won.
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
