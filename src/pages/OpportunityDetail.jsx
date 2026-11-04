/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../lib/store'
import { crmApi } from '../lib/api'
import { PageHead } from '../components/ui'
import Icon from '../components/Icon'
import { money } from '../lib/format'
import { STAGES } from '../data/seed'

const normalizeOpportunity = input => {
 const r={...input}
 for(const [key,value] of Object.entries(input||{})){
  if(!key.includes('@'))continue
  const base=key.split('@')[0]
  if(key.includes('FormattedValue')){
   const lookup=base.match(/^_(.+)_value$/)
   r[lookup?`${lookup[1]}_name`:`${base}_label`]=value
  }
 }
 const set=(target,...keys)=>{if(r[target]==null||r[target]===''){const k=keys.find(x=>r[x]!=null&&r[x]!=='');if(k)r[target]=r[k]}}
 set('name','name','topic','opportunityname')
 set('customerid_name','customerid_name','customerid_label','_customerid_value_name','parentaccountid_name','parentaccountid_label','_parentaccountid_value_name')
 set('ownerid_name','ownerid_name','ownerid_label','_ownerid_value_name','owner_name')
 set('territoryid_name','territoryid_name','territoryid_label','_territoryid_value_name','region')
 set('industrycode_label','industrycode_label','industrycode','industry')
 set('forecastcategory_label','forecastcategory_label','forecastcategory')
 set('estimatedvalue','estimatedvalue','expectedrevenue','estimatedvalue_base')
 return r
}
const rowsFor = r => [
  ['Customer',r.customerid_name||r.parentaccountid_name||r.company],
  ['Owner',r.ownerid_name||r.owner_name],
  ['Region',r.territoryid_name||r.region],
  ['Industry',r.industrycode_label||r.industry],
  ['Expected close date',r.estimatedclosedate ? new Date(r.estimatedclosedate).toLocaleDateString() : (r.estimatedclosedate_label||'—')],
  ['Forecast',r.forecastcategory_label||r.forecastcategory],
  ['Description',r.description],
]
const unwrap = r => Array.isArray(r) ? r : (r?.items||r?.data||r?.value||r?.notes||[])
export default function OpportunityDetail(){
 const {go,recordDetail,toast}=useApp()
 const initial=normalizeOpportunity(recordDetail?.record||recordDetail?.summary||{})
 const id=recordDetail?.id||initial.opportunityid||initial.id
 const [record,setRecord]=useState(initial),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const [action,setAction]=useState(''),[reason,setReason]=useState(''),[revenue,setRevenue]=useState(String(initial.estimatedvalue||initial.value||''))
 const [saving,setSaving]=useState(false),[tab,setTab]=useState('Overview')
 const [notes,setNotes]=useState([]),[noteSubject,setNoteSubject]=useState(''),[noteContent,setNoteContent]=useState(''),[noteBusy,setNoteBusy]=useState(false)
 const refresh=async()=>{const r=await crmApi.opportunity(id);const x=normalizeOpportunity(r?.data||r);setRecord(x);setRevenue(String(x.estimatedvalue||x.expectedrevenue||''))}
 const loadNotes=useCallback(async()=>{try{const r=await crmApi.opportunityNotes(id);setNotes(unwrap(r))}catch(e){setNotes([]);toast({title:'Unable to load opportunity notes',text:e.message})}},[id,toast])
 useEffect(()=>{let live=true;if(!id){setError('No opportunity selected. Return to Opportunities and open a record.');setLoading(false);return}
 crmApi.opportunity(id).then(r=>{if(live){const x=normalizeOpportunity(r?.data||r);setRecord(x);setRevenue(String(x.estimatedvalue||x.expectedrevenue||''))}}).catch(e=>live&&setError(e.message)).finally(()=>live&&setLoading(false))
 return()=>{live=false}},[id])
 useEffect(()=>{if(id)loadNotes()},[id,loadNotes])
 const name=record.name||record.topic||record.opportunityname||'Opportunity details'
 const status=record.statuscode_label||record.status_label||record.stepname||record.salesstage||'—'
 const closeDeal=async()=>{setSaving(true);try{if(action==='won')await crmApi.winOpportunity(id,{final_revenue:Number(revenue||0),actual_end:new Date().toISOString().slice(0,10),description:reason});else await crmApi.loseOpportunity(id,{reason:reason||'other',actual_end:new Date().toISOString().slice(0,10),description:reason});await refresh();setAction('');toast({icon:'check',title:action==='won'?'Opportunity marked Won':'Opportunity marked Lost',text:name})}catch(e){toast({title:'Unable to update opportunity',text:e.message})}finally{setSaving(false)}}
 const changeStage=async value=>{if(!value)return;setSaving(true);try{await crmApi.updateOpportunity(id,{stepname:value});setRecord(r=>({...r,stepname:value}));toast({icon:'check',title:'Stage updated',text:value})}catch(e){toast({title:'Stage update failed',text:e.message})}finally{setSaving(false)}}
 const addNote=async e=>{e.preventDefault();if(!noteContent.trim())return;setNoteBusy(true);try{await crmApi.createOpportunityNote(id,{subject:noteSubject.trim()||'Note',content:noteContent.trim()});setNoteSubject('');setNoteContent('');await loadNotes();toast({icon:'check',title:'Note added',text:'Saved to the opportunity in Dataverse.'})}catch(e){toast({title:'Unable to add note',text:e.message})}finally{setNoteBusy(false)}}
 const tabs=['Overview','Stage History','Contacts','Timeline','Activities','Meetings','Emails','Documents','Notes','Commercials','Proposal','Forecast','AI Insights']
 return <><PageHead title={name} sub={`Opportunity 360° · ${record.customerid_name||record.parentaccountid_name||record.company||'Dataverse opportunity'}`}>
 <button className="chip" onClick={()=>go('opportunities')}><Icon name="arrowLeft" size={14}/> Back to Opportunities</button>
 <label className="stage-action"><span>Update stage</span><select aria-label="Update opportunity stage" value={record.stepname||''} disabled={saving} onChange={e=>changeStage(e.target.value)}><option value="">Select stage</option>{STAGES.filter(x=>!['won','lost'].includes(x.id)).map(stage=><option key={stage.id} value={stage.label}>{stage.label}</option>)}</select></label>
 <button className="cta" onClick={()=>setAction('won')}><Icon name="check" size={14}/> Mark Won</button><button className="chip" onClick={()=>setAction('lost')}>Mark Lost</button></PageHead>
 {loading&&<p className="empty">Loading opportunity from Dataverse…</p>}{error&&<div className="empty" role="alert">{error}</div>}
 <nav className="record-tabs">{tabs.map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</nav>
 {tab==='Overview'&&<div className="opportunity-detail-layout">
   <section className="card glass-record-card opportunity-profile"><div className="opportunity-profile-icon"><Icon name="briefcase" size={25}/></div><h2>{name}</h2><p>{record.customerid_name||record.parentaccountid_name||record.company||'Customer not specified'}</p><div className="lead-profile-badges"><span>{status}</span><span>{record.forecastcategory_label||'Pipeline'}</span></div><div className="opportunity-profile-value"><small>Expected revenue</small><strong>{money(record.estimatedvalue||record.expectedrevenue||record.estimatedvalue_base||0)}</strong></div></section>
   <div className="opportunity-detail-main"><div className="stats lead-detail-stats">{[['Expected Revenue',money(record.estimatedvalue||record.expectedrevenue||record.estimatedvalue_base||0)],['Win Probability',record.closeprobability!=null?`${record.closeprobability}%`:'—'],['Close Date',record.estimatedclosedate?new Date(record.estimatedclosedate).toLocaleDateString():'—']].map(([k,v])=><article className="card stat glass-record-card" key={k}><small>{k}</small><strong className="figure">{v}</strong></article>)}</div>
   <section className="card glass-record-card record-panel"><h3>Deal Summary</h3><div className="record-fields">{rowsFor(record).map(([k,v])=><div className="record-row" key={k}><span>{k}</span><b>{v??'—'}</b></div>)}</div></section></div>
 </div>}
 {tab==='Notes'&&<section className="opportunity-notes-layout"><form className="card glass-record-card opportunity-note-compose" onSubmit={addNote}><h3>Add a note</h3><label>Subject<input value={noteSubject} onChange={e=>setNoteSubject(e.target.value)} placeholder="Note title"/></label><label>Note<textarea rows={5} required value={noteContent} onChange={e=>setNoteContent(e.target.value)} placeholder="Add meeting notes, customer updates, decisions or next steps…"/></label><button className="cta" disabled={noteBusy||!noteContent.trim()}>{noteBusy?'Saving…':'Save note'}</button></form><section className="card glass-record-card opportunity-note-list"><h3>Notes ({notes.length})</h3>{notes.length?notes.map((n,i)=><article className="opportunity-note" key={n.annotationid||n.id||i}><b>{n.subject||'Note'}</b><p>{n.notetext||n.content||n.documentbody||'—'}</p><small>{n.createdon?new Date(n.createdon).toLocaleString():''}</small></article>):<p className="record-empty">No notes have been added to this opportunity yet.</p>}</section></section>}
 {tab!=='Overview'&&tab!=='Notes'&&<section className="card record-panel glass-record-card"><h3>{tab}</h3><p className="record-empty">{tab} will populate from connected Dataverse or Microsoft 365 data when the corresponding source is enabled. No sample records are displayed.</p></section>}
 {action&&<div className="opportunity-action-overlay"><section className="opportunity-action-modal" role="dialog" aria-modal="true"><header><h2>{action==='won'?'Mark opportunity as Won':'Mark opportunity as Lost'}</h2><button onClick={()=>setAction('')}>×</button></header><div className="opportunity-action-content">{action==='won'&&<label>Final revenue<input type="number" value={revenue} onChange={e=>setRevenue(e.target.value)}/></label>}<label>{action==='won'?'Description':'Reason / description'}<textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} placeholder="Add closure notes…"/></label></div><footer><button className="opportunity-action-cancel" onClick={()=>setAction('')}>Cancel</button><button className="cta" disabled={saving||(action==='won'&&Number(revenue)<=0)} onClick={closeDeal}>{saving?'Saving…':action==='won'?'Confirm Won':'Confirm Lost'}</button></footer></section></div>}
 </>
}
