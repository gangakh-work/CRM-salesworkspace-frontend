import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  Loader2,
  RotateCcw,
  Save,
} from 'lucide-react'
import { type ReactNode, useRef } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Typography } from '@/components/ui/typography'

import {
  LEAD_COUNTRY_OPTIONS,
  LEAD_INDUSTRY_OPTIONS,
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
} from '@/features/lead-management/config/lead-form.config'

import type { CreateLeadInput } from '@/features/lead-management/domain/lead.schema'
import { useCreateLeadWizard } from '@/features/lead-management/hooks/useCreateLeadWizard'
import { cn } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'

export function CreateLeadWizard() {
  const wizard = useCreateLeadWizard()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      const result = await wizard.submit()

      if (!result) {
        sonnerToast.error('Please fix validation errors before submitting')
        return
      }

      sonnerToast.success('Lead created successfully', {
        description: `${result.lead.name} has been saved in Dynamics 365 UAT.`,
        action: {
          label: result.crmUrl ? 'Open in CRM' : 'View Lead',
          onClick: () => {
            if (result.crmUrl) {
              window.open(result.crmUrl, '_blank', 'noopener,noreferrer')
              return
            }

            navigate(`/workspace/leads/${result.lead.id}`)
          },
        },
      })
    } catch (error) {
      sonnerToast.error('Failed to create lead', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleSaveDraft = () => {
    try {
      const draft = wizard.saveDraft()

      if (!draft) {
        sonnerToast.error('Nothing to save', {
          description: 'Please enter at least one Lead detail before saving.',
        })
        return
      }

      sonnerToast.success('Lead saved as draft', {
        description:
          'Your incomplete Lead has been saved. You can continue it later from Drafts.',
      })
    } catch (error) {
      sonnerToast.error('Unable to save draft', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Dialog
      open={wizard.wizardOpen}
      onOpenChange={(open) => !open && wizard.handleClose()}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Lead</DialogTitle>

          <DialogDescription>
            Step {wizard.step + 1} of {wizard.steps.length}:{' '}
            {wizard.steps[wizard.step]} · Owner: {wizard.displayName}
          </DialogDescription>
        </DialogHeader>

        <div
          className="mb-6 flex gap-1"
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

        {/* Document-based Lead creation */}
        <DocumentLeadImport wizard={wizard} />

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
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={wizard.handleCancel}
              disabled={wizard.isSubmitting}
            >
              Cancel
            </Button>

            {/* SAVE AS DRAFT */}
            <Button
  type="button"
  variant="outline"
  onClick={handleSaveDraft}
  disabled={wizard.isSubmitting}
>
  <Save className="size-4" />
  Save as Draft
</Button>

            <Button
  type="button"
  variant="outline"
  onClick={wizard.handleReset}
  disabled={wizard.isSubmitting}
>
  <RotateCcw className="size-4" />
  Reset
</Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={wizard.back}
              disabled={wizard.step === 0 || wizard.isSubmitting}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {wizard.step < wizard.steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => void wizard.next()}
                disabled={wizard.isSubmitting}
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={wizard.isSubmitting}
              >
                {wizard.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Create Lead
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

function DocumentLeadImport({
  wizard,
}: {
  wizard: ReturnType<typeof useCreateLeadWizard>
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Typography variant="caption" className="font-medium">
            Create Lead from Document
          </Typography>

          <Typography variant="caption" tone="muted">
            Upload an Email (.eml), PDF, or RFP PDF to extract Lead
            information automatically.
          </Typography>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.eml,.txt,.md"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0]

            // Allow selecting the same file again later.
            event.target.value = ''

            if (!file) return

            try {
              await wizard.extractDocument(file)

              sonnerToast.success('Document processed', {
                description:
                  'Lead fields were extracted. Please review the information before creating the Lead.',
              })
            } catch (error) {
              sonnerToast.error('Unable to process document', {
                description:
                  error instanceof Error
                    ? error.message
                    : 'Unknown error',
              })
            }
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={
            wizard.isSubmitting || wizard.isExtractingDocument
          }
        >
          <FileUp className="size-4" />

          {wizard.isExtractingDocument
            ? 'Extracting...'
            : 'Upload Document'}
        </Button>
      </div>
    </div>
  )
}

function WizardStepContent({
  step,
  form,
  values,
  errors,
}: {
  step: number
  form: UseFormReturn<CreateLeadInput>
  values: CreateLeadInput
  errors: UseFormReturn<CreateLeadInput>['formState']['errors']
}) {
  const { register, setValue } = form

  if (step === 0) {
    return (
      <>
        <Field
          label="First Name *"
          error={errors.firstName?.message}
        >
          <Input {...register('firstName')} autoComplete="given-name" />
        </Field>

        <Field
          label="Last Name *"
          error={errors.lastName?.message}
        >
          <Input {...register('lastName')} autoComplete="family-name" />
        </Field>

        <Field label="Email *" error={errors.email?.message}>
          <Input
            type="email"
            {...register('email')}
            autoComplete="email"
          />
        </Field>

        <Field label="Phone *" error={errors.phone?.message}>
          <Input {...register('phone')} autoComplete="tel" />
        </Field>

        <Field label="Job Title *" error={errors.title?.message}>
          <Input {...register('title')} />
        </Field>
      </>
    )
  }

  if (step === 1) {
    return (
      <>
        <Field
          label="Company Name *"
          error={errors.companyName?.message}
        >
          <Input {...register('companyName')} />
        </Field>

        <Field
          label="Industry *"
          error={errors.industry?.message}
        >
          <Select
            value={values.industry}
            onValueChange={(v) =>
              setValue('industry', v, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>

            <SelectContent>
              {LEAD_INDUSTRY_OPTIONS.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Country *"
          error={errors.country?.message}
        >
          <Select
            value={values.country}
            onValueChange={(v) =>
              setValue('country', v, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>

            <SelectContent>
              {LEAD_COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Website"
          error={errors.website?.message}
        >
          <Input
            placeholder="https://example.com"
            {...register('website')}
          />
        </Field>

        <Field
          label="Employees"
          error={errors.employees?.message}
        >
          <Input
            placeholder="e.g. 100-500"
            {...register('employees')}
          />
        </Field>
      </>
    )
  }

  if (step === 2) {
    return (
      <>
        <Field
          label="Opportunity Name *"
          error={errors.opportunityName?.message}
        >
          <Input {...register('opportunityName')} />
        </Field>

        <Field
          label="Expected Revenue ($) *"
          error={errors.expectedRevenue?.message}
        >
          <Input
            type="number"
            min="1"
            step="1"
            {...register('expectedRevenue')}
          />
        </Field>

        <Field
          label="Budget ($)"
          error={errors.budget?.message}
        >
          <Input
            type="number"
            min="0"
            step="1"
            {...register('budget')}
          />
        </Field>

        <Field
          label="Expected Close Date *"
          error={errors.closeDate?.message}
        >
          <Input type="date" {...register('closeDate')} />
        </Field>
      </>
    )
  }

  if (step === 3) {
    return (
      <>
        <Field
          label="Lead Source *"
          error={errors.source?.message}
        >
          <Select
            value={values.source}
            onValueChange={(v) =>
              setValue('source', v, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>

            <SelectContent>
              {LEAD_SOURCE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Priority *"
          error={errors.priority?.message}
        >
          <Select
            value={values.priority}
            onValueChange={(v) =>
              setValue(
                'priority',
                v as CreateLeadInput['priority'],
                {
                  shouldValidate: true,
                  shouldDirty: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {LEAD_PRIORITY_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Description"
          error={errors.description?.message}
        >
          <Textarea {...register('description')} rows={3} />
        </Field>

        <Field label="Notes" error={errors.notes?.message}>
          <Textarea {...register('notes')} rows={2} />
        </Field>
      </>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
      <ReviewRow
        label="Contact"
        value={`${values.firstName} ${values.lastName}`}
      />

      <ReviewRow label="Email" value={values.email} />

      <ReviewRow
        label="Company"
        value={values.companyName}
      />

      <ReviewRow
        label="Industry"
        value={values.industry}
      />

      <ReviewRow
        label="Opportunity"
        value={values.opportunityName}
      />

      <ReviewRow
        label="Revenue"
        value={
          values.expectedRevenue
            ? `$${Number(values.expectedRevenue).toLocaleString()}`
            : ''
        }
      />

      <ReviewRow
        label="Close Date"
        value={values.closeDate}
      />

      <ReviewRow
        label="Source"
        value={values.source}
      />

      <ReviewRow
        label="Priority"
        value={values.priority}
      />
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
        <Typography
          variant="caption"
          className="text-destructive"
        >
          {error}
        </Typography>
      )}
    </div>
  )
}

function ReviewRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>

      <span className="font-medium">
        {value || '—'}
      </span>
    </div>
  )
}