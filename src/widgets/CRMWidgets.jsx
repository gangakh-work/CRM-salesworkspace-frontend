import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { crmApi } from '../lib/api'

const list = (v) => Array.isArray(v) ? v : (v?.value || v?.items || v?.data || [])
const pick = (o, keys, fallback = 0) => { for (const k of keys) if (o?.[k] != null) return o[k]; return fallback }
const money = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1, notation: Number(v) >= 1000000 ? 'compact' : 'standard' }).format(Number(v || 0))

export default function CRMWidgets() {
  const [leads, setLeads] = useState([])
  const [opportunities, setOpportunities] = useState([])
  useEffect(() => {
    let active = true
    Promise.allSettled([crmApi.leads(), crmApi.opportunities()]).then(([l, o]) => {
      if (!active) return
      if (l.status === 'fulfilled') setLeads(list(l.value))
      if (o.status === 'fulfilled') setOpportunities(list(o.value))
    })
    return () => { active = false }
  }, [])
  const totalLeads = leads.length
  const leadMonths=Array.from({length:8},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(7-i));return leads.filter(x=>{const c=new Date(pick(x,['createdon','created_at','createdAt'],''));return !Number.isNaN(c.getTime())&&c.getMonth()===d.getMonth()&&c.getFullYear()===d.getFullYear()}).length})
  const newLeads = leads.filter(x => {
    const d = new Date(pick(x, ['createdon', 'created_at', 'createdAt'], ''))
    return !Number.isNaN(d.getTime()) && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear()
  }).length
  const pipeline = opportunities.filter(o => { const state=pick(o,['statecode'],null); const status=String(pick(o,['statuscode_label','status','statecode_label'],'')).toLowerCase(); return state===0 || (!status.includes('won')&&!status.includes('lost')&&!status.includes('closed')) }).reduce((s, o) => s + Number(pick(o, ['estimatedvalue', 'budgetamount', 'value'], 0)), 0)
  const won = opportunities.filter(o => String(pick(o, ['status', 'statuscode', 'statecode'], '')).toLowerCase().includes('won') || pick(o, ['statecode']) === 1)
  const wonValue = won.reduce((s, o) => s + Number(pick(o, ['actualvalue', 'estimatedvalue', 'value'], 0)), 0)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthly = months.map((_, i) => won.filter(o => { const d = new Date(pick(o, ['actualclosedate'], '')); return !Number.isNaN(d.getTime()) && d.getMonth() === i }).length)
  const max = Math.max(1, ...monthly)
  return <div className="crm-right-stack">
    <section className="crm-side-card leads-side hl">
      <div className="side-card-head"><span>LEADS</span></div>
      <strong className="side-big">{totalLeads.toLocaleString('en-IN')}</strong>
      <div className="side-new">{newLeads} new this month <b>↗ Live CRM</b></div>
      <div className="side-pill-bars">{leadMonths.map((v,i)=><i key={i} style={{height:`${Math.max(5,v/Math.max(1,...leadMonths)*100)}%`}}/>)}</div>
    </section>
    <section className="crm-side-card pipeline-side hl">
      <small>SALES PERFORMANCE</small><h3><Icon name="pipeline" size={17}/> Total Sales Pipeline</h3>
      <div className="pipeline-value">{money(pipeline)}</div>
      <div className="pipeline-foot"><span>{opportunities.length} opportunities</span></div>
    </section>
    <section className="crm-side-card won-side hl">
      <div className="won-side-title"><div><small>PERFORMANCE</small><h3>Opportunity Wins</h3></div><span className="won-badge">{won.length} won</span></div>
      <strong className="side-big">{won.length.toLocaleString('en-IN')}</strong>
      <p>{money(wonValue)} closed-won value</p>
      <div className="won-line-chart"><svg viewBox="0 0 300 112" preserveAspectRatio="none" role="img" aria-label="Monthly opportunity wins"><defs><linearGradient id="wonFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".26"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs><path d={`M ${monthly.map((v,i)=>`${i*27.2} ${96-(v/max)*76}`).join(' L ')}`} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/><path d={`M 0 96 L ${monthly.map((v,i)=>`${i*27.2} ${96-(v/max)*76}`).join(' L ')} L 300 112 L 0 112 Z`} fill="url(#wonFill)"/><circle cx="299" cy={96-(monthly[11]/max)*76} r="4.5" fill="#fff"/></svg></div>
      <div className="won-dates"><span>Jan</span><span>Jun</span><span>Dec</span></div>
    </section>
  </div>
}
