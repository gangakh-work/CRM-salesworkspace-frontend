/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { Avatar, PageHead } from '../components/ui'
import { crmApi } from '../lib/api'
import { useApp } from '../lib/store'
const rowsOf = (r) => Array.isArray(r) ? r : (r?.data || r?.items || r?.value || [])
export default function Contacts() {
 const { go } = useApp(); const [items,setItems]=useState([]); const [q,setQ]=useState(''); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [picked,setPicked]=useState(new Set())
 const load=async()=>{setLoading(true);setError('');try{const r=await crmApi.contacts();setItems(rowsOf(r).map(x=>({id:x.contactid||x.id, name:x.title||x.fullname||[x.firstname,x.lastname].filter(Boolean).join(' ')||'Unnamed contact', email:x.email||x.emailaddress1||'', phone:x.phone||x.telephone1||x.mobilephone||'', company:x.company||x.parentcustomerid_name||'', title:x.subtitle||x.jobtitle||'', status:x.status||x.statecode_label||''})).filter(x=>x.id));}catch(e){setError(e.message||'Unable to load contacts from Dataverse.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const shown=useMemo(()=>items.filter(x=>`${x.name} ${x.email} ${x.company} ${x.phone} ${x.title}`.toLowerCase().includes(q.toLowerCase())),[items,q])
 return <><PageHead title="Contacts" sub={`${items.length} contacts from Dataverse`}><label className="search"><Icon name="search" size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search contacts"/></label><button className="chip" onClick={load}><Icon name="refresh" size={15}/> Refresh</button></PageHead>
 {loading&&<p className="empty">Loading contacts from CRM…</p>}{error&&<div className="empty" role="alert">{error}<button className="chip" onClick={load}>Retry</button></div>}
 {!loading&&!error&&<div className="card table-card"><div className="bulk"><span>{picked.size} selected</span><button className="chip" onClick={()=>go('inbox')} disabled={!picked.size}>Open Inbox</button><button className="chip" onClick={()=>setPicked(new Set())}>Clear</button></div><div className="contacts-table-scroll"><table className="table contacts-table"><thead><tr><th></th><th>Name</th><th>Email</th><th>Company</th><th>Phone</th><th>Job title</th></tr></thead><tbody>{shown.map(c=><tr key={c.id} onClick={()=>setPicked(s=>{const n=new Set(s);n.has(c.id)?n.delete(c.id):n.add(c.id);return n})}><td><i className={`box${picked.has(c.id)?' on':''}`}>{picked.has(c.id)?'✓':''}</i></td><td><span className="who"><Avatar person={c} size={34}/><b>{c.name}</b></span></td><td>{c.email||'—'}</td><td>{c.company||'—'}</td><td>{c.phone||'—'}</td><td>{c.title||'—'}</td></tr>)}</tbody></table></div>{!shown.length&&<p className="empty">No contacts returned by Dataverse.</p>}</div>}</>
}
