/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import { getBackendAccessToken } from '../auth'
import { crmApi, getApiBase } from '../lib/api'
import '../styles/conversation-insights.css'

const asArray = (value) => {
  if (Array.isArray(value)) return value
  const nested = value?.data ?? value?.items ?? value?.transcripts ?? value?.value
  if (Array.isArray(nested)) return nested
  return nested && nested !== value ? asArray(nested) : []
}
const listFields = [
  ['Customer needs', 'customer_needs'],
  ['Pain points', 'pain_points'],
  ['Objections', 'objections'],
  ['Commitments', 'commitments'],
  ['Next steps', 'next_steps'],
]
const displayValue = (value) => {
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export default function ConversationInsights() {
  const [tab, setTab] = useState('upload')
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [source, setSource] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [transcripts, setTranscripts] = useState([])
  const [selectedTranscript, setSelectedTranscript] = useState('')
  const [trackingCampaign, setTrackingCampaign] = useState('')
  const [trackingEvents, setTrackingEvents] = useState(null)

  const result = analysis?.analysis || analysis
  const apiBase = getApiBase()
  const sentiment = String(result?.sentiment || 'not assessed').toLowerCase()
  const transcriptOptions = useMemo(() => asArray(transcripts).map((item, index) => ({
    id: item.id || item.transcriptId || item.transcript_id || '',
    label: item.createdDateTime
      ? `${new Date(item.createdDateTime).toLocaleString()} · ${item.id || item.transcriptId || 'Transcript'}`
      : (item.id || item.transcriptId || `Transcript ${index + 1}`),
  })).filter(item => item.id), [transcripts])

  useEffect(() => {
    setError('')
  }, [tab])

  const analyzeFile = async (event) => {
    event.preventDefault()
    if (!file) {
      setError('Choose a transcript file first.')
      return
    }
    setBusy(true)
    setError('')
    setAnalysis(null)
    try {
      const response = await crmApi.analyzeTranscript(file)
      setAnalysis(response?.data || response)
      setSource(file.name)
    } catch (err) {
      setError(err?.message || 'Unable to analyze this transcript.')
    } finally {
      setBusy(false)
    }
  }

  const loadTeamsTranscripts = async (event) => {
    event.preventDefault()
    if (!organizerEmail.trim() || !meetingId.trim()) {
      setError('Enter the meeting organizer email and Teams online meeting ID.')
      return
    }
    setBusy(true)
    setError('')
    setAnalysis(null)
    setTranscripts([])
    setSelectedTranscript('')
    try {
      const response = await crmApi.teamsTranscript({
        organizer_email: organizerEmail.trim(),
        online_meeting_id: meetingId.trim(),
      })
      const rows = asArray(response?.data || response)
      setTranscripts(rows)
      if (!rows.length) setError(response?.message || 'No transcript metadata was returned for this meeting.')
    } catch (err) {
      setError(err?.message || 'Unable to retrieve Teams transcripts. Check Graph permissions and meeting details.')
    } finally {
      setBusy(false)
    }
  }

  const analyzeTeamsTranscript = async () => {
    if (!selectedTranscript) {
      setError('Select a transcript to analyze.')
      return
    }
    setBusy(true)
    setError('')
    setAnalysis(null)
    try {
      const response = await crmApi.teamsTranscript({
        organizer_email: organizerEmail.trim(),
        online_meeting_id: meetingId.trim(),
        transcript_id: selectedTranscript,
      })
      setAnalysis(response?.data || response)
      setSource(`Microsoft Teams · ${selectedTranscript}`)
    } catch (err) {
      setError(err?.message || 'Unable to analyze the selected Teams transcript.')
    } finally {
      setBusy(false)
    }
  }

  const loadTrackingEvents = async (event) => {
    event.preventDefault()
    if (!trackingCampaign.trim()) {
      setError('Enter a campaign ID to retrieve tracked email events.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${apiBase}/conversation-intelligence/tracking/events?campaign_id=${encodeURIComponent(trackingCampaign.trim())}`, {
        headers: { Authorization: `Bearer ${await getBackendAccessToken()}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || `Unable to retrieve tracking events (${response.status}).`)
      setTrackingEvents(data)
    } catch (err) {
      setError(err?.message || 'Unable to retrieve email tracking events.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="conversation-insights-page">
      <PageHead
        title="Conversation Insights"
        sub="Analyze sales conversations, surface customer signals and turn commitments into next steps."
      >
        <button type="button" className="chip" onClick={() => { setAnalysis(null); setError(''); setFile(null); setTranscripts([]); setTrackingEvents(null) }}>
          <Icon name="sync" size={15} /> Clear
        </button>
      </PageHead>

      <nav className="ci-tabs" aria-label="Conversation insight sources">
        <button className={tab === 'upload' ? 'active' : ''} onClick={() => setTab('upload')} type="button"><Icon name="clip" size={15}/> Upload transcript</button>
        <button className={tab === 'teams' ? 'active' : ''} onClick={() => setTab('teams')} type="button"><Icon name="video" size={15}/> Microsoft Teams</button>
        <button className={tab === 'tracking' ? 'active' : ''} onClick={() => setTab('tracking')} type="button"><Icon name="mail" size={15}/> Email engagement</button>
      </nav>

      <section className="ci-source-card glass-record-card">
        {tab === 'upload' && (
          <form className="ci-upload-form" onSubmit={analyzeFile}>
            <div className="ci-source-copy">
              <span className="ci-eyebrow">TRANSCRIPT ANALYSIS</span>
              <h2>Upload a sales conversation</h2>
              <p>Upload a transcript and the AI service will extract a summary, customer needs, objections, commitments, next steps and reviewable lead or opportunity details.</p>
              <small>Supported by the connected backend: PDF, DOCX and TXT · Maximum 5 MB</small>
            </div>
            <label className="ci-file-picker">
              <Icon name="doc" size={25}/>
              <strong>{file?.name || 'Choose transcript file'}</strong>
              <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Select PDF, DOCX or TXT'}</span>
              <input type="file" accept=".pdf,.docx,.txt,.vtt" onChange={(event) => { setFile(event.target.files?.[0] || null); setError('') }}/>
            </label>
            <button className="cta" type="submit" disabled={!file || busy}><Icon name="sparkle" size={15}/>{busy ? 'Analyzing…' : 'Analyze transcript'}</button>
          </form>
        )}

        {tab === 'teams' && (
          <form className="ci-teams-form" onSubmit={loadTeamsTranscripts}>
            <div className="ci-source-copy">
              <span className="ci-eyebrow">MICROSOFT GRAPH</span>
              <h2>Analyze a Teams meeting</h2>
              <p>Retrieve available meeting transcripts using the backend's Microsoft Graph integration. This is ready to use when the required Graph transcript permissions are granted.</p>
            </div>
            <div className="ci-form-grid">
              <label>Organizer email<input type="email" required value={organizerEmail} onChange={e => setOrganizerEmail(e.target.value)} placeholder="organizer@company.com"/></label>
              <label>Online meeting ID<input required value={meetingId} onChange={e => setMeetingId(e.target.value)} placeholder="Paste the Teams online meeting ID"/></label>
            </div>
            <button className="cta" type="submit" disabled={busy}><Icon name="search" size={15}/>{busy ? 'Checking…' : 'Find transcripts'}</button>
            {!!transcriptOptions.length && (
              <div className="ci-transcript-select">
                <label>Available transcripts<select value={selectedTranscript} onChange={e => setSelectedTranscript(e.target.value)}><option value="">Select a transcript</option>{transcriptOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                <button className="cta" type="button" disabled={!selectedTranscript || busy} onClick={analyzeTeamsTranscript}><Icon name="sparkle" size={15}/>{busy ? 'Analyzing…' : 'Analyze selected transcript'}</button>
              </div>
            )}
          </form>
        )}

        {tab === 'tracking' && (
          <form className="ci-teams-form" onSubmit={loadTrackingEvents}>
            <div className="ci-source-copy">
              <span className="ci-eyebrow">EMAIL ENGAGEMENT</span>
              <h2>Review tracked email activity</h2>
              <p>View open and click events recorded by the backend for a campaign. Email opens are approximate and may be suppressed by privacy features or image proxies.</p>
            </div>
            <div className="ci-form-grid single">
              <label>Campaign ID<input value={trackingCampaign} onChange={e => setTrackingCampaign(e.target.value)} placeholder="Enter campaign ID"/></label>
            </div>
            <button className="cta" type="submit" disabled={busy}><Icon name="chart" size={15}/>{busy ? 'Loading…' : 'Load engagement events'}</button>
            {trackingEvents && <div className="ci-tracking-result"><strong>{trackingEvents.count ?? trackingEvents.events?.length ?? 0} events</strong><span>{trackingEvents.open_tracking_note}</span>{(trackingEvents.events || []).map((event, i) => <div className="ci-event-row" key={`${event.occurred_at}-${i}`}><b>{event.event_type}</b><time>{event.occurred_at ? new Date(event.occurred_at).toLocaleString() : '—'}</time></div>)}</div>}
          </form>
        )}
      </section>

      {error && <div className="ci-error" role="alert"><Icon name="help" size={17}/>{error}</div>}
      {busy && <p className="ci-status" role="status">Processing with the connected CRM backend…</p>}

      {result && (
        <section className="ci-results">
          <div className="ci-results-heading">
            <div><span className="ci-eyebrow">AI ANALYSIS · REVIEW REQUIRED</span><h2>Conversation analysis</h2><p>{source || analysis?.source_document || 'Connected transcript'}</p></div>
            <span className={`ci-sentiment ${sentiment}`}>{sentiment} sentiment</span>
          </div>
          <article className="ci-summary glass-record-card"><h3>Call summary</h3><p>{displayValue(result.summary)}</p></article>
          {!!result.participants?.length && <article className="ci-insight-card glass-record-card"><h3>Participants</h3><ul>{result.participants.map((item, i) => <li key={i}>{displayValue(item)}</li>)}</ul></article>}
          <div className="ci-insight-grid">
            {listFields.map(([title, key]) => <article className="ci-insight-card glass-record-card" key={key}><h3>{title}</h3>{Array.isArray(result[key]) && result[key].length ? <ul>{result[key].map((item, i) => <li key={`${key}-${i}`}>{displayValue(item)}</li>)}</ul> : <p className="ci-empty">No {title.toLowerCase()} extracted.</p>}</article>)}
          </div>
          <div className="ci-entity-grid">
            <article className="ci-insight-card glass-record-card"><h3>Lead details extracted</h3><dl>{Object.entries(result.lead || {}).filter(([,v]) => v != null && v !== '').map(([key,value]) => <div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{displayValue(value)}</dd></div>)}</dl>{!Object.values(result.lead || {}).some(v => v != null && v !== '') && <p className="ci-empty">No lead fields were explicitly identified.</p>}</article>
            <article className="ci-insight-card glass-record-card"><h3>Opportunity details extracted</h3><dl>{Object.entries(result.opportunity || {}).filter(([,v]) => v != null && v !== '').map(([key,value]) => <div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{displayValue(value)}</dd></div>)}</dl>{!Object.values(result.opportunity || {}).some(v => v != null && v !== '') && <p className="ci-empty">No opportunity fields were explicitly identified.</p>}</article>
          </div>
          {!!result.missing_fields?.length && <article className="ci-insight-card glass-record-card"><h3>Information still needed</h3><ul>{result.missing_fields.map((item,i)=><li key={i}>{displayValue(item)}</li>)}</ul></article>}
          {!!result.evidence?.length && <article className="ci-insight-card glass-record-card"><h3>Supporting transcript evidence</h3><div className="ci-evidence-list">{result.evidence.map((item,i)=><blockquote key={i}><b>{item.field || 'Extracted detail'}</b><p>“{item.quote || displayValue(item)}”</p></blockquote>)}</div></article>}
          <p className="ci-review-note"><Icon name="help" size={15}/> Extracted information is a draft for review. No lead or opportunity record is created automatically.</p>
        </section>
      )}
    </div>
  )
}
