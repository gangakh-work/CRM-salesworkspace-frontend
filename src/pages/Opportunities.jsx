/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'
import { crmApi } from '../lib/api'
import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import { money } from '../lib/format'
import { useApp } from '../lib/store'
import CreateOpportunityModal from '../components/CreateOpportunityModal'

const downloadOpportunityTemplate = () => {
  const headers = ['Opportunity Name', 'Customer', 'Expected Revenue', 'Expected Close Date', 'Owner', 'Description', 'Stage']
  const sample = ['Example opportunity', 'Example customer', '250000', '2026-12-31', '', 'Opportunity description', 'Prospect']
  const csv = [headers, sample].map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'opportunities-template.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const opportunityInitials = (name = '') => {
  const words = String(name).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'OP'
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : `${words[0][0]}${words[1][0]}`.toUpperCase()
}
import '../styles/opportunities-ui-fixes.css'

const PROB = {
  new: 0.1,
  qualified: 0.25,
  proposal: 0.5,
  negotiation: 0.75,
  won: 1,
}

const stageMap = (raw) => {
  const value = String(raw ?? '').toLowerCase()

  if (value.includes('won')) return 'won'
  if (value.includes('lost') || value.includes('closed lost')) return 'lost'

  if (
    value.includes('negotiat') ||
    value.includes('close')
  ) {
    return 'negotiation'
  }

  if (value.includes('proposal')) return 'proposal'
  if (value.includes('qualif')) return 'qualified'

  return 'new'
}

const normalizeOpportunity = (row) => ({
  id: row.opportunityid ?? row.id,

  name:
    row.name ??
    row.topic ??
    row.opportunityname ??
    'Unnamed opportunity',

  company:
    row.company ??
    row.customer ??
    row.customerid_name ??
    row.account_name ??
    row.parentaccountid_name ??
    '—',

  value:
    Number(
      row.value ??
      row.estimatedvalue ??
      row.expectedrevenue ??
      row.estimated_value ??
      0
    ) || 0,

  stage: stageMap(
    row.stage ??
    row.stepname ??
    row.statuscode_label ??
    row.status ??
    row.salesstage ??
    row.statecode_label
  ),

  owner:
    row.owner ??
    row.owner_name ??
    row.ownerid_name ??
    'Unassigned',

  close:
    row.close ??
    row.estimatedclosedate ??
    row.closeDate ??
    '—',

  moved: false,
})

const getOpportunityRows = (result) => {
  if (Array.isArray(result)) return result

  const rows =
    result?.data ??
    result?.opportunities ??
    result?.value ??
    result?.results ??
    []

  if (Array.isArray(rows)) return rows

  throw new Error(
    'Unexpected CRM opportunities response.'
  )
}

export default function Opportunities() {
  const { toast, go, setRecordDetail } = useApp()

  const [deals, setDeals] = useState([])
  const [liveState, setLiveState] = useState('loading')
  const [error, setError] = useState('')

  const [selectedWonOpportunity, setSelectedWonOpportunity] =
    useState(null)

  const [selectedLostOpportunity, setSelectedLostOpportunity] =
    useState(null)


  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false)

  const openDetail=async(deal)=>{setRecordDetail({id:deal.id,summary:deal});go('opportunity-detail')}

  // Won confirmation
  const handleOpportunityWon = (deal) => {
    setSelectedWonOpportunity(deal)
  }

  // Lost confirmation
  const handleOpportunityLost = (deal) => {
    setSelectedLostOpportunity(deal)
  }

  // Close confirmation
  const closeOpportunityAction = () => {
    setSelectedWonOpportunity(null)
    setSelectedLostOpportunity(null)
  }

  // Load opportunities from existing CRM API.
  const loadOpportunities = useCallback(async () => {
    setLiveState('loading')
    setError('')

    try {
      const result = await crmApi.opportunities()
      const rows = getOpportunityRows(result)

      setDeals(rows.filter((row) => row.opportunityid || row.id).map(normalizeOpportunity))
      setLiveState('live')
    } catch (err) {
      setLiveState('error')

      setError(
        err?.message ||
        'Unable to load opportunities from CRM.'
      )
    }
  }, [])

  useEffect(() => {
    loadOpportunities()
  }, [loadOpportunities])

  // Pipeline totals.
  const open = deals.filter(
    (deal) => !['won','lost'].includes(deal.stage)
  )

  const total = open.reduce(
    (sum, deal) => sum + deal.value,
    0
  )

  const forecast = open.reduce(
    (sum, deal) =>
      sum + deal.value * (PROB[deal.stage] ?? 0),
    0
  )

  const won = deals
    .filter((deal) => deal.stage === 'won')
    .reduce(
      (sum, deal) => sum + deal.value,
      0
    )

  // Existing Create Opportunity callback.
  const handleOpportunityCreated = async () => {
    setShowCreateOpportunity(false)

    toast({
      icon: 'check',
      title: 'Opportunity created',
      text: 'Refreshing opportunities from CRM.',
    })

    await loadOpportunities()
  }

  return (
    <div className="opportunities-workspace">
      <PageHead
        title="Opportunities"
        sub="Your sales opportunities, values and expected close dates in one place"
      >
        <button type="button" className="chip opportunity-template-btn" onClick={downloadOpportunityTemplate}>
          <Icon name="download" size={15} /> Download template
        </button>
        <button
          type="button"
          className="cta"
          onClick={() => setShowCreateOpportunity(true)}
        >
          <Icon name="plus" />
          New Opportunity
        </button>
      </PageHead>

      {/* Loading only when initial data is actually loading */}
      {liveState === 'loading' && deals.length === 0 && (
        <p className="opportunities-loading" role="status">
          Loading opportunities from CRM…
        </p>
      )}

      {/* Existing error handling */}
      {liveState === 'error' && (
        <div className="opportunities-error" role="alert">
          <p>
            {error ||
              'Unable to load opportunities from CRM.'}
          </p>

          <button
            type="button"
            className="chip"
            onClick={loadOpportunities}
          >
            Retry
          </button>
        </div>
      )}

      {/* Pipeline summary */}
      <div className="pipe-sum rise" style={{ '--d': 1 }}>
        <div>
          <small>Open pipeline</small>
          <strong className="figure">
            {money(total)}
          </strong>
        </div>

        <div>
          <small>Weighted forecast</small>
          <strong className="figure">
            {money(forecast)}
          </strong>
        </div>

        <div>
          <small>Won this month</small>
          <strong className="figure">
            {money(won)}
          </strong>
        </div>

        <div className="opportunity-total-track" aria-hidden="true"><i style={{width: `${deals.length ? Math.max(4, won/deals.reduce((sum,d)=>sum+d.value,0)*100) : 0}%`}}/></div>
      </div>

      {/* Opportunity list: no stage lanes or stage labels */}
      <section className="card opportunity-list-card">
        <header className="opportunity-list-heading"><div><h2>All opportunities</h2><p>{deals.length} records from connected CRM</p></div><button type="button" className="chip" onClick={loadOpportunities}><Icon name="refresh" size={14}/> Refresh</button></header>
        {deals.length===0&&liveState==='live'&&<p className="record-empty">No opportunities returned by Dataverse.</p>}
        <div className="opportunity-list">
          {deals.map(deal=><article className="opportunity-list-row" key={deal.id}>
            <button className="opportunity-list-main" type="button" onClick={()=>openDetail(deal)}>
              <span className="opportunity-list-icon" aria-hidden="true">{opportunityInitials(deal.name)}</span>
              <span className="opportunity-list-name"><b>{deal.name}</b><small>{deal.company}</small></span>
            </button>
            <div className="opportunity-list-value"><small>Expected value</small><b>{money(deal.value)}</b></div>
            <div className="opportunity-list-meta"><small>Expected close</small><b>{deal.close&&deal.close!=='—'?new Date(deal.close).toLocaleDateString():'—'}</b></div>
            <div className="opportunity-list-meta"><small>Owner</small><b>{deal.owner||'Unassigned'}</b></div>
            <div className="opportunity-list-actions">
              <button type="button" className="opportunity-won-btn" onClick={()=>handleOpportunityWon(deal)}>Won</button>
              <button type="button" className="opportunity-lost-btn" onClick={()=>handleOpportunityLost(deal)}>Lost</button>
              <button type="button" className="opportunity-next-btn" aria-label={`Open ${deal.name}`} onClick={()=>openDetail(deal)}><Icon name="arrowRight" size={14}/></button>
            </div>
          </article>)}
        </div>
      </section>

      {/* Existing Create Opportunity modal */}
      {showCreateOpportunity && (
        <CreateOpportunityModal
          onClose={() =>
            setShowCreateOpportunity(false)
          }
          onCreated={handleOpportunityCreated}
        />
      )}

      {/* Won confirmation modal */}
      {selectedWonOpportunity && (
        <OpportunityActionModal
          deal={selectedWonOpportunity}
          action="won"
          onClose={closeOpportunityAction}
          onConfirm={async (payload) => { await crmApi.winOpportunity(selectedWonOpportunity.id, payload); closeOpportunityAction(); await loadOpportunities() }}
        />
      )}

      {/* Lost confirmation modal */}
      {selectedLostOpportunity && (
        <OpportunityActionModal
          deal={selectedLostOpportunity}
          action="lost"
          onClose={closeOpportunityAction}
          onConfirm={async (payload) => { await crmApi.loseOpportunity(selectedLostOpportunity.id, payload); closeOpportunityAction(); await loadOpportunities() }}
        />
      )}
    </div>
  )
}

/* Won/Lost confirmation modal */
function OpportunityActionModal({ deal, action, onClose, onConfirm }) {
  const [revenue, setRevenue] = useState(String(deal?.value || ''))
  const [reason, setReason] = useState('other')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  if (!deal || !action) return null

  const isWon = action === 'won'

  const title = isWon
    ? 'Mark Opportunity as Won'
    : 'Mark Opportunity as Lost'

  const status = isWon ? 'Won' : 'Lost'

  return (
    <div
      className="opportunity-action-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="opportunity-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="opportunity-action-title"
      >
        <header>
          <h2 id="opportunity-action-title">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="opportunity-action-content">
          <p>
            Are you sure you want to mark this
            opportunity as {status}?
          </p>

          <strong>{deal.name}</strong>

          <span>{deal.company}</span>

          <strong>{money(deal.value)}</strong>
          {isWon ? <label className="opportunity-field"><span>Final revenue</span><input type="number" min="1" value={revenue} onChange={e=>setRevenue(e.target.value)}/></label> : <label className="opportunity-field"><span>Loss reason</span><select value={reason} onChange={e=>setReason(e.target.value)}>{['price_too_high','lost_to_competitor','budget_cancelled','project_cancelled','no_decision','not_interested','technical_mismatch','timeline_changed','internal_decision','other'].map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select></label>}
          <label className="opportunity-field"><span>Notes (optional)</span><textarea rows="3" value={description} onChange={e=>setDescription(e.target.value)}/></label>
          {error && <p role="alert" className="opportunity-error">{error}</p>}

          <p>
            {isWon ? 'Confirm final revenue and close date.' : 'Select a loss reason and add any useful context.'}
          </p>
        </div>

        <footer>
          <button
            type="button"
            className="opportunity-action-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              isWon
                ? 'opportunity-action-confirm won'
                : 'opportunity-action-confirm lost'
            }
            disabled={saving || (isWon && !(Number(revenue)>0))}
            onClick={async () => { setSaving(true); setError(''); try { await onConfirm?.(isWon ? { final_revenue: Number(revenue), actual_end: new Date().toISOString().slice(0,10), description } : { reason, actual_end: new Date().toISOString().slice(0,10), description }); } catch(e) { setError(e.message || 'Unable to close opportunity in Dataverse.') } finally { setSaving(false) } }}
          >
            {saving ? 'Saving…' : `Confirm ${status}`}
          </button>
        </footer>
      </section>
    </div>
  )
}
