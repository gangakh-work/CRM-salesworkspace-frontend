import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { crmApi } from '../lib/api'
import '../styles/opportunity-create-form.css'

// Field labels and tooltip text are taken from Opportunity Mandatory Fields Tooltips.xlsx.
// The workbook contains 30 rows, including the repeated funding-availability label.
const FIELD_DEFINITIONS = [
  ['name', 'Opp Name', 'text', 'Enter a meaningful name that clearly identifies the sales opportunity, typically including customer name, project/service, or deal description.'],
  ['accountId', 'Account', 'account', "Select the customer's account record for whom this opportunity is being created. Ensure correct account selected before proceeding."],
  ['contactId', 'Contact', 'contact', 'Select the primary contact associated with this opportunity. Main communication contact.'],
  ['territory', 'Territory', 'text', 'Select territory responsible for managing opportunity.'],
  ['region', 'Region', 'text', 'Select region responsible for opportunity.'],
  ['stage', 'Sales Stage', 'stage', 'Indicates current progress in sales cycle.'],
  ['industry', 'industry', 'text', "Indicates customer's industry segment."],
  ['fundingAvailable', 'Is Funding available for this Opportunity?', 'checkbox', 'Enter the revenue expected to be realized within the current financial year from this opportunity.'],
  ['estimatedTcv', 'Estd TCV', 'number', 'Total estimated contract value over full contract term, including all years and recurring revenue.'],
  ['closeDate', 'Est. Close Date - ECD', 'date', 'Forecasted date expected to convert to Closed Won; reviewed regularly.'],
  ['startDate', 'Start Date', 'date', 'Expected project start date upon successful closure.'],
  ['endDate', 'End Date', 'date', 'Planned completion date.'],
  ['actualCloseDate', 'Actual Close Date', 'date', 'Date actually closed.'],
  ['winLossReason', 'Reasons for Win and Loss', 'textarea', 'Document primary reasons for winning or losing.'],
  ['inYearRevenue', 'In Year Revenue', 'number', 'Expected revenue within current financial year.'],
  ['competencyDirector', 'Competency Director', 'text', 'Select Competency Director.'],
  ['deliveryDirector', 'Delivery Director', 'text', 'Select Delivery Director.'],
  ['primarySource', 'Primary Source', 'text', 'How opportunity identified/generated.'],
  ['partnerEngaged', 'Partner Engaged', 'text', 'Whether partner engaged.'],
  ['opportunityKind', 'Opportunity Kind', 'text', 'Nature of business pursued (new business, existing business, renewal, upsell, cross-sell, etc.).'],
  ['opportunityType', 'Opportunity Type', 'text', 'Engagement type (services, products, solutions, managed services, implementation, consulting, etc.).'],
  ['primaryOffering', 'Primary Offering', 'text', 'Primary offering associated.'],
  ['primaryOfferingPercent', 'Primary Offering %', 'number', 'Percentage of total opportunity value attributed to Primary Offering.'],
  ['genAiClassification', 'GenAI Classification', 'text', 'Applicable Generative AI classification.'],
  ['gtm', 'GTM', 'text', 'Go-To-Market strategy for classification/reporting/pipeline/business planning.'],
  ['partnerGtmCampaigns', 'Partner GTM Campaigns', 'text', 'Partner-led GTM campaign.'],
  ['description', 'Description', 'textarea', 'Additional details: requirements, products/services, background, considerations, notes.'],
  ['programmaticPlays', 'Programmatic Plays', 'text', ''],
  ['fundingAvailableAdditional', 'Is Funding available for this Opportunity?', 'text', ''],
  ['fundingValueUsd', 'Funding Value in USD', 'number', ''],
]

const SALES_STAGE_OPTIONS = ['Qualify', 'Develop', 'Propose', 'Close']

const makeEmptyForm = () => Object.fromEntries(
  FIELD_DEFINITIONS.map(([key, , type]) => [key, type === 'checkbox' ? false : ''])
)
const rowsOf = (value) => Array.isArray(value)
  ? value
  : (value?.data || value?.items || value?.value || value?.results || [])
const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
const cleanGuid = (value) => String(value || '').replace(/[{}]/g, '')

export default function CreateOpportunityModal({ onClose, onCreated }) {
  const [form, setForm] = useState(makeEmptyForm)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [accountSearch, setAccountSearch] = useState('')
  const [contacts, setContacts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingAccountDetails, setLoadingAccountDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [accountNotice, setAccountNotice] = useState('')
  const [crmFields, setCrmFields] = useState([])
  const [metadataNotice, setMetadataNotice] = useState('')
  const [lookupIds, setLookupIds] = useState({})

  useEffect(() => {
    let active = true
    setLoadingAccounts(true)
    const timer = setTimeout(() => {
      crmApi.accountOptions({ search: accountSearch, limit: 50 })
        .then((response) => {
          if (!active) return
          const list = rowsOf(response).map((row) => ({
            ...row,
            id: cleanGuid(row.id || row.accountid),
            name: row.name || row.title || row.accountname || 'Unnamed account',
          })).filter((row) => row.id)
          setAccounts(list)
        })
        .catch((err) => { if (active) setError(err?.message || 'Unable to load accounts from CRM.') })
        .finally(() => { if (active) setLoadingAccounts(false) })
    }, accountSearch ? 300 : 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [accountSearch])


  useEffect(() => {
    let active = true
    crmApi.opportunityCreateMetadata()
      .then((response) => {
        if (!active) return
        const fields = Array.isArray(response?.fields) ? response.fields : []
        setCrmFields(fields)
        setMetadataNotice(fields.length
          ? `Loaded ${fields.length} createable fields and available CRM choices.`
          : 'CRM metadata returned no createable fields; unmatched fields may need manual mapping.')
      })
      .catch((err) => {
        if (active) setMetadataNotice(`CRM field metadata could not be loaded: ${err?.message || 'request failed'}`)
      })
    return () => { active = false }
  }, [])

  const normalizeLabel = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const crmFieldFor = (label) => {
    const target = normalizeLabel(label)
    return crmFields.find((field) => normalizeLabel(field.label) === target ||
      normalizeLabel(field.schema_name) === target || normalizeLabel(field.logical_name) === target)
  }
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const selectAccount = async (accountId) => {
    const id = cleanGuid(accountId)
    const selected = accounts.find((account) => account.id === id) || null
    setSelectedAccount(selected)
    setForm((current) => ({ ...current, accountId: id, contactId: '', territory: '', region: '', competencyDirector: '', deliveryDirector: '', industry: '', primaryOffering: '' }))
    setLookupIds({})
    setContacts([])
    setAccountNotice('')
    setError('')
    if (!id) return

    setLoadingAccountDetails(true)
    try {
      // Existing CRM account-detail endpoint: GET /crm/accounts/{account_id}.
      const response = await crmApi.account(id)
      const account = response?.account || response?.data?.account || response?.data || response || {}
      const contactRows = rowsOf(response?.contacts)
      const mappedContacts = contactRows.map((contact) => ({
        ...contact,
        id: cleanGuid(contact.id || contact.contactid),
        name: contact.name || contact.fullname || 'Unnamed contact',
      })).filter((contact) => contact.id)
      setContacts(mappedContacts)

      const primaryContactId = cleanGuid(firstValue(account.primary_contact_id, account._primarycontactid_value))
      const primaryContact = mappedContacts.find((contact) => contact.id === primaryContactId)
      const values = {
        customerName: account.name || selected?.name || '',
        contactId: primaryContactId || primaryContact?.id || '',
        industry: firstValue(account.industry, account.industrycode_label),
        territory: firstValue(account.territory, account.territory_name, account._territoryid_value_name),
        region: firstValue(account.region, account.region_name, account._new_regionid_value_name),
        competencyDirector: firstValue(account.competency_director, account.competency_director_name, account._new_competencymanager_value_name),
        deliveryDirector: firstValue(account.delivery_director, account.delivery_director_name, account._new_deliverydirector_value_name),
        primaryOffering: firstValue(account.primary_offering, account.primaryoffering),
      }
      setLookupIds({
        territory: cleanGuid(firstValue(account.territory_id, account._territoryid_value, account._new_territoryid_value)),
        region: cleanGuid(firstValue(account.region_id, account._new_regionid_value, account._regionid_value)),
        competencyDirector: cleanGuid(firstValue(account.competency_director_id, account._new_competencymanager_value)),
        deliveryDirector: cleanGuid(firstValue(account.delivery_director_id, account._new_deliverydirector_value)),
      })
      setForm((current) => ({ ...current, ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '')) }))
      const populated = Object.entries(values).filter(([, value]) => value !== '').length
      const missingDirectors = [
        ['competencyDirector', 'Competency Director'],
        ['deliveryDirector', 'Delivery Director'],
      ].filter(([key]) => !values[key]).map(([, label]) => label)
      setAccountNotice(populated
        ? `Account details loaded. ${populated} matching field(s) were populated from CRM.${missingDirectors.length ? ` ${missingDirectors.join(' and ')} ${missingDirectors.length === 1 ? 'has' : 'have'} no value set on this account.` : ''}`
        : 'Account selected. CRM did not return additional matching fields; you can enter them manually.')
    } catch (err) {
      setAccountNotice(`Account selected, but its details could not be loaded: ${err?.message || 'CRM request failed'}`)
    } finally {
      setLoadingAccountDetails(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Opportunity name is required.')
    if (!form.accountId) return setError('Please select an account.')
    setSaving(true)
    try {
      // Keep the current supported API contract. Extra workbook fields remain in the UI
      // until their Dataverse Opportunity logical names and types are confirmed.
      const payload = {
        name: form.name.trim(),
        customer_name: selectedAccount?.name || form.customerName || '',
        customer_id: form.accountId,
        contact_id: form.contactId || undefined,
        description: form.description.trim(),
        dynamic_fields: {},
      }
      FIELD_DEFINITIONS.forEach(([key, label]) => {
        if (['name', 'accountId', 'contactId', 'description', 'estimatedTcv', 'closeDate'].includes(key)) return
        const metadata = crmFieldFor(label)
        const value = form[key]
        if (metadata && value !== '' && value !== null && value !== undefined) {
          // Lookup controls must submit a GUID; plain text is not a valid lookup bind.
          if (metadata.attribute_type === 'Lookup' && lookupIds[key]) payload.dynamic_fields[metadata.logical_name] = { id: lookupIds[key] }
          else if (metadata.attribute_type !== 'Lookup') payload.dynamic_fields[metadata.logical_name] = value
          else if (typeof value === 'object' && value.id) payload.dynamic_fields[metadata.logical_name] = value
          else if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) payload.dynamic_fields[metadata.logical_name] = { id: value }
        }
      })
      if (form.estimatedTcv !== '' && Number.isFinite(Number(form.estimatedTcv))) {
        payload.estimatedvalue = Number(form.estimatedTcv)
      }
      if (form.closeDate) payload.estimatedclosedate = form.closeDate
      await crmApi.createOpportunity(payload)
      onCreated?.()
    } catch (err) {
      setError(err?.message || 'Unable to create opportunity. Please check the CRM connection.')
    } finally {
      setSaving(false)
    }
  }

  const renderField = ([key, label, type, tooltip]) => {
    const common = { id: `opportunity-${key}`, disabled: saving, value: form[key] ?? '', onChange: (event) => update(key, event.target.value) }
    const metadata = crmFieldFor(label)
    const isAccountLookup = ['territory', 'region', 'competencyDirector', 'deliveryDirector'].includes(key)
    const options = (metadata?.options || []).map((option) => ({
      ...option,
      value: isAccountLookup ? cleanGuid(option.value) : option.value,
    }))
    const fieldOptions = isAccountLookup && lookupIds[key] && form[key] &&
      !options.some((option) => cleanGuid(option.value) === lookupIds[key])
      ? [{ value: lookupIds[key], label: form[key] }, ...options]
      : options
    return (
      <label className={`opportunity-field ${type === 'textarea' ? 'opportunity-field-wide' : ''}`} key={key} htmlFor={common.id}>
        <span>{label}{key === 'name' || key === 'accountId' ? ' *' : ''}{tooltip && <small className="opportunity-tooltip" title={tooltip} aria-label={tooltip}>ⓘ</small>}</span>
        {type === 'account' ? (
          <>
            <input
              type="search"
              value={accountSearch}
              onChange={(event) => setAccountSearch(event.target.value)}
              placeholder="Search accounts by name, email or city"
              aria-label="Search CRM accounts"
              disabled={saving}
            />
            <select id={common.id} required value={form.accountId} disabled={loadingAccounts || saving} onChange={(event) => void selectAccount(event.target.value)}>
              <option value="">{loadingAccounts ? 'Loading accounts…' : accounts.length ? 'Select account' : 'No matching accounts'}</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              {selectedAccount && !accounts.some((account) => account.id === selectedAccount.id) && <option value={selectedAccount.id}>{selectedAccount.name}</option>}
            </select>
            <small className="opportunity-account-results">{loadingAccounts ? 'Searching Dataverse…' : `${accounts.length} account${accounts.length === 1 ? '' : 's'} shown. Search to find other accounts.`}</small>
          </>
        ) : type === 'contact' ? (
          <select id={common.id} value={form.contactId} disabled={!form.accountId || loadingAccountDetails || saving} onChange={common.onChange}>
            <option value="">{form.accountId ? 'Select contact' : 'Select an account first'}</option>
            {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </select>
        ) : type === 'stage' ? (
          <select {...common}>
            <option value="">Select {label}</option>
            {options.length
              ? options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)
              : SALES_STAGE_OPTIONS.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
        ) : fieldOptions.length ? (
          <select
            {...common}
            value={isAccountLookup ? (lookupIds[key] || '') : common.value}
            onChange={(event) => {
              const value = event.target.value
              if (isAccountLookup) {
                const selectedOption = fieldOptions.find((option) => cleanGuid(option.value) === cleanGuid(value))
                setLookupIds((current) => ({ ...current, [key]: cleanGuid(value) }))
                update(key, selectedOption?.label || '')
              } else {
                update(key, value)
              }
            }}
          >
            <option value="">Select {label}</option>
            {fieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : type === 'checkbox' ? (
          <input id={common.id} type="checkbox" checked={Boolean(form[key])} disabled={saving} onChange={(event) => update(key, event.target.checked)} />
        ) : type === 'textarea' ? (
          <textarea {...common} rows={3} />
        ) : (
          <input {...common} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined} />
        )}
      </label>
    )
  }

  return createPortal((
    <div className="opportunity-create-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose?.()
    }}>
      <section className="opportunity-modal opportunity-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-opportunity-title">
        <header className="opportunity-header">
          <div>
            <h2 id="create-opportunity-title">Create Opportunity</h2>
            <p>Select an account to load its available CRM details automatically, then complete the remaining fields.</p>
          </div>
          <button type="button" className="opportunity-close" onClick={onClose} disabled={saving} aria-label="Close">×</button>
        </header>
        <form onSubmit={submit}>
          <div className="opportunity-form-grid">{FIELD_DEFINITIONS.map(renderField)}</div>
          {metadataNotice && <p className="opportunity-account-note" role="status">{metadataNotice}</p>}
          {loadingAccountDetails && <p className="opportunity-account-note" role="status">Loading selected account details…</p>}
          {accountNotice && <p className="opportunity-account-note" role="status">{accountNotice}</p>}
          {error && <p className="opportunity-error" role="alert">{error}</p>}
          <footer className="opportunity-actions">
            <button type="button" className="opportunity-cancel" disabled={saving} onClick={onClose}>Cancel</button>
            <button type="submit" className="opportunity-create" disabled={saving || loadingAccounts || loadingAccountDetails}>{saving ? 'Creating…' : 'Create Opportunity'}</button>
          </footer>
        </form>
      </section>
    </div>
  ), document.body)
}
