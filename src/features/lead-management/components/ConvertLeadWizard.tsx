import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, TrendingUp } from 'lucide-react'
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
import { Typography } from '@/components/ui/typography'
import {
  BUSINESS_UNITS,
  CURRENCY_OPTIONS,
  FORECAST_OPTIONS,
  INDUSTRY_OPTIONS,
  PRIORITY_OPTIONS,
  REGION_OPTIONS,
  STAGE_OPTIONS,
} from '@/features/lead-management/config/conversion-form.config'
import type { ConvertLeadInput } from '@/features/lead-management/domain/conversion.schema'
import { useConvertLeadWizard } from '@/features/lead-management/hooks/useConvertLeadWizard'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'

export function ConvertLeadWizard() {
  const wizard = useConvertLeadWizard()

  if (!wizard.lead) return null

  const handleSubmit = async () => {
    try {
      wizard.form.setValue('confirmed', true, { shouldValidate: true })
      const result = await wizard.submit()
      if (!result) {
        sonnerToast.error('Please fix validation errors before submitting')
        return
      }
      sonnerToast.success('Lead converted to opportunity', {
        description: `${result.lead.name} → ${result.opportunity.name}`,
      })
    } catch (error) {
      sonnerToast.error('Failed to convert lead', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Dialog open={wizard.convertWizardOpen} onOpenChange={(open) => !open && wizard.handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            Convert to Opportunity
          </DialogTitle>
          <DialogDescription>
            Step {wizard.step + 1} of {wizard.steps.length}: {wizard.steps[wizard.step]} ·{' '}
            {wizard.lead.name} · {wizard.displayName}
          </DialogDescription>
        </DialogHeader>

        {!wizard.canConvert && (
          <Typography variant="caption" className="rounded-lg bg-destructive/10 p-3 text-destructive">
            {wizard.eligibilityMessage ??
              'Only qualified leads that have not been converted can proceed.'}
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
                i <= wizard.step ? 'bg-primary' : 'bg-muted',
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
              previewOpportunity={wizard.previewOpportunity}
              previewConversion={wizard.previewConversion}
              formatStage={wizard.formatStage}
              formatForecast={wizard.formatForecast}
              buildSummary={wizard.buildSummary}
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
                variant="primary"
                onClick={() => void wizard.next()}
                disabled={wizard.isSubmitting || !wizard.canConvert}
              >
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleSubmit()}
                disabled={wizard.isSubmitting || !wizard.canConvert}
              >
                {wizard.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Confirm Conversion
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
  previewOpportunity,
  previewConversion,
  formatStage,
  formatForecast,
  buildSummary,
}: {
  step: number
  form: UseFormReturn<ConvertLeadInput>
  values: ConvertLeadInput
  errors: UseFormReturn<ConvertLeadInput>['formState']['errors']
  leadName: string
  company: string
  previewOpportunity: ReturnType<typeof useConvertLeadWizard>['previewOpportunity']
  previewConversion: ReturnType<typeof useConvertLeadWizard>['previewConversion']
  formatStage: ReturnType<typeof useConvertLeadWizard>['formatStage']
  formatForecast: ReturnType<typeof useConvertLeadWizard>['formatForecast']
  buildSummary: ReturnType<typeof useConvertLeadWizard>['buildSummary']
}) {
  const { register, setValue } = form

  if (step === 0) {
    return (
      <>
        <Typography variant="caption" tone="muted">
          Converting {leadName} at {company}. Review and adjust opportunity basics.
        </Typography>
        <Field label="Opportunity Name *" error={errors.opportunityName?.message}>
          <Input {...register('opportunityName')} />
        </Field>
        <Field label="Customer *" error={errors.customer?.message}>
          <Input {...register('customer')} />
        </Field>
        <Field label="Primary Contact *" error={errors.primaryContact?.message}>
          <Input {...register('primaryContact')} />
        </Field>
        <Field label="Expected Revenue *" error={errors.expectedRevenue?.message}>
          <Input {...register('expectedRevenue')} type="number" min={0} />
        </Field>
        <Field label="Estimated Close Date *" error={errors.estimatedCloseDate?.message}>
          <Input {...register('estimatedCloseDate')} type="date" />
        </Field>
      </>
    )
  }

  if (step === 1) {
    return (
      <>
        <Field label="Sales Stage *" error={errors.salesStage?.message}>
          <Select
            value={values.salesStage}
            onValueChange={(v) =>
              setValue('salesStage', v as ConvertLeadInput['salesStage'], { shouldValidate: true })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Forecast Category *" error={errors.forecastCategory?.message}>
          <Select
            value={values.forecastCategory}
            onValueChange={(v) =>
              setValue('forecastCategory', v as ConvertLeadInput['forecastCategory'], { shouldValidate: true })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORECAST_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Probability (%) *" error={errors.probability?.message}>
          <Input {...register('probability')} type="number" min={0} max={100} />
        </Field>
        <Field label="Region *" error={errors.region?.message}>
          <Select
            value={values.region}
            onValueChange={(v) => setValue('region', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REGION_OPTIONS.map(({ value, label }) => (
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
              {BUSINESS_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Industry *" error={errors.industry?.message}>
          <Select
            value={values.industry}
            onValueChange={(v) => setValue('industry', v, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INDUSTRY_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </>
    )
  }

  if (step === 2) {
    return (
      <>
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
        <Field label="Estimated Revenue *" error={errors.estimatedRevenue?.message}>
          <Input {...register('estimatedRevenue')} type="number" min={0} />
        </Field>
        <Field label="Expected Margin (%) *" error={errors.expectedMargin?.message}>
          <Input {...register('expectedMargin')} type="number" min={0} max={100} />
        </Field>
        <Field label="Priority *" error={errors.priority?.message}>
          <Select
            value={values.priority}
            onValueChange={(v) =>
              setValue('priority', v as ConvertLeadInput['priority'], { shouldValidate: true })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <Typography variant="heading-m" className="text-sm">Conversion Summary</Typography>
      {previewOpportunity && previewConversion && (
        <div className="space-y-3 text-sm">
          <SummaryRow label="Opportunity" value={previewOpportunity.name} />
          <SummaryRow label="Customer" value={previewOpportunity.customer} />
          <SummaryRow label="Contact" value={previewOpportunity.primaryContact} />
          <SummaryRow label="Stage" value={formatStage(previewOpportunity.stage)} />
          <SummaryRow label="Forecast" value={formatForecast(previewOpportunity.forecastCategory)} />
          <SummaryRow label="Probability" value={`${previewOpportunity.probability}%`} />
          <SummaryRow
            label="Revenue"
            value={formatCurrency(previewOpportunity.expectedRevenue, previewOpportunity.currency)}
          />
          <SummaryRow label="Close Date" value={previewOpportunity.closeDate} />
          <SummaryRow label="Region" value={previewOpportunity.region} />
          <SummaryRow label="Industry" value={previewOpportunity.industry} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="info">{buildSummary(previewConversion)}</Badge>
          </div>
        </div>
      )}
      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="confirm-conversion"
          checked={values.confirmed}
          onCheckedChange={(checked) =>
            setValue('confirmed', checked === true, { shouldValidate: true })
          }
        />
        <Label htmlFor="confirm-conversion" className="text-sm leading-snug">
          I confirm this lead will be locked as Converted and a new opportunity will be created.
        </Label>
      </div>
      {errors.confirmed?.message && (
        <Typography variant="caption" className="text-destructive">
          {errors.confirmed.message}
        </Typography>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && (
        <Typography variant="caption" className="text-destructive">
          {error}
        </Typography>
      )}
    </div>
  )
}
