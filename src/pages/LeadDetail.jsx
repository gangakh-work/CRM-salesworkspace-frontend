/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { crmApi } from '../lib/api'
import { PageHead } from '../components/ui'
import Icon from '../components/Icon'
import QualifyLeadWizard from '../components/QualifyLeadWizard'
import DisqualifyLeadWizard from '../components/DisqualifyLeadWizard'
import RecordRelatedTab from '../components/RecordRelatedTab'
import { money } from '../lib/format'


function normalizeDataverseRecord(input = {}) {
  const record = { ...input }
  for (const [key, value] of Object.entries(input)) {
    if (!key.includes('@')) continue
    const base = key.split('@')[0]
    if (key.includes('FormattedValue')) {
      const lookup = base.match(/^_(.+)_value$/)
      record[lookup ? `${lookup[1]}_name` : `${base}_label`] = value
    }
  }
  const aliases = {
    companyname: ['companyname', 'companyname_label', 'parentaccountid_name', '_parentaccountid_value_name'],
    ownerid_name: ['ownerid_name', 'ownerid_label', '_ownerid_value_name', 'owner_name'],
    industrycode_label: ['industrycode_label', 'industrycode', 'industrycode_label'],
    leadsourcecode_label: ['leadsourcecode_label', 'leadsourcecode', 'leadsourcecode_label'],
    estimatedvalue: ['estimatedvalue', 'estimatedamount', 'estimatedamount_base'],
  }
  for (const [target, keys] of Object.entries(aliases)) {
    if (record[target] == null || record[target] === '') {
      const found = keys.find(key => record[key] != null && record[key] !== '')
      if (found) record[target] = record[found]
    }
  }
  return record
}

const isDataverseGuid = value => typeof value === 'string' && /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i.test(value.trim())

export default function LeadDetail() {
  const { go, recordDetail, toast } = useApp()
  const lead = normalizeDataverseRecord(recordDetail?.record || recordDetail?.summary || {})
  const id = recordDetail?.id || lead.leadid || lead.id
  const [record,setRecord] = useState(lead)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [qualify,setQualify] = useState(false)
  const [disqualify,setDisqualify] = useState(false)
  const [tab,setTab]=useState('Overview')
  const [notes,setNotes]=useState([]),[noteSubject,setNoteSubject]=useState(''),[noteContent,setNoteContent]=useState(''),[noteBusy,setNoteBusy]=useState(false)
  useEffect(() => { let alive=true; if(!id){setLoading(false);setError('No lead selected. Return to Leads and open a record.');return}
    crmApi.lead(id).then(r=>{if(alive)setRecord(normalizeDataverseRecord(r?.data||r))}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)})
    return ()=>{alive=false}
  },[id])
  const name=record.fullname||[record.firstname,record.lastname].filter(Boolean).join(' ')||record.subject||record.name||'Lead details'
  const status=record.statuscode_label||record.status_label||record.status||'—'
  const crmId=[record.leadid,recordDetail?.record?.leadid,recordDetail?.summary?.leadid,recordDetail?.id,record.id].find(isDataverseGuid)?.replace(/^\{|\}$/g,'')||''
  const tabs=['Overview','Timeline','Activities','Meetings','Emails','Calls','Notes','Tasks','Attachments','Opportunities','Proposals']
  const liveTabs=['Timeline','Activities','Meetings','Emails','Calls','Tasks','Attachments','Proposals']
  useEffect(()=>{if(tab==='Notes'&&id){crmApi.leadNotes(id).then(r=>setNotes(Array.isArray(r)?r:(r?.items||r?.data||r?.notes||[]))).catch(e=>toast({title:'Unable to load lead notes',text:e.message}))}},[tab,id,toast])
  const dateValue = value => value ? new Date(value).toLocaleString() : '—'
  const copyCrmId=async()=>{try{await navigator.clipboard.writeText(crmId);toast({icon:'check',title:'CRM ID copied',text:'Dataverse lead ID copied to clipboard.'})}catch{toast({title:'Copy unavailable',text:'Select the CRM ID and copy it.'})}}
  const summaryRows=[['CRM ID',crmId||'—'],['Status',status],['Company',record.companyname||record.companyname_label||record.parentaccountid_name],['Email',record.emailaddress1],['Phone',record.telephone1],['Job title',record.jobtitle],['Industry',record.industrycode_label||record.industry],['Source',record.leadsourcecode_label||record.leadsourcecode],['Owner',record.ownerid_name||record.owner_name||record._ownerid_value_name],['Created',dateValue(record.createdon)],['Last activity',dateValue(record.modifiedon)]]
  return <>
    <PageHead title={name} sub={`Lead 360° · ${record.companyname||record.parentaccountid_name||'Dataverse lead'}`}>
      <button className="chip" onClick={()=>go('leads')}><Icon name="arrowLeft" size={14}/> Back to Leads</button>
      <button className="cta" onClick={()=>setQualify(true)}><Icon name="check" size={15}/> Qualify</button>
      <button className="chip" onClick={()=>setDisqualify(true)}>Disqualify</button>
    </PageHead>
    {loading&&<p className="empty">Loading lead from Dataverse…</p>}
    {error&&<div className="empty" role="alert">{error}</div>}
    <nav className="record-tabs">{tabs.map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav>
    {tab==='Overview'&&<div className="lead-detail-layout">
      <section className="card glass-record-card lead-profile-card">
        <div className="lead-avatar">{String(name).split(/\\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div>
        <h2>{name}</h2><p>{record.jobtitle||'Lead'} · {record.companyname||record.parentaccountid_name||'Company not specified'}</p>
        <div className="lead-profile-badges"><span>{status}</span><span>{record.prioritycode_label||record.priority||'Priority not set'}</span></div>
        <div className="lead-profile-contact">{[['Email',record.emailaddress1],['Phone',record.telephone1],['Owner',record.ownerid_name||record.owner_name||record._ownerid_value_name],['Source',record.leadsourcecode_label||record.leadsourcecode]].map(([k,v])=><div key={k}><small>{k}</small><b>{v||'—'}</b></div>)}</div>
      </section>
      <div className="lead-detail-main">
        <div className="stats lead-detail-stats">{[['Expected Revenue',money(record.estimatedvalue||record.estimatedamount||0)],['Lead Score',record.leadscore??record.score??'—'],['Created',record.createdon?new Date(record.createdon).toLocaleDateString():'—']].map(([k,v])=><article className="card stat glass-record-card" key={k}><small>{k}</small><strong className="figure">{v}</strong></article>)}</div>
        <section className="card glass-record-card record-panel"><h3>Lead Summary</h3><div className="record-fields">{summaryRows.map(([k,v])=><div className="record-row" key={k}><span>{k}</span><b className={k==='CRM ID'?'record-id-value':undefined}>{k==='CRM ID'?<><code>{v}</code>{crmId&&<button type="button" className="chip" onClick={copyCrmId}>Copy</button>}</>:(v??'—')}</b></div>)}</div></section>
      </div>
    </div>}
    {tab==='Notes'&&<section className="lead-notes-layout"><form className="card glass-record-card lead-note-compose" onSubmit={async e=>{e.preventDefault();if(!noteContent.trim())return;setNoteBusy(true);try{await crmApi.createLeadNote(id,{subject:noteSubject.trim()||'Note',content:noteContent.trim()});setNoteSubject('');setNoteContent('');const result=await crmApi.leadNotes(id);setNotes(Array.isArray(result)?result:(result?.items||result?.data||result?.notes||[]));toast({icon:'check',title:'Note added',text:'Saved to Dataverse.'})}catch(err){toast({title:'Unable to add note',text:err.message})}finally{setNoteBusy(false)}}}><h3>Add a note</h3><label>Subject<input value={noteSubject} onChange={e=>setNoteSubject(e.target.value)} placeholder="Note title"/></label><label>Note<textarea rows={5} required value={noteContent} onChange={e=>setNoteContent(e.target.value)} placeholder="Add customer updates, decisions or next steps…"/></label><button className="cta" disabled={noteBusy||!noteContent.trim()}>{noteBusy?'Saving…':'Save note'}</button></form><section className="card glass-record-card lead-note-list"><h3>Notes ({notes.length})</h3>{notes.length?notes.map((n,i)=><article className="opportunity-note" key={n.annotationid||n.id||i}><b>{n.subject||'Note'}</b><p>{n.notetext||n.content||'—'}</p><small>{n.createdon?new Date(n.createdon).toLocaleString():''}</small></article>):<p className="record-empty">No notes have been added to this lead yet. Add a note to get started.</p>}</section></section>}
    {liveTabs.includes(tab)&&<RecordRelatedTab entityType="lead" recordId={crmId} tab={tab}/>}
    {tab!=='Overview'&&tab!=='Notes'&&!liveTabs.includes(tab)&&<section className="card glass-record-card record-panel"><h3>{tab}</h3><p className="record-empty">{tab} will appear here when the related Dataverse or Microsoft 365 source is available. No placeholder records are shown.</p></section>}
    {qualify&&<QualifyLeadWizard lead={{id,name}} onClose={()=>setQualify(false)} onQualified={()=>{setQualify(false);crmApi.lead(id).then(r=>setRecord(r?.data||r)).catch(e=>toast({title:'Refresh failed',text:e.message}))}}/>}
    {disqualify&&<DisqualifyLeadWizard lead={{id,name}} onClose={()=>setDisqualify(false)} onDisqualified={()=>{setDisqualify(false);crmApi.lead(id).then(r=>setRecord(r?.data||r)).catch(()=>{})}}/>}
  </>
}
