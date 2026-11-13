import { useEffect, useMemo, useState } from 'react'
import { crmApi, salesAgentApi } from '../lib/api'
import { useApp } from '../lib/store'
import { useAuth } from '../auth'

const ACTIVITY_TAB_TYPES = {
  Activities: ['tasks', 'appointments', 'emails', 'phonecalls'],
  Timeline: ['tasks', 'appointments', 'emails', 'phonecalls'],
  Meetings: ['appointments'],
  Emails: ['emails'],
  Tasks: ['tasks'],
  Calls: ['phonecalls'],
}

const asRows = value => Array.isArray(value) ? value : (value?.value || value?.data || [])
const titleForType = type => ({
  tasks: 'Task',
  appointments: 'Meeting',
  emails: 'Email',
  phonecalls: 'Call',
}[type] || 'Activity')

export default function RecordRelatedTab({ entityType, recordId, tab }) {
  const { toast } = useApp()
  const { profile } = useAuth()
  const userEmail = profile?.mail || profile?.userPrincipalName || ''
  const [activities, setActivities] = useState({})
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const activityTypes = ACTIVITY_TAB_TYPES[tab]
  const isDocumentTab = ['Documents', 'Attachments', 'Proposal', 'Proposals'].includes(tab)

  useEffect(() => {
    let active = true
    if (!recordId || (!activityTypes && !isDocumentTab)) return undefined
    const load = () => {
      setLoading(true)
      setError('')
      const request = activityTypes
        ? crmApi.recordActivities(entityType, recordId).then(result => {
          if (active) setActivities(result || {})
        })
        : crmApi.recordDocuments(entityType, recordId).then(result => {
          if (active) setDocuments(asRows(result))
        })
      request.catch(reason => {
        if (active) setError(reason.message || `Unable to load ${tab.toLowerCase()}.`)
      }).finally(() => {
        if (active) setLoading(false)
      })
    }
    load()
    window.addEventListener('crm:assistant-data-changed', load)
    return () => {
      active = false
      window.removeEventListener('crm:assistant-data-changed', load)
    }
  }, [activityTypes, entityType, isDocumentTab, recordId, tab])

  const rows = useMemo(() => activityTypes
    ? activityTypes.flatMap(type => (activities[type] || []).map(row => ({ ...row, _activityType: type })))
      .sort((a, b) => String(b.createdon || b.scheduledstart || '').localeCompare(String(a.createdon || a.scheduledstart || '')))
    : [], [activities, activityTypes])
  const visibleDocuments = useMemo(() => {
    if (tab !== 'Proposal' && tab !== 'Proposals') return documents
    return documents.filter(doc => /^AI Proposal Draft/i.test(doc.subject || ''))
  }, [documents, tab])

  const download = async document => {
    try {
      await salesAgentApi.downloadDocument(
        document.annotationid,
        userEmail,
      )
    } catch (reason) {
      toast({ title: 'Unable to download document', text: reason.message })
    }
  }

  return <section className="card glass-record-card record-panel">
    <h3>{tab}</h3>
    {loading && <p className="record-empty">Loading related records from Dataverse…</p>}
    {error && <p className="record-empty" role="alert">{error}</p>}
    {!loading && !error && activityTypes && (rows.length
      ? <div className="record-related-list">{rows.map((row, index) => {
        const type = row._activityType
        const date = row.scheduledstart || row.createdon
        return <article className="record-related-item" key={row.activityid || `${type}-${index}`}>
          <div className="record-related-heading">
            <b>{row.subject || titleForType(type)}</b>
            <span>{titleForType(type)}</span>
          </div>
          {row.description && <p>{row.description}</p>}
          <small>{date ? new Date(date).toLocaleString() : 'Date not provided'}</small>
        </article>
      })}</div>
      : <p className="record-empty">No related {tab.toLowerCase()} are saved in Dataverse for this record.</p>)}
    {!loading && !error && isDocumentTab && (visibleDocuments.length
      ? <div className="record-related-list">{visibleDocuments.map((document, index) => <article className="record-related-item" key={document.annotationid || index}>
        <div className="record-related-heading">
          <b>{document.subject || document.filename || 'CRM document'}</b>
          <span>{document.filename || 'Document'}</span>
        </div>
        <small>{document.createdon ? new Date(document.createdon).toLocaleString() : ''}</small>
        {document.annotationid && <button className="chip" type="button" onClick={() => download(document)}>
          {String(document.filename || '').toLowerCase().endsWith('.docx')
            ? 'Download DOCX'
            : String(document.filename || '').toLowerCase().endsWith('.pdf')
              ? 'Download PDF'
              : 'Download'}
        </button>}
      </article>)}</div>
      : <p className="record-empty">No related documents are saved in Dataverse for this record.</p>)}
    {!recordId && <p className="record-empty">No CRM record is selected.</p>}
  </section>
}
