
import { useState } from 'react'
import { crmApi } from '../lib/api'
import '../styles/create-lead-wizard.css'

const STEPS = ['Customer', 'Company', 'Opportunity', 'Additional', 'Review']

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  company: '',
  industry: '',
  country: '',
  website: '',
  employees: '',
  opportunity: '',
  revenue: '',
  budget: '',
  closeDate: '',
  source: '',
  priority: 'Medium',
  description: '',
  notes: '',
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Travel',
  'Education',
  'Other',
]

const countries = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'Other',
]

const sources = [
  'Website',
  'Referral',
  'LinkedIn',
  'Events',
  'Email',
  'Other',
]

export default function CreateLeadWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draftMessage, setDraftMessage] = useState('')

  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const validateStep = () => {
    const required = {
      0: [
        ['firstName', 'First name'],
        ['lastName', 'Last name'],
        ['email', 'Email'],
        ['phone', 'Phone'],
        ['jobTitle', 'Job title'],
      ],
      1: [
        ['company', 'Company name'],
        ['industry', 'Industry'],
        ['country', 'Country'],
      ],
      2: [
        ['opportunity', 'Opportunity name'],
        ['revenue', 'Expected revenue'],
        ['closeDate', 'Expected close date'],
      ],
      3: [['source', 'Lead source']],
    }

    for (const [key, label] of required[step] || []) {
      if (!String(form[key] || '').trim()) {
        setError(`${label} is required.`)
        return false
      }
    }

    if (step === 0 && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return false
    }

    return true
  }

  const next = () => {
    if (!validateStep()) return
    setStep((current) => Math.min(4, current + 1))
    setError('')
  }

  const back = () => {
    setStep((current) => Math.max(0, current - 1))
    setError('')
  }

  const reset = () => {
    setForm(initialForm)
    setDocument(null)
    setError('')
    setDraftMessage('')
    setStep(0)
  }

  const saveDraft = () => {
    try {
      localStorage.setItem(
        'crm-create-lead-draft',
        JSON.stringify({ form, step })
      )
      setDraftMessage('Draft saved in this browser.')
      setError('')
    } catch {
      setError('Unable to save draft in this browser.')
    }
  }

  const uploadDocument = async (file) => {
    if (!file) return

    const allowed = /\.(eml|pdf)$/i.test(file.name)

    if (!allowed) {
      setError('Please upload an email (.eml) or PDF document.')
      return
    }

    setDocument(file)
    setError('')
  }

  const createLead = async () => {
    setLoading(true)
    setError('')

    try {
      // Keep this payload aligned with your existing Dataverse API.
      const payload = {
        subject: form.opportunity.trim(),
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        emailaddress1: form.email.trim(),
        telephone1: form.phone.trim(),
        jobtitle: form.jobTitle.trim(),
        companyname: form.company.trim(),
        address1_country: form.country,
        websiteurl: form.website.trim(),
        numberofemployees:
          form.employees === '' ? undefined : Number(form.employees),
        description: [form.description, form.notes]
          .filter(Boolean)
          .join('\n\n'),
        lead_source: form.source,
        estimated_amount: form.revenue === '' ? undefined : Number(form.revenue),
      }

      // Existing CRM API call; no authentication/API implementation changed.
      const result = await crmApi.createLead(payload)

      localStorage.removeItem('crm-create-lead-draft')
      onCreated?.(result)
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Unable to create lead. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (label, name, placeholder = '', type = 'text', required = false) => (
    <label className="clw-field" key={name}>
      <span>
        {label}{required && ' *'}
      </span>
      <input
        type={type}
        value={form[name]}
        placeholder={placeholder}
        required={required}
        onChange={(e) => update(name, e.target.value)}
      />
    </label>
  )

  const selectField = (label, name, options, placeholder, required = false) => (
    <label className="clw-field" key={name}>
      <span>
        {label}{required && ' *'}
      </span>
      <select
        value={form[name]}
        required={required}
        onChange={(e) => update(name, e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )

  const textArea = (label, name, placeholder = '') => (
    <label className="clw-field clw-full" key={name}>
      <span>{label}</span>
      <textarea
        value={form[name]}
        placeholder={placeholder}
        onChange={(e) => update(name, e.target.value)}
      />
    </label>
  )

  const review = [
    ['Contact', `${form.firstName} ${form.lastName}`],
    ['Email', form.email],
    ['Phone', form.phone],
    ['Company', form.company],
    ['Industry', form.industry],
    ['Country', form.country],
    ['Opportunity', form.opportunity],
    ['Revenue', form.revenue ? `$${Number(form.revenue).toLocaleString()}` : '—'],
    ['Close Date', form.closeDate],
    ['Source', form.source],
    ['Priority', form.priority],
  ]

  return (
    <div className="clw-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose?.()
    }}>
      <section
        className="clw-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clw-title"
      >
        <header className="clw-header">
          <div>
            <h2 id="clw-title">Create Lead</h2>
            <p>
              Step {step + 1} of 5: {STEPS[step]} · Owner: Eati Ramya Sri
            </p>
          </div>
          <button className="clw-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="clw-progress" aria-label={`Step ${step + 1} of 5`}>
          {STEPS.map((name, index) => (
            <span
              key={name}
              className={index <= step ? 'active' : ''}
            />
          ))}
        </div>

        <div className="clw-document">
          <div>
            <strong>Create Lead from Document</strong>
            <p>
              Upload an Email (.eml), PDF, or RFP PDF to extract lead
              information automatically.
            </p>
            {document && <small>{document.name}</small>}
          </div>

          <label className="clw-upload">
            <input
              type="file"
              accept=".eml,.pdf"
              onChange={(e) => uploadDocument(e.target.files?.[0])}
            />
            <span>♧ Upload Document</span>
          </label>
        </div>

        <form
          className="clw-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (step < 4) next()
            else createLead()
          }}
        >
          {step === 0 && (
            <>
              {field('First Name', 'firstName', '', 'text', true)}
              {field('Last Name', 'lastName', '', 'text', true)}
              {field('Email', 'email', 'name@company.com', 'email', true)}
              {field('Phone', 'phone', '', 'tel', true)}
              {field('Job Title', 'jobTitle', '', 'text', true)}
            </>
          )}

          {step === 1 && (
            <>
              {field('Company Name', 'company', '', 'text', true)}
              {selectField('Industry', 'industry', industries, 'Select industry', true)}
              {selectField('Country', 'country', countries, 'Select country', true)}
              {field('Website', 'website', 'https://example.com', 'url')}
              {field('Employees', 'employees', 'e.g. 100-500', 'number')}
            </>
          )}

          {step === 2 && (
            <>
              {field('Opportunity Name', 'opportunity', '', 'text', true)}
              {field('Expected Revenue ($)', 'revenue', '', 'number', true)}
              {field('Budget ($)', 'budget', '', 'number')}
              {field('Expected Close Date', 'closeDate', '', 'date', true)}
            </>
          )}

          {step === 3 && (
            <>
              {selectField('Lead Source', 'source', sources, 'Select source', true)}
              {selectField(
                'Priority',
                'priority',
                ['Low', 'Medium', 'High'],
                'Select priority'
              )}
              {textArea('Description', 'description')}
              {textArea('Notes', 'notes')}
            </>
          )}

          {step === 4 && (
            <div className="clw-review">
              {review.map(([label, value]) => (
                <div className="clw-review-row" key={label}>
                  <span>{label}</span>
                  <strong>{value || '—'}</strong>
                </div>
              ))}
            </div>
          )}

          {error && <p className="clw-error">{error}</p>}
          {draftMessage && <p className="clw-success">{draftMessage}</p>}

          <footer className="clw-actions">
            <button type="button" className="clw-text-button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="clw-outline-button" onClick={saveDraft}>
              ▣ Save as Draft
            </button>
            <button type="button" className="clw-outline-button" onClick={reset}>
              ↻ Reset
            </button>

            <div className="clw-navigation">
              <button
                type="button"
                className="clw-outline-button"
                onClick={back}
                disabled={step === 0 || loading}
              >
                ← Back
              </button>
              <button type="submit" className="clw-primary-button" disabled={loading}>
                {loading
                  ? 'Creating…'
                  : step === 4
                    ? '✓ Create Lead'
                    : 'Next →'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
