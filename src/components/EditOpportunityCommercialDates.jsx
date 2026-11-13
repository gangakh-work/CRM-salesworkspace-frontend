import { useEffect, useMemo, useState } from 'react'
import { crmApi } from '../lib/api'

const EDIT_FIELDS = [
  { key: 'estimatedclosedate', label: 'Est. Close Date - ECD', type: 'date', aliases: ['estimatedclosedate', 'estimated close date', 'est close date', 'ecd'] },
  { key: 'startdate', label: 'Start Date', type: 'date', aliases: ['startdate', 'start date', 'estimatedstartdate', 'estimated start date'] },
  { key: 'enddate', label: 'End Date', type: 'date', aliases: ['enddate', 'end date', 'estimatedenddate', 'estimated end date'] },
  { key: 'actualclosedate', label: 'Actual Close Date', type: 'date', aliases: ['actualclosedate', 'actual close date'] },
  { key: 'estimatedvalue', label: 'Estd TCV', type: 'number', aliases: ['estimatedvalue', 'estd tcv', 'estimated tcv', 'total contract value', 'estimated revenue'] },
]
const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const dateValue = value => value ? String(value).slice(0, 10) : ''

export default function EditOpportunityCommercialDates({ opportunity, onClose, onSaved }) {
  const opportunityId = opportunity?.opportunityid || opportunity?.id
  const [metadata, setMetadata] = useState([])
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const mapped = useMemo(() => EDIT_FIELDS.map(field => {
    const found = metadata.find(item => field.aliases.some(alias =>
      norm(alias) === norm(item.logical_name) ||
      norm(alias) === norm(item.schema_name) ||
      norm(alias) === norm(item.label) ||
      (norm(alias).length >= 6 && (norm(item.logical_name).endsWith(norm(alias)) || norm(item.schema_name).endsWith(norm(alias))))
    ))
    return { ...field, logicalName: found?.logical_name || (['estimatedclosedate','actualclosedate','estimatedvalue'].includes(field.key) ? field.key : null), crmField: found }
  }), [metadata])

  useEffect(() => {
    let active = true
    crmApi.opportunityCreateMetadata()
      .then(response => {
        if (!active) return
        const fields = Array.isArray(response?.fields) ? response.fields : (Array.isArray(response?.data?.fields) ? response.data.fields : [])
        setMetadata(fields)
        const initial = {}
        EDIT_FIELDS.forEach(field => {
          const meta = fields.find(item => field.aliases.some(alias =>
            norm(alias) === norm(item.logical_name) ||
            norm(alias) === norm(item.schema_name) ||
            norm(alias) === norm(item.label) ||
            (norm(alias).length >= 6 && (norm(item.logical_name).endsWith(norm(alias)) || norm(item.schema_name).endsWith(norm(alias))))
          ))
          const logical = meta?.logical_name || (['estimatedclosedate','actualclosedate','estimatedvalue'].includes(field.key) ? field.key : field.key)
          const current = opportunity?.[logical] ?? opportunity?.[field.key]
          initial[field.key] = field.type === 'date' ? dateValue(current) : (current == null ? '' : String(current))
        })
        setValues(initial)
      })
      .catch(err => setError(`Unable to load CRM field metadata: ${err?.message || 'request failed'}`))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [opportunity, opportunityId])

  const update = (key, value) => setValues(old => ({ ...old, [key]: value }))

  const save = async event => {
    event.preventDefault()
    setError('')
    const dynamic_fields = {}
    for (const field of mapped) {
      if (!field.logicalName) {
        if (field.key === 'startdate' || field.key === 'enddate') {
          setError(`CRM metadata did not identify the ${field.label} field. No changes were saved.`)
          return
        }
        continue
      }
      const value = values[field.key]
      if (value === '' || value == null) {
        dynamic_fields[field.logicalName] = null
      } else if (field.type === 'number') {
        const numeric = Number(value)
        if (!Number.isFinite(numeric) || numeric < 0) {
          setError('Estd TCV must be a valid non-negative number.')
          return
        }
        dynamic_fields[field.logicalName] = numeric
      } else {
        dynamic_fields[field.logicalName] = value
      }
    }
    if (!opportunityId) return setError('Opportunity ID is missing.')
    setSaving(true)
    try {
      await crmApi.updateOpportunity(opportunityId, { dynamic_fields })
      const fresh = await crmApi.opportunity(opportunityId)
      onSaved?.(fresh?.data || fresh)
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Unable to update opportunity in Dynamics 365.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="opportunity-create-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget && !saving) onClose?.()
  }}>
    <section className="opportunity-modal opportunity-create-modal opportunity-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-opportunity-dates-title">
      <header className="opportunity-header">
        <div><h2 id="edit-opportunity-dates-title">Edit Opportunity Details</h2><p>Update dates and estimated TCV for this opportunity. Changes are saved to Dynamics 365.</p></div>
        <button type="button" className="opportunity-close" onClick={onClose} disabled={saving} aria-label="Close">×</button>
      </header>
      <form onSubmit={save}>
        <div className="opportunity-form-grid">
          {EDIT_FIELDS.map(field => <label className="opportunity-field" key={field.key}>
            <span>{field.label}</span>
            <input type={field.type} min={field.type === 'number' ? 0 : undefined} step={field.type === 'number' ? 'any' : undefined}
              value={values[field.key] ?? ''} disabled={loading || saving} onChange={event => update(field.key, event.target.value)} />
          </label>)}
        </div>
        {loading && <p className="opportunity-account-note">Loading current values and CRM field metadata…</p>}
        {notice && <p className="opportunity-account-note">{notice}</p>}
        {error && <p className="opportunity-error" role="alert">{error}</p>}
        <footer className="opportunity-actions">
          <button type="button" className="opportunity-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="opportunity-create" disabled={loading || saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </footer>
      </form>
    </section>
  </div>
}
