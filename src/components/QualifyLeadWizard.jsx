
import { useMemo, useState } from 'react'
import { crmApi } from '../lib/api'

const INITIAL = {
  product: '',
  revenue: '',
  priority: 'Medium',
  budget: '',
  timeline: '',
  decisionMaker: '',
  competitors: '',
  needConfirmed: 'No',
  budgetConfirmed: 'No',
  authorityConfirmed: 'No',
  timelineConfirmed: 'No',
  painPoints: '',
}

const PRODUCTS = [
  'Analytics Suite',
  'Cloud Services',
  'Application Development',
  'Cyber Security',
  'Data Engineering',
  'Other',
]

const BUDGETS = [
  'Under $50K',
  '$50K – $100K',
  '$100K – $500K',
  '$500K – $1M',
  'Above $1M',
]

const TIMELINES = [
  'Immediate',
  'Next 3 Months',
  'Next 6 Months',
  '6–12 Months',
  'More than 12 Months',
]

const STEPS = [
  'Customer Interest',
  'Budget',
  'Qualification Questions',
  'Review',
]

const scoreQualification = (form) => {
  let score = 0

  if (form.needConfirmed === 'Yes') score += 25
  if (form.budgetConfirmed === 'Yes') score += 25
  if (form.authorityConfirmed === 'Yes') score += 25
  if (form.timelineConfirmed === 'Yes') score += 25

  return score
}

const heat = (score) =>
  score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold'

const titleCase = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export default function QualifyLeadWizard({
  lead,
  onClose,
  onQualified,
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const score = useMemo(
    () => scoreQualification(form),
    [form],
  )

  const qualification = heat(score)

  const update = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: '',
    }))
  }

  const validateStep = () => {
    const nextErrors = {}

    if (step === 0) {
      if (!form.product) {
        nextErrors.product = 'Select a product.'
      }

      if (
        form.revenue === '' ||
        !Number.isFinite(Number(form.revenue)) ||
        Number(form.revenue) < 0
      ) {
        nextErrors.revenue =
          'Enter a valid expected revenue.'
      }

      if (!form.priority) {
        nextErrors.priority = 'Select a priority.'
      }
    }

    if (step === 1) {
      if (!form.budget) {
        nextErrors.budget = 'Select a budget range.'
      }

      if (!form.timeline) {
        nextErrors.timeline = 'Select a buying timeline.'
      }

      if (!form.decisionMaker.trim()) {
        nextErrors.decisionMaker =
          'Enter the decision maker.'
      }
    }

    if (step === 2) {
      const required = [
        'needConfirmed',
        'budgetConfirmed',
        'authorityConfirmed',
        'timelineConfirmed',
      ]

      required.forEach((field) => {
        if (!form[field]) {
          nextErrors[field] = 'Please select Yes or No.'
        }
      })

      if (!form.painPoints.trim()) {
        nextErrors.painPoints =
          'Describe the business pain points.'
      }
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const next = () => {
    if (!validateStep()) return

    setStep((current) => Math.min(current + 1, 3))
  }

  const back = () => {
    setErrors({})
    setSubmitError('')
    setStep((current) => Math.max(current - 1, 0))
  }

  const reset = () => {
    setForm(INITIAL)
    setErrors({})
    setSubmitError('')
    setStep(0)
  }

  const submit = async () => {
    if (submitting || !lead?.id) return

    setSubmitting(true)
    setSubmitError('')

    const payload = {
      create_account: true,
      create_contact: true,
      create_opportunity: true,
    }

    try {
      await crmApi.qualifyLead(lead.id, payload)
      await onQualified?.(lead, payload)
    } catch (error) {
      setSubmitError(
        error?.message || 'Unable to qualify lead. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = (name) =>
    `qualify-field${errors[name] ? ' has-error' : ''}`

  const renderSelect = (
    name,
    label,
    options,
    placeholder,
  ) => (
    <label className={fieldClass(name)}>
      <span>{label} *</span>

      <select
        value={form[name]}
        onChange={(event) => update(name, event.target.value)}
        aria-invalid={Boolean(errors[name])}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {errors[name] && (
        <small>{errors[name]}</small>
      )}
    </label>
  )

  const renderYesNo = (name, label) =>
    renderSelect(
      name,
      label,
      ['Yes', 'No'],
      'Select answer',
    )

  const renderInput = (
    name,
    label,
    placeholder,
    type = 'text',
  ) => (
    <label className={fieldClass(name)}>
      <span>{label} *</span>

      <input
        type={type}
        value={form[name]}
        placeholder={placeholder}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? 'any' : undefined}
        onChange={(event) => update(name, event.target.value)}
        aria-invalid={Boolean(errors[name])}
      />

      {errors[name] && (
        <small>{errors[name]}</small>
      )}
    </label>
  )

  return (
    <div
      className="qualify-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose()
        }
      }}
    >
      <section
        className="qualify-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qualify-title"
      >
        <header className="qualify-header">
          <div>
            <h2 id="qualify-title">Qualify Lead</h2>

            <p>
              Step {step + 1} of 4: {STEPS[step]}
              {' · '}
              {lead?.name}
              {' · '}
              {lead?.company}
            </p>
          </div>

          <button
            type="button"
            className="qualify-close"
            aria-label="Close"
            disabled={submitting}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div
          className="qualify-progress"
          aria-label={`Step ${step + 1} of 4`}
        >
          {STEPS.map((name, index) => (
            <span
              key={name}
              className={index <= step ? 'active' : ''}
            />
          ))}
        </div>

        <div className="qualify-body">
          {step === 0 && (
            <>
              {renderSelect(
                'product',
                'Products Interested',
                PRODUCTS,
                'Select product',
              )}

              {renderInput(
                'revenue',
                'Expected Revenue ($)',
                'Enter expected revenue',
                'number',
              )}

              {renderSelect(
                'priority',
                'Priority',
                ['High', 'Medium', 'Low'],
                'Select priority',
              )}
            </>
          )}

          {step === 1 && (
            <>
              {renderSelect(
                'budget',
                'Budget Range',
                BUDGETS,
                'Select budget range',
              )}

              {renderSelect(
                'timeline',
                'Buying Timeline',
                TIMELINES,
                'Select timeline',
              )}

              {renderInput(
                'decisionMaker',
                'Decision Maker',
                'Name and title',
              )}

              <label className="qualify-field">
                <span>Competitors</span>

                <input
                  value={form.competitors}
                  placeholder="Optional"
                  onChange={(event) =>
                    update('competitors', event.target.value)
                  }
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              {renderYesNo('needConfirmed', 'Need Confirmed')}

              {renderYesNo(
                'budgetConfirmed',
                'Budget Confirmed',
              )}

              {renderYesNo(
                'authorityConfirmed',
                'Authority Confirmed',
              )}

              {renderYesNo(
                'timelineConfirmed',
                'Timeline Confirmed',
              )}

              <label className={fieldClass('painPoints')}>
                <span>Pain Points *</span>

                <textarea
                  rows={3}
                  value={form.painPoints}
                  placeholder="Describe key business pain points..."
                  onChange={(event) =>
                    update('painPoints', event.target.value)
                  }
                  aria-invalid={Boolean(errors.painPoints)}
                />

                {errors.painPoints && (
                  <small>{errors.painPoints}</small>
                )}
              </label>
            </>
          )}

          {step === 3 && (
            <div className="qualify-review">
              <div className="qualify-review-row">
                <span>Lead</span>
                <strong>
                  {lead?.name} – {lead?.company}
                </strong>
              </div>

              <div className="qualify-review-row">
                <span>Products</span>
                <strong>{form.product}</strong>
              </div>

              <div className="qualify-review-row">
                <span>Revenue</span>
                <strong>
                  {Number(form.revenue).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </div>

              <div className="qualify-review-row">
                <span>Priority</span>
                <strong>{form.priority}</strong>
              </div>

              <div className="qualify-review-row">
                <span>Budget Range</span>
                <strong>{form.budget}</strong>
              </div>

              <div className="qualify-review-row">
                <span>Timeline</span>
                <strong>{form.timeline}</strong>
              </div>

              <div className="qualify-review-row">
                <span>Decision Maker</span>
                <strong>{form.decisionMaker}</strong>
              </div>

              <div className="qualify-review-row">
                <span>Competitors</span>
                <strong>{form.competitors || '—'}</strong>
              </div>

              <div className="qualify-review-row">
                <span>BANT Confirmed</span>
                <strong>
                  {[
                    form.needConfirmed,
                    form.budgetConfirmed,
                    form.authorityConfirmed,
                    form.timelineConfirmed,
                  ].filter((value) => value === 'Yes').length}
                  /4 criteria
                </strong>
              </div>

              <div className="qualify-review-row">
                <span>Pain Points</span>
                <strong>{form.painPoints}</strong>
              </div>

              <div className="qualify-score-row">
                <span>Qualification Score</span>

                <strong>{score}</strong>

                <span className={`qualify-heat ${qualification}`}>
                  {titleCase(qualification)}
                </span>
              </div>
            </div>
          )}

          {submitError && (
            <p className="qualify-error" role="alert">
              {submitError}
            </p>
          )}
        </div>

        <footer className="qualify-footer">
          <button
            type="button"
            className="qualify-text-button"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="qualify-secondary"
            disabled={submitting}
            onClick={reset}
          >
            ↻ Reset
          </button>

          <div className="qualify-footer-spacer" />

          {step > 0 && (
            <button
              type="button"
              className="qualify-secondary"
              disabled={submitting}
              onClick={back}
            >
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="qualify-primary"
              onClick={next}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="qualify-primary"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? 'Qualifying…' : '✓ Qualify Lead'}
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}
