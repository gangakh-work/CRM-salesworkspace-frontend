
import { useState } from 'react'
import { crmApi } from '../lib/api'

const INITIAL = {
  reason: 'No Business Need',
  competitor: '',
  remarks: '',
  scheduleFollowUp: false,
  revisitDays: '30',
}

const REASONS = [
  'No Business Need',
  'Invalid Contact',
  'Not Interested',
  'Budget Constraints',
  'Competitor Selected',
  'Duplicate Lead',
  'Other',
]

const STEPS = [
  'Reason',
  'Competitor',
  'Future Follow-up',
  'Review',
]

const disqualifiableStatuses = [
  'new',
  'contacted',
  'qualified',
]

const normalizeStatus = (status) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, ' ')

export default function DisqualifyLeadWizard({
  lead,
  onClose,
  onDisqualified,
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const status = normalizeStatus(
    lead?.status || lead?.statusName || lead?.state,
  )

  const eligible = disqualifiableStatuses.includes(status)

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

  const validate = () => {
    const nextErrors = {}

    if (step === 0 && !form.reason) {
      nextErrors.reason =
        'Select a disqualification reason.'
    }

    if (
      step === 2 &&
      form.scheduleFollowUp &&
      (!Number.isInteger(Number(form.revisitDays)) ||
        Number(form.revisitDays) < 1 ||
        Number(form.revisitDays) > 365)
    ) {
      nextErrors.revisitDays =
        'Enter a revisit period between 1 and 365 days.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const next = () => {
    if (!eligible || !validate()) return

    setSubmitError('')
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
    if (!eligible || submitting || !lead?.id) return

    setSubmitting(true)
    setSubmitError('')

    const reasonMap = {
      'No Business Need': 'no_interest',
      'Invalid Contact': 'cannot_contact',
      'Not Interested': 'no_interest',
      'Budget Constraints': 'lost',
      'Competitor Selected': 'lost',
      'Duplicate Lead': 'duplicate',
      'Other': 'canceled',
    }
    const payload = {
      reason: reasonMap[form.reason] || 'canceled',
      comment: [form.competitor && `Competitor: ${form.competitor}`, form.remarks, form.scheduleFollowUp && `Follow-up requested in ${form.revisitDays} days`].filter(Boolean).join('\n'),
    }

    try {
      await crmApi.disqualifyLead(lead.id, payload)
      await onDisqualified?.(lead, payload)
    } catch (error) {
      setSubmitError(
        error?.message ||
          'Unable to disqualify lead. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = (name) =>
    `disqualify-field${errors[name] ? ' has-error' : ''}`

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
        onChange={(event) =>
          update(name, event.target.value)
        }
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

  return (
    <div
      className="disqualify-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose()
        }
      }}
    >
      <section
        className="disqualify-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disqualify-title"
      >
        <header className="disqualify-header">
          <div className="disqualify-heading">
            <span className="disqualify-icon">⊘</span>

            <div>
              <h2 id="disqualify-title">
                Disqualify Lead
              </h2>

              <p>
                Step {step + 1} of 4: {STEPS[step]}
                {' · '}
                {lead?.name}
                {' · '}
                {lead?.company}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="disqualify-close"
            aria-label="Close"
            disabled={submitting}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {step === 0 && !eligible && (
          <div className="disqualify-warning" role="alert">
            Only leads with status New, Contacted, or
            Qualified can be disqualified.
          </div>
        )}

        <div className="disqualify-progress">
          {STEPS.map((name, index) => (
            <span
              key={name}
              className={index <= step ? 'active' : ''}
            />
          ))}
        </div>

        <div className="disqualify-body">
          {step === 0 && (
            <>
              {renderSelect(
                'reason',
                'Disqualification Reason',
                REASONS,
                'Select reason',
              )}
            </>
          )}

          {step === 1 && (
            <>
              <p className="disqualify-description">
                Optional details about the competitor or
                additional context.
              </p>

              <label className="disqualify-field">
                <span>Competitor Name</span>

                <input
                  value={form.competitor}
                  placeholder="Optional"
                  onChange={(event) =>
                    update('competitor', event.target.value)
                  }
                />
              </label>

              <label className="disqualify-field">
                <span>Remarks</span>

                <textarea
                  rows={3}
                  value={form.remarks}
                  placeholder="Additional notes about why this lead was disqualified..."
                  onChange={(event) =>
                    update('remarks', event.target.value)
                  }
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label className="disqualify-followup">
                <input
                  type="checkbox"
                  checked={form.scheduleFollowUp}
                  onChange={(event) =>
                    update(
                      'scheduleFollowUp',
                      event.target.checked,
                    )
                  }
                />

                <span>
                  <strong>Schedule future follow-up</strong>

                  <small>
                    Create a revisit task when disqualifying
                    this lead.
                  </small>
                </span>
              </label>

              {form.scheduleFollowUp && (
                <label className={fieldClass('revisitDays')}>
                  <span>Revisit After (days) *</span>

                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={form.revisitDays}
                    onChange={(event) =>
                      update('revisitDays', event.target.value)
                    }
                  />

                  {errors.revisitDays && (
                    <small>{errors.revisitDays}</small>
                  )}
                </label>
              )}
            </>
          )}

          {step === 3 && (
            <div className="disqualify-review">
              <h3>Review Disqualification</h3>

              <div className="disqualify-review-row">
                <span>Lead</span>

                <strong>
                  {lead?.name} - {lead?.company}
                </strong>
              </div>

              <div className="disqualify-review-row">
                <span>Reason</span>

                <strong className="disqualify-reason">
                  {form.reason}
                </strong>
              </div>

              {form.competitor && (
                <div className="disqualify-review-row">
                  <span>Competitor</span>

                  <strong>{form.competitor}</strong>
                </div>
              )}

              {form.remarks && (
                <div className="disqualify-review-row">
                  <span>Remarks</span>

                  <strong>{form.remarks}</strong>
                </div>
              )}

              <div className="disqualify-review-row">
                <span>Future Follow-up</span>

                <strong>
                  {form.scheduleFollowUp
                    ? `Scheduled in ${form.revisitDays} days`
                    : 'None scheduled'}
                </strong>
              </div>

              <p className="disqualify-review-note">
                Confirming will update the lead status to
                Disqualified, record timeline events, and
                refresh dashboard analytics.
              </p>
            </div>
          )}

          {submitError && (
            <p className="disqualify-error" role="alert">
              {submitError}
            </p>
          )}
        </div>

        <footer className="disqualify-footer">
          <button
            type="button"
            className="disqualify-text-button"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="disqualify-secondary"
            disabled={submitting}
            onClick={reset}
          >
            ↻ Reset
          </button>

          <div className="disqualify-footer-spacer" />

          {step > 0 && (
            <button
              type="button"
              className="disqualify-secondary"
              disabled={submitting}
              onClick={back}
            >
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="disqualify-primary"
              disabled={!eligible || submitting}
              onClick={next}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="disqualify-primary"
              disabled={!eligible || submitting}
              onClick={submit}
            >
              {submitting
                ? 'Disqualifying…'
                : '✓ Confirm Disqualification'}
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}
