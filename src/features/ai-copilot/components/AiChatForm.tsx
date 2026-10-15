import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  AiFormField,
  AiFormOption,
  AiFormReviewRow,
  AiMessageForm,
} from '@/features/ai-copilot/types/copilot.types'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface AiChatFormProps {
  form: AiMessageForm
  onSubmit: (values: Record<string, string>) => void | Promise<void>
  onCancel?: () => void
  disabled?: boolean
}

type Values = Record<string, string>

function normalizeOptions(options: AiFormField['options']): AiFormOption[] {
  return (options ?? []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
}

function buildInitialValues(form: AiMessageForm): Values {
  const next: Values = {}
  for (const field of form.fields) {
    next[field.name] = field.default ?? (field.type === 'checkbox' ? 'false' : '')
  }
  return next
}

/** datetime-local has no timezone; send an unambiguous ISO-8601 UTC value. */
function toSubmitValues(form: AiMessageForm, values: Values): Values {
  const out: Values = { ...values }
  for (const field of form.fields) {
    const raw = out[field.name]
    if (field.type === 'datetime-local' && raw) {
      const parsed = new Date(raw)
      if (!Number.isNaN(parsed.getTime())) out[field.name] = parsed.toISOString()
    }
  }
  return out
}

function isVisible(field: { showWhen?: { field: string; equals: string } }, values: Values): boolean {
  if (!field.showWhen) return true
  return (values[field.showWhen.field] ?? '') === field.showWhen.equals
}

/** Same rules the CRM wizards enforce through their zod step schemas. */
function validateFields(fields: AiFormField[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    if (!isVisible(field, values)) continue
    const raw = (values[field.name] ?? '').trim()
    if (field.type === 'checkbox') {
      if (field.required && raw !== 'true') errors[field.name] = `${field.label} is required`
      continue
    }
    if (field.required && !raw) {
      errors[field.name] = `${field.label} is required`
      continue
    }
    if (!raw) continue
    if (field.type === 'number') {
      const n = Number(raw)
      if (Number.isNaN(n)) errors[field.name] = `${field.label} must be a number`
      else if (field.min !== undefined && n < field.min) errors[field.name] = `${field.label} must be at least ${field.min}`
      else if (field.max !== undefined && n > field.max) errors[field.name] = `${field.label} must be at most ${field.max}`
    }
    if (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw)) {
      errors[field.name] = 'Please enter a valid email address'
    }
  }
  return errors
}

export function AiChatForm({ form, onSubmit, onCancel, disabled = false }: AiChatFormProps) {
  // Keyed by form id: a new form from the assistant remounts with fresh
  // defaults, so stale values from an earlier action can never leak in.
  if (form.steps?.length) {
    return <AiWizardForm key={form.id} form={form} onSubmit={onSubmit} onCancel={onCancel} disabled={disabled} />
  }
  return <AiFlatForm key={form.id} form={form} onSubmit={onSubmit} disabled={disabled} />
}

/* ────────────────────────────────────────────────────────────────────────────
 * Flat form — used by Create Lead / Create Opportunity / Update / Task.
 * Create Lead's look is intentionally unchanged.
 * ──────────────────────────────────────────────────────────────────────────── */

function AiFlatForm({ form, onSubmit, disabled }: Omit<AiChatFormProps, 'onCancel'>) {
  const initialValues = useMemo(() => buildInitialValues(form), [form])
  const [values, setValues] = useState<Values>(initialValues)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const submit = async () => {
    const errors = validateFields(form.fields, values)
    const missing = form.fields.filter((f) => errors[f.name]).map((f) => f.label)
    if (missing.length) {
      setError(`Please complete: ${missing.join(', ')}`)
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(toSubmitValues(form, values))
    } finally {
      setSubmitting(false)
    }
  }

  const busy = disabled || submitting

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold">{form.title}</div>
        {form.description && <div className="mt-1 text-xs text-muted-foreground">{form.description}</div>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {form.fields.map((field) => {
          const value = values[field.name] ?? ''
          const fullWidth = field.type === 'textarea' || field.fullWidth
          return (
            <div key={field.name} className={fullWidth ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
              <Label className="text-xs">
                {field.label}{field.required ? ' *' : ''}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea value={value} onChange={(e) => setValue(field.name, e.target.value)} rows={field.rows ?? 3} placeholder={field.placeholder} disabled={busy} />
              ) : field.type === 'select' ? (
                <select
                  value={value}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  disabled={busy}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select…</option>
                  {normalizeOptions(field.options).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type}
                  value={value}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  disabled={busy}
                />
              )}
            </div>
          )
        })}
      </div>

      {error && <div className="mt-3 text-xs font-medium text-destructive">{error}</div>}

      <div className="mt-4 flex justify-end">
        <Button type="button" size="sm" onClick={() => void submit()} disabled={busy}>
          {submitting ? <><Loader2 className="size-4 animate-spin" /> Please wait…</> : (form.submitLabel ?? 'Continue')}
        </Button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Wizard form — the same steps, fields, defaults, validation, review screen
 * and buttons as the manual CRM wizards (Convert / Qualify / Disqualify /
 * Close as Won / Close as Lost), rendered inside the chat bubble.
 * ──────────────────────────────────────────────────────────────────────────── */

function AiWizardForm({ form, onSubmit, onCancel, disabled }: AiChatFormProps) {
  const steps = form.steps ?? []
  const reviewIndex = steps.length - 1
  const initialValues = useMemo(() => buildInitialValues(form), [form])
  const [values, setValues] = useState<Values>(initialValues)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isDirty = useMemo(
    () => Object.keys(initialValues).some((k) => (values[k] ?? '') !== (initialValues[k] ?? '')),
    [initialValues, values],
  )

  const busy = disabled || submitting || Boolean(form.warning)
  const stepFields = form.fields.filter((f) => (f.step ?? 0) === step && isVisible(f, values))

  const setValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const next = () => {
    const stepErrors = validateFields(form.fields.filter((f) => (f.step ?? 0) === step), values)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length === 0) setStep((s) => Math.min(s + 1, reviewIndex))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const reset = () => {
    setValues(initialValues)
    setStep(0)
    setErrors({})
    setConfirmed(false)
  }

  const submit = async () => {
    const allErrors = validateFields(form.fields, values)
    if (Object.keys(allErrors).length) {
      setErrors(allErrors)
      const firstStep = form.fields.find((f) => allErrors[f.name])?.step ?? 0
      setStep(firstStep)
      return
    }
    if (form.confirmText && !confirmed) {
      setErrors({ __confirmed: 'Please confirm the details before submitting' })
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ ...toSubmitValues(form, values), confirmed: form.confirmText ? String(confirmed) : 'true' })
    } finally {
      setSubmitting(false)
    }
  }

  const caption = form.stepDescriptions?.[String(step)]

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-background p-4 shadow-sm">
      <div className="mb-3 space-y-1">
        <div className="text-base font-semibold">{form.title}</div>
        <div className="text-xs text-muted-foreground">
          Step {step + 1} of {steps.length}: {steps[step]}
          {form.subtitle ? ` · ${form.subtitle}` : ''}
        </div>
      </div>

      {form.warning && (
        <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{form.warning}</div>
      )}

      <div
        className="mb-4 flex gap-1"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        {steps.map((s, i) => (
          <div
            key={s}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')}
            aria-hidden
          />
        ))}
      </div>

      <div className="space-y-4">
        {caption && <div className="text-xs text-muted-foreground">{caption}</div>}

        {step < reviewIndex ? (
          stepFields.map((field) => (
            <WizardField
              key={field.name}
              field={field}
              value={values[field.name] ?? ''}
              error={errors[field.name]}
              disabled={busy}
              onChange={(v) => setValue(field.name, v)}
            />
          ))
        ) : (
          <ReviewPanel form={form} values={values} />
        )}

        {step === reviewIndex && form.confirmText && (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Checkbox
                id={`confirm-${form.id}`}
                checked={confirmed}
                disabled={busy}
                onCheckedChange={(checked) => {
                  setConfirmed(checked === true)
                  setErrors((current) => {
                    const nextErrors = { ...current }
                    delete nextErrors.__confirmed
                    return nextErrors
                  })
                }}
              />
              <Label htmlFor={`confirm-${form.id}`} className="text-sm leading-snug">
                {form.confirmText}
              </Label>
            </div>
            {errors.__confirmed && <div className="text-xs text-destructive">{errors.__confirmed}</div>}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting || !onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={reset} disabled={busy || !isDirty}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={back} disabled={step === 0 || busy}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < reviewIndex ? (
            <Button type="button" variant="primary" size="sm" onClick={next} disabled={busy}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant={form.submitVariant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => void submit()}
              disabled={busy}
            >
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" /> {form.submittingLabel ?? 'Submitting...'}</>
              ) : (
                <><Check className="size-4" /> {form.submitLabel ?? 'Submit'}</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function WizardField({
  field,
  value,
  error,
  disabled,
  onChange,
}: {
  field: AiFormField
  value: string
  error?: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  if (field.type === 'checkbox') {
    return (
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox
          id={`fld-${field.name}`}
          checked={value === 'true'}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked === true ? 'true' : 'false')}
        />
        <div className="space-y-1">
          <Label htmlFor={`fld-${field.name}`} className="cursor-pointer font-medium">
            {field.label}
          </Label>
          {field.helpText && <div className="text-xs text-muted-foreground">{field.helpText}</div>}
          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>
      </div>
    )
  }

  const label = `${field.label}${field.required ? ' *' : ''}`
  let control: ReactNode
  if (field.type === 'select') {
    const options = normalizeOptions(field.options)
    control = (
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder ?? 'Select'} />
        </SelectTrigger>
        <SelectContent>
          {options.map(({ value: v, label: l }) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  } else if (field.type === 'textarea') {
    control = (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={field.rows ?? 3}
        placeholder={field.placeholder}
        disabled={disabled}
      />
    )
  } else {
    control = (
      <Input
        type={field.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        disabled={disabled}
      />
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {control}
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  )
}

function displayValue(form: AiMessageForm, fieldName: string, values: Values): string {
  const raw = values[fieldName] ?? ''
  const field = form.fields.find((f) => f.name === fieldName)
  if (!field) return raw
  if (field.type === 'select') {
    return normalizeOptions(field.options).find((o) => o.value === raw)?.label ?? raw
  }
  if (field.type === 'checkbox') return raw === 'true' ? 'Yes' : 'No'
  return raw
}

function reviewRowValue(form: AiMessageForm, row: AiFormReviewRow, values: Values): string {
  if (row.value !== undefined) return row.value
  if (row.format === 'count_yes') {
    const fields = row.fields ?? []
    const count = fields.filter((f) => values[f] === 'yes' || values[f] === 'true').length
    return `${count}/${fields.length} criteria`
  }
  if (!row.field) return ''
  const raw = values[row.field] ?? ''
  if (row.format === 'currency') {
    if (!raw) return ''
    const currency = row.currencyField ? values[row.currencyField] || 'USD' : 'USD'
    return formatCurrency(Number(raw), currency)
  }
  if (row.format === 'percent') return raw ? `${raw}%` : ''
  const text = displayValue(form, row.field, values)
  return row.maxLength ? text.slice(0, row.maxLength) : text
}

function ReviewPanel({ form, values }: { form: AiMessageForm; values: Values }) {
  const sourceRows: AiFormReviewRow[] =
    form.review?.rows ?? form.fields.map((f) => ({ label: f.label, field: f.name, showWhen: f.showWhen }))
  const rows = sourceRows
    .filter((row) => isVisible(row, values))
    .map((row) => ({ label: row.label, value: reviewRowValue(form, row, values), hide: row.hideIfEmpty }))
    .filter((row) => !(row.hide && !row.value.trim()))

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
      {form.review?.title && <div className="text-sm font-semibold">{form.review.title}</div>}
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-right font-medium">{row.value || '—'}</span>
        </div>
      ))}
      {form.review?.note && <div className="text-xs text-muted-foreground">{form.review.note}</div>}
    </div>
  )
}
