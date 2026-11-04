
import { useState } from 'react'
import { crmApi } from '../lib/api'

export default function CreateOpportunityModal({
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState({
    name: '',
    customer: '',
    revenue: '',
    closeDate: '',
    description: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Opportunity name is required.')
      return
    }

    if (!form.customer.trim()) {
      setError('Customer is required.')
      return
    }

    if (
      form.revenue === '' ||
      !Number.isFinite(Number(form.revenue)) ||
      Number(form.revenue) < 0
    ) {
      setError('Enter a valid expected revenue.')
      return
    }

    if (!form.closeDate) {
      setError('Expected close date is required.')
      return
    }

    setSaving(true)

    try {
      await crmApi.createOpportunity({
        name: form.name.trim(),
        customer_name: form.customer.trim(),
        estimatedvalue: Number(form.revenue),
        estimatedclosedate: form.closeDate,
        description: form.description.trim(),
      })

      onCreated?.()
    } catch (err) {
      setError(
        err?.message ||
        'Unable to create opportunity. Please check the CRM connection.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="clw-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <section
        className="opportunity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-opportunity-title"
      >
        <header className="opportunity-header">
          <div>
            <h2 id="create-opportunity-title">
              Create Opportunity
            </h2>

            <p>
              Add a new opportunity in Dynamics 365.
              Records are assigned to you so they appear
              under My Opportunities.
            </p>
          </div>

          <button
            type="button"
            className="opportunity-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form onSubmit={submit}>
          <label className="opportunity-field">
            <span>Opportunity name</span>

            <input
              autoFocus
              required
              value={form.name}
              onChange={(event) =>
                update('name', event.target.value)
              }
              placeholder="Acme — Enterprise Deal"
            />
          </label>

          <label className="opportunity-field">
            <span>Customer</span>

            <input
              required
              value={form.customer}
              onChange={(event) =>
                update('customer', event.target.value)
              }
              placeholder="Acme Corporation"
            />
          </label>

          <div className="opportunity-grid">
            <label className="opportunity-field">
              <span>Expected revenue</span>

              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.revenue}
                onChange={(event) =>
                  update('revenue', event.target.value)
                }
                placeholder="50000"
              />
            </label>

            <label className="opportunity-field">
              <span>Expected close date</span>

              <input
                required
                type="date"
                value={form.closeDate}
                onChange={(event) =>
                  update('closeDate', event.target.value)
                }
              />
            </label>
          </div>

          <label className="opportunity-field">
            <span>Description (optional)</span>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                update('description', event.target.value)
              }
            />
          </label>

          {error && (
            <p className="opportunity-error" role="alert">
              {error}
            </p>
          )}

          <footer className="opportunity-actions">
            <button
              type="button"
              className="opportunity-cancel"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="opportunity-create"
              disabled={saving}
            >
              {saving ? 'Creating…' : 'Create Opportunity'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
