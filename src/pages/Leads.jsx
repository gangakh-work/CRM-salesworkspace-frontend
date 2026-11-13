/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { crmApi } from '../lib/api'
import Icon from '../components/Icon'
import { Avatar, PageHead, Segmented, Trend } from '../components/ui'
import { LEAD_STATUSES } from '../data/seed'
import { money } from '../lib/format'
import { useApp } from '../lib/store'
import CreateLeadWizard from '../components/CreateLeadWizard'
import QualifyLeadWizard from '../components/QualifyLeadWizard'
import DisqualifyLeadWizard from '../components/DisqualifyLeadWizard'

const KPIS = (leads) => { const open=leads.filter(x=>!['qualified','disqualified','unqualified'].includes(String(x.status).toLowerCase())); const qualified=leads.filter(x=>String(x.status).toLowerCase().includes('qualif')).length; const recent=leads.filter(x=>{const d=new Date(x.created);return !Number.isNaN(d.getTime())&&(Date.now()-d.getTime())<7*86400000}).length; return [{label:'Open leads',value:open.length,icon:'target'},{label:'New this week',value:recent,icon:'sparkle'},{label:'Qualified rate',value:leads.length?`${Math.round(qualified/leads.length*100)}%`:'0%',icon:'check'},{label:'Total leads',value:leads.length,icon:'users'}] }

const SOURCE_TONE = {
  Website: 'teal',
  Referral: 'blue',
  LinkedIn: 'sky',
  Events: 'violet',
  Ads: 'amber',
}

const heat = (score) => {
  const value = Number(score) || 0
  return value >= 75 ? 'hot' : value >= 50 ? 'warm' : 'cold'
}

const statusText = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'New'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return String(value).trim() || 'New'
}

const normalizeLeadStatus = (value) => {
  const status = statusText(value)
  const normalized = status.toLowerCase()

  if (/disqual|unqual|lost|cancel|cannot contact|not interested/.test(normalized)) {
    return 'Unqualified'
  }
  if (normalized.includes('qualif')) return 'Qualified'
  if (normalized.includes('contact')) return 'Contacted'
  if (normalized === 'new' || normalized === 'open') return 'New'
  return status
}

const displayText = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return String(value)
}

const formattedValue = (row, field) =>
  row[`${field}@OData.Community.Display.V1.FormattedValue`]

function normalizeLead(row) {
  const source =
    row.source ??
    row.leadsourcecode_label ??
    row.leadsourcecode ??
    'CRM'

  const score = Number(row.score ?? row.leadscore ?? 50)

  return {
    id: row.leadid ?? row.id ?? row.leadId,
    name:
      row.name ??
      row.fullname ??
      row.full_name ??
      row.subject ??
      'Unnamed lead',
    company:
      row.company ??
      row.companyname ??
      row.company_name ??
      '—',
    email:
      row.email ??
      row.emailaddress1 ??
      '',
    source: displayText(source, 'CRM'),
    score: Number.isFinite(score)
      ? Math.max(0, Math.min(100, score))
      : 50,
    status: normalizeLeadStatus(
      row.statuscode_label ??
      row.status_label ??
      formattedValue(row, 'statuscode') ??
      formattedValue(row, 'statecode') ??
      row.statecode_label ??
      row.status
    ),
    owner:
      row.owner ??
      row.owner_name ??
      row.ownerid_name ??
      'Unassigned',
    value: Number(
      row.value ??
      row.expectedRevenue ??
      row.estimatedvalue ??
      row.estimated_value ??
      0
    ) || 0,
    created:
      row.created ??
      row.createdon ??
      '',
  }
}

function getLeadRows(result) {
  if (Array.isArray(result)) {
    return result
  }

  const rows =
    result?.data ??
    result?.leads ??
    result?.value ??
    result?.results ??
    []

  if (Array.isArray(rows)) {
    return rows
  }

  throw new Error('Unexpected CRM leads response.')
}

export default function Leads() {
  const { toast, go, setRecordDetail, activeDashboardView } = useApp()

  const [leads, setLeads] = useState([])
  const [showCreateLead, setShowCreateLead] = useState(false)
  const [liveState, setLiveState] = useState('loading')
  const [status, setStatus] = useState('All')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [deleting, setDeleting] = useState(false)

  // Qualification wizard
  const [qualifyingId, setQualifyingId] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)

  // Disqualification wizard
  const [disqualifyingId, setDisqualifyingId] = useState(null)
  const [disqualifyingLead, setDisqualifyingLead] = useState(null)

  // Load leads from CRM
  const loadLeads = useCallback(async () => {
    setLiveState('loading')
    setError('')

    try {
      const result = await crmApi.leads()
      const rows = getLeadRows(result)

      setLeads(rows.filter((row) => row.leadid || row.id || row.leadId).map(normalizeLead))
      setSelectedIds(new Set())
      setLiveState('live')
    } catch (err) {
      setLiveState('error')
      setError(err?.message || 'Unable to load leads from CRM.')
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  // Search and status filters
  const rows = useMemo(() => {
    const search = q.trim().toLowerCase()

    return leads.filter((lead) => {
      const leadStatus = normalizeLeadStatus(lead.status).toLowerCase()

      const statusMatch =
        status === 'All' ||
        leadStatus === String(status).toLowerCase()

      const searchMatch =
        !search ||
        [
          lead.name,
          lead.id,
          lead.company,
          lead.email,
          lead.source,
          lead.owner,
        ]
          .map((value) => String(value ?? ''))
          .join(' ')
          .toLowerCase()
          .includes(search)

      const dashboardMatch = activeDashboardView?.page !== 'leads' ||
        activeDashboardView.recordIds.includes(String(lead.id))

      return statusMatch && searchMatch && dashboardMatch
    })
  }, [leads, q, status, activeDashboardView])

  const toggleLead = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleVisibleLeads = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      const allSelected = rows.length > 0 && rows.every((lead) => next.has(lead.id))
      rows.forEach((lead) => allSelected ? next.delete(lead.id) : next.add(lead.id))
      return next
    })
  }

  const deleteSelectedLeads = async () => {
    const ids = [...selectedIds]
    if (!ids.length || deleting) return
    if (!window.confirm(`Delete ${ids.length} selected lead${ids.length === 1 ? '' : 's'} from Dataverse? This cannot be undone.`)) return

    setDeleting(true)
    const results = await crmApi.deleteLeads(ids)
    const deletedIds = ids.filter((_, index) => results[index].status === 'fulfilled')
    const failures = results.filter((result) => result.status === 'rejected')
    if (deletedIds.length) {
      setLeads((current) => current.filter((lead) => !deletedIds.includes(lead.id)))
      setSelectedIds((current) => new Set([...current].filter((id) => !deletedIds.includes(id))))
    }
    if (failures.length) {
      const firstError = failures[0].reason?.message || 'Permission denied or CRM delete failed.'
      toast({ icon: 'target', title: 'Some leads could not be deleted', text: `${deletedIds.length} deleted; ${failures.length} failed. ${firstError}` })
    } else {
      toast({ icon: 'check', title: 'Leads deleted', text: `${deletedIds.length} lead${deletedIds.length === 1 ? '' : 's'} deleted from Dataverse.` })
    }
    setDeleting(false)
  }

  const openDetail=async(lead)=>{setRecordDetail({id:lead.id,summary:lead});go('lead-detail')}

  // Open qualification wizard
  const convert = (lead) => {
    if (
      !lead?.id ||
      qualifyingId !== null ||
      disqualifyingId !== null
    ) {
      return
    }

    setSelectedLead(lead)
  }

  // Open disqualification wizard
  const handleDisqualify = (lead) => {
    if (
      !lead?.id ||
      qualifyingId !== null ||
      disqualifyingId !== null
    ) {
      return
    }

    setDisqualifyingLead(lead)
  }

  // Qualification completed successfully
  const handleLeadQualified = async (lead) => {
    setQualifyingId(lead.id)

    try {
      await loadLeads()

      setSelectedLead(null)

      toast({
        icon: 'pipeline',
        title: 'Lead qualified',
        text: `${lead.name} was successfully qualified.`,
      })
    } catch (err) {
      toast({
        icon: 'target',
        title: 'Qualification failed',
        text: err?.message || 'Unable to refresh leads.',
      })
    } finally {
      setQualifyingId(null)
    }
  }

  // Disqualification completed successfully
  const handleLeadDisqualified = async (lead) => {
    setDisqualifyingId(lead.id)

    try {
      await loadLeads()

      setDisqualifyingLead(null)

      toast({
        icon: 'check',
        title: 'Lead disqualified',
        text: `${lead.name} was successfully disqualified.`,
      })
    } catch (err) {
      toast({
        icon: 'target',
        title: 'Disqualification completed',
        text:
          err?.message ||
          'Lead was disqualified, but the list could not refresh.',
      })
    } finally {
      setDisqualifyingId(null)
    }
  }

  // Create Lead completed
  const handleLeadCreated = async () => {
    setShowCreateLead(false)

    toast({
      icon: 'target',
      title: 'Lead created',
      text: 'The lead was submitted to CRM.',
    })

    await loadLeads()
  }

  return (
    <>
      <PageHead
        title="Leads"
        sub={activeDashboardView?.page === 'leads' ? activeDashboardView.label : 'Score, qualify and convert new prospects'}
      >
        <label className="search">
          <Icon name="search" size={17} />

          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search leads"
            aria-label="Search leads"
          />
        </label>


        <button type="button" className="chip" onClick={() => crmApi.leadTemplate().catch(e => toast({icon:"target",title:"Template download failed",text:e.message}))}>Download template</button>
        <button
          type="button"
          className="cta"
          onClick={() => setShowCreateLead(true)}
        >
          <Icon name="plus" size={17} stroke={2.2} />
          Add lead
        </button>
      </PageHead>


      {/* Existing KPI cards */}
      <div className="stats">
        {KPIS(leads).map((kpi, index) => (
          <article
            key={kpi.label}
            className="card stat hl rise"
            style={{ '--d': index + 1 }}
          >
            <span className="stat-ic">
              <Icon name={kpi.icon} size={18} />
            </span>

            <small>{kpi.label}</small>

            <strong className="figure">
              {kpi.value}
            </strong>

            {kpi.delta != null && <Trend value={kpi.delta} />}
          </article>
        ))}
      </div>

      {liveState === 'loading' && (
        <p className="empty" role="status">
          Loading leads from CRM…
        </p>
      )}

      {liveState === 'error' && (
        <div className="empty" role="alert">
          <p>
            {error || 'Unable to load CRM leads.'}
          </p>

          <button
            type="button"
            className="chip"
            onClick={loadLeads}
          >
            Retry
          </button>
        </div>
      )}

      {/* Existing filters and pipeline navigation */}
      <div
        className="filter-bar rise"
        style={{ '--d': 5 }}
      >
        <Segmented
          value={status}
          options={LEAD_STATUSES}
          onChange={setStatus}
        />

        <button
          type="button"
          className="chip"
          onClick={() => go('opportunities')}
        >
          View pipeline

          <Icon
            name="arrowRight"
            size={14}
            stroke={2}
          />
        </button>
        {selectedIds.size > 0 && (
          <button type="button" className="chip danger" onClick={deleteSelectedLeads} disabled={deleting}>
            <Icon name="trash" size={14} />
            {deleting ? 'Deleting…' : `Delete selected (${selectedIds.size})`}
          </button>
        )}
      </div>

      {/* Existing lead table */}
      <div
        className="card table-card rise"
        style={{ '--d': 6 }}
      >
        <div className="lead-table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="record-select-checkbox"
                    aria-label="Select all visible leads"
                    checked={rows.length > 0 && rows.every((lead) => selectedIds.has(lead.id))}
                    onChange={toggleVisibleLeads}
                  />
                </th>
                <th>Lead</th>
                <th>Source</th>
                <th>Score</th>
                <th>Status</th>
                <th>Owner</th>
                <th className="num">Value</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((lead, index) => {
                const leadStatus = statusText(lead.status)
                const normalizedStatus =
                  leadStatus.toLowerCase()

                const isUnqualified =
                  normalizedStatus === 'unqualified'

                const isQualifying =
                  qualifyingId === lead.id

                const isDisqualifying =
                  disqualifyingId === lead.id

                const busy =
                  qualifyingId !== null ||
                  disqualifyingId !== null ||
                  liveState !== 'live'

                return (
                  <tr
                    key={lead.id}
                    style={{ '--i': index }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        className="record-select-checkbox"
                        aria-label={`Select ${lead.name}`}
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                      />
                    </td>
                    <td>
                      <span className="who">
                        <Avatar
                          person={lead}
                          size={34}
                        />

                        <span>
                          <button type="button" className="lead-detail-link" onClick={()=>openDetail(lead)}>{lead.name}</button>

                          <em>
                            {lead.company}
                            {' · '}
                            {lead.created}
                          </em>
                        </span>
                      </span>
                    </td>

                    <td>
                      <span className="src">
                        <i
                          className={`dot ${
                            SOURCE_TONE[lead.source] || 'teal'
                          }`}
                        />

                        {lead.source}
                      </span>
                    </td>

                    <td>
                      <span className={`score ${heat(lead.score)}`}>
                        <span className="score-track">
                          <i
                            style={{
                              width: `${lead.score}%`,
                            }}
                          />
                        </span>

                        <b>{lead.score}</b>
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status lead-${normalizedStatus}`}
                      >
                        {leadStatus}
                      </span>
                    </td>

                    <td>
                      <span
                        className="owner"
                        title={lead.owner}
                      >
                        <Avatar
                          person={{ name: lead.owner || 'Unassigned' }}
                          size={26}
                        />

                        {String(lead.owner).split(' ')[0]}
                      </span>
                    </td>

                    <td className="num">
                      {money(lead.value)}
                    </td>

                    {/* Qualify and Disqualify side by side */}
                    <td className="num">
                      <div className="lead-actions">
                        <button
                          type="button"
                          className="chip convert"
                          disabled={
                            isUnqualified ||
                            busy
                          }
                          onClick={() => convert(lead)}
                        >
                          {isQualifying
                            ? 'Qualifying…'
                            : 'Qualify'}
                        </button>

                        <button
                          type="button"
                          className="chip disqualify"
                          disabled={
                            isUnqualified ||
                            busy
                          }
                          onClick={() => handleDisqualify(lead)}
                        >
                          {isDisqualifying
                            ? 'Disqualifying…'
                            : 'Disqualify'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {rows.length === 0 && liveState === 'live' && (
            <p className="empty">
              {q.trim() || status !== 'All'
                ? 'No leads match your search or filter.'
                : 'No leads found.'}
            </p>
          )}
        </div>
      </div>

      {/* Existing Create Lead wizard — unchanged */}
      {showCreateLead && (
        <CreateLeadWizard
          onClose={() => setShowCreateLead(false)}
          onCreated={handleLeadCreated}
        />
      )}

      {/* Qualification wizard */}
      {selectedLead && (
        <QualifyLeadWizard
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onQualified={handleLeadQualified}
        />
      )}

      {/* Disqualification wizard */}
      {disqualifyingLead && (
        <DisqualifyLeadWizard
          lead={disqualifyingLead}
          onClose={() => setDisqualifyingLead(null)}
          onDisqualified={handleLeadDisqualified}
        />
      )}
    </>
  )
}
