/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth'
import Icon from '../components/Icon'
import ThemeToggle from '../components/ThemeToggle'
import { crmApi } from '../lib/api'
import { greeting } from '../lib/format'
import { useApp } from '../lib/store'

const arr = (value) => Array.isArray(value) ? value : (value?.value || value?.items || value?.data || [])
const pick = (record, keys, fallback = 0) => {
  for (const key of keys) if (record?.[key] != null) return record[key]
  return fallback
}
const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: Number(value) >= 1000000 ? 'compact' : 'standard',
}).format(Number(value || 0))
const asDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
const isWon = (row) => pick(row, ['statecode']) === 1 ||
  String(pick(row, ['statuscode_label', 'statecode_label', 'status', 'statuscode'], '')).toLowerCase().includes('won')
const isLost = (row) => pick(row, ['statecode']) === 2 ||
  String(pick(row, ['statuscode_label', 'statecode_label', 'status', 'statuscode'], '')).toLowerCase().includes('lost')
const isComplete = (task) => pick(task, ['statecode']) === 1 ||
  ['completed', 'complete', 'done', 'closed'].some((state) =>
    String(pick(task, ['status', 'statuscode_label', 'statecode_label'], '')).toLowerCase().includes(state))
const getTaskDue = (task) => asDate(pick(task, ['due_date', 'scheduledend', 'scheduledstart', 'dueDate'], ''))
const getStage = (row) => {
  const raw = String(pick(row, ['stepname', 'salesstage', 'statuscode_label', 'stage', 'status'], 'Other')).toLowerCase()
  if (raw.includes('qualif')) return 'Qualification'
  if (raw.includes('discover') || raw.includes('develop')) return 'Discovery'
  if (raw.includes('propos')) return 'Proposal'
  if (raw.includes('negotiat')) return 'Negotiation'
  if (raw.includes('close')) return 'Closing'
  return 'Other'
}

function Header() {
  const { profile, photo } = useAuth()
  const first = (profile?.displayName || 'there').trim().split(/\s+/)[0]
  return (
    <header className="ov-head crm-dashboard-head">
      <div>
        <h1 className="hello">Good {greeting().replace('Good ', '')}, {first}</h1>
        <p className="rv">Your sales performance, priorities and pipeline at a glance.</p>
      </div>
      <div className="ov-tools">
        <ThemeToggle />
        {photo && <img className="crm-profile-photo" src={photo} alt={`${profile?.displayName || 'Microsoft account'} profile`} />}
      </div>
    </header>
  )
}

function Sparkline({ values = [] }) {
  const data = values.length ? values : [0, 0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(...data, 1)
  const points = data.map((value, index) => {
    const x = data.length < 2 ? 50 : index / (data.length - 1) * 100
    const y = 22 - (Number(value) / max) * 18
    return `${x},${y}`
  }).join(' ')
  return <svg className="sales-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} /></svg>
}

function KpiCard({ icon, title, value, note, accent, series, onClick }) {
  return (
    <button type="button" className={`card hl sales-kpi sales-kpi-${accent}`} onClick={onClick} aria-label={`View ${title}: ${value}. ${note}`}>
      <div className="sales-kpi-heading"><span className="sales-kpi-icon"><Icon name={icon} size={19} /></span><h2>{title}</h2></div>
      <strong className="sales-kpi-value">{value}</strong>
      <span className="sales-kpi-note">{note}</span>
      <Sparkline values={series} />
    </button>
  )
}

function PriorityCard({ tasks, onTaskClick, onViewAll }) {
  const pending = tasks
    .filter((task) => !isComplete(task) && getTaskDue(task) && getTaskDue(task) < new Date(new Date().setHours(24, 0, 0, 0)))
    .sort((a, b) => getTaskDue(a) - getTaskDue(b))
  const visibleTasks = pending.slice(0, 3)
  return (
    <article className="card hl sales-kpi sales-priority-kpi">
      <div className="sales-kpi-heading">
        <span className="sales-kpi-icon"><Icon name="calendar" size={19} /></span>
        <h2>Today's Priorities</h2>
      </div>
      <div className="priority-kpi-list">
        {visibleTasks.length ? visibleTasks.map((task) => {
          const taskId = task.activityid || task.taskid || task.id
          const due = getTaskDue(task)
          const overdue = due < new Date(new Date().setHours(0, 0, 0, 0))
          return (
            <button type="button" className="priority-kpi-task" key={taskId || task.subject} onClick={() => taskId && onTaskClick(String(taskId))} disabled={!taskId}>
              <span className={`priority-kpi-dot${overdue ? ' overdue' : ''}`} />
              <span className="priority-kpi-name">{pick(task, ['subject', 'title', 'description'], 'CRM task')}</span>
              <small>{overdue ? 'Overdue' : 'Today'}</small>
            </button>
          )
        }) : <span className="priority-kpi-empty">No overdue or due-today tasks</span>}
      </div>
      {pending.length > visibleTasks.length && <span className="priority-kpi-more">+{pending.length - visibleTasks.length} more</span>}
      <button type="button" className="priority-kpi-view" onClick={onViewAll}>View all {pending.length} tasks <Icon name="arrowRight" size={13} /></button>
    </article>
  )
}

function TopRecordsCard({ title, icon, records, kind, onRecordClick }) {
  return (
    <article className={`card sales-kpi sales-record-kpi sales-kpi-${kind}`}>
      <div className="sales-kpi-heading">
        <span className="sales-kpi-icon"><Icon name={icon} size={19} /></span>
        <h2>{title}</h2>
      </div>
      {records.length ? <div className="sales-record-list">
        {records.map((record, index) => {
          const recordId = kind === 'opportunities'
            ? record.opportunityid || record.id
            : record.leadid || record.id || record.leadId
          const name = pick(record, kind === 'opportunities'
            ? ['name', 'opportunityname', 'topic', 'title']
            : ['fullname', 'name', 'full_name', 'subject', 'companyname'], `Unnamed ${kind === 'opportunities' ? 'opportunity' : 'lead'}`)
          const detail = kind === 'opportunities'
            ? money(pick(record, ['estimatedvalue', 'expectedrevenue', 'value'], 0))
            : `Score ${Number(pick(record, ['leadscore', 'score'], 0)) || '—'}`
          return (
            <button type="button" className="sales-record-row" key={recordId || `${name}-${index}`} onClick={() => recordId && onRecordClick(String(recordId))} disabled={!recordId}>
              <span className="sales-record-rank">{index + 1}</span>
              <span className="sales-record-name">{name}</span>
              <small>{detail}</small>
            </button>
          )
        })}
      </div> : <span className="sales-record-empty">No {kind} available</span>}
    </article>
  )
}

function PanelTitle({ icon, children, action }) {
  return <div className="sales-panel-title"><h2><Icon name={icon} size={18} />{children}</h2>{action}</div>
}

function SalesPerformance({ wonDeals, now }) {
  const [period, setPeriod] = useState('yearly')
  const { values, labels, total, title } = useMemo(() => {
    let dates
    let labelForDate
    let periodTitle
    if (period === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      dates = Array.from({ length: dayCount }, (_, index) => new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1))
      labelForDate = (date) => String(date.getDate())
      periodTitle = `Closed-won sales in ${monthStart.toLocaleString('en', { month: 'long' })}`
    } else {
      const firstMonth = period === 'quarterly' ? Math.floor(now.getMonth() / 3) * 3 : 0
      const monthCount = period === 'quarterly' ? 3 : 12
      dates = Array.from({ length: monthCount }, (_, index) => new Date(now.getFullYear(), firstMonth + index, 1))
      labelForDate = (date) => date.toLocaleString('en', { month: 'short' })
      periodTitle = period === 'quarterly'
        ? `Closed-won sales in Q${Math.floor(now.getMonth() / 3) + 1}`
        : 'Closed-won sales this year'
    }

    const values = dates.map((bucket) => wonDeals.filter((deal) => {
      const closed = asDate(pick(deal, ['actualclosedate', 'estimatedclosedate'], ''))
      if (!closed || closed.getFullYear() !== bucket.getFullYear()) return false
      return period === 'monthly'
        ? closed.getMonth() === bucket.getMonth() && closed.getDate() === bucket.getDate()
        : closed.getMonth() === bucket.getMonth()
    }).reduce((sum, deal) => sum + Number(pick(deal, ['actualvalue', 'estimatedvalue', 'value'], 0)), 0))
    return {
      values,
      labels: dates.map(labelForDate),
      total: values.reduce((sum, value) => sum + value, 0),
      title: periodTitle,
    }
  }, [now, period, wonDeals])
  const max = Math.max(...values, 1)
  return (
    <article className="card sales-panel performance-panel">
      <PanelTitle icon="target" action={<div className="sales-period-toggle" role="group" aria-label="Sales performance period">
        {['yearly', 'quarterly', 'monthly'].map((option) => <button type="button" key={option} className={period === option ? 'active' : ''} aria-pressed={period === option} onClick={() => setPeriod(option)}>{option[0].toUpperCase() + option.slice(1)}</button>)}
      </div>}>My Sales Performance</PanelTitle>
      <div className="sales-performance-summary">
        <strong>{money(total)}</strong>
        <span className="sales-goal-badge">Closed-won value</span>
      </div>
      <div className="sales-performance-content">
        <div className="sales-performance-foot">{title}</div>
        <div className={`sales-month-chart sales-chart-${period}`} role="img" aria-label={`${title}: ${money(total)}`}>
          {values.map((value, index) => <div key={labels[index]} title={`${labels[index]}: ${money(value)}`}><i style={{ height: `${Math.max(value ? 9 : 3, value / max * 100)}%` }} /><small>{period === 'monthly' && Number(labels[index]) % 5 !== 1 ? '' : labels[index]}</small></div>)}
        </div>
      </div>
    </article>
  )
}

function AttentionDeals({ deals }) {
  const rows = deals.slice(0, 4)
  return (
    <article className="card sales-panel attention-panel">
      <PanelTitle icon="help">Deals Requiring Attention</PanelTitle>
      {rows.length ? <div className="attention-table">
        <div className="attention-head"><span>Opportunity</span><span>Value</span><span>Stage</span><span>Next action</span></div>
        {rows.map((deal) => <div className="attention-row" key={deal.opportunityid || deal.id || deal.name}>
          <span><Icon name="building" size={15} /><b>{pick(deal, ['name', 'opportunityname', 'title'], 'Opportunity')}</b></span>
          <strong>{money(pick(deal, ['estimatedvalue', 'expectedrevenue', 'value'], 0))}</strong>
          <em>{pick(deal, ['stepname', 'statuscode_label', 'stage'], 'Open')}</em>
          <small>{pick(deal, ['estimatedclosedate']) ? `Close ${new Date(deal.estimatedclosedate).toLocaleDateString()}` : 'Review next step'}</small>
        </div>)}
      </div> : <p className="sales-empty">No opportunities are currently flagged by their close date or CRM status.</p>}
    </article>
  )
}

function PipelineStages({ opportunities }) {
  const stageOrder = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closing', 'Other']
  const stages = stageOrder.map((stage) => {
    const rows = opportunities.filter((deal) => getStage(deal) === stage)
    return { stage, count: rows.length, value: rows.reduce((sum, deal) => sum + Number(pick(deal, ['estimatedvalue', 'expectedrevenue', 'value'], 0)), 0) }
  }).filter((stage) => stage.count)
  const total = opportunities.length || 1
  return (
    <article className="card sales-panel stage-panel">
      <PanelTitle icon="pipeline">Pipeline by Stage</PanelTitle>
      <div className="stage-layout"><div className="stage-funnel" aria-hidden="true">{stages.slice(0, 5).map((stage) => <i key={stage.stage} style={{ width: `${Math.max(34, 100 - (stages.indexOf(stage) * 13))}%` }} />)}</div>
        <div className="stage-list">{stages.length ? stages.map((stage) => <div className="stage-row" key={stage.stage}><i /><span>{stage.stage}</span><b>{stage.count}</b><small>{Math.round(stage.count / total * 100)}%</small></div>) : <p className="sales-empty">No open pipeline to group by stage.</p>}</div>
      </div>
    </article>
  )
}

export default function Overview() {
  const { openDashboardView } = useApp()
  const [opportunities, setOpportunities] = useState([])
  const [leads, setLeads] = useState([])
  const [tasks, setTasks] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let live = true
    const readCache = (key) => {
      try {
        const cached = JSON.parse(sessionStorage.getItem(key) || 'null')
        return cached && Date.now() - cached.at < 30000 ? cached.data : null
      } catch {
        return null
      }
    }
    const writeCache = (key, data) => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }))
      } catch (error) {
        console.debug('Dashboard cache unavailable', error)
      }
    }
    const cachedOpps = readCache('crm-dashboard-opps')
    const cachedLeads = readCache('crm-dashboard-leads')
    const cachedTasks = readCache('crm-dashboard-tasks')
    if (cachedOpps) setOpportunities(cachedOpps)
    if (cachedLeads) setLeads(cachedLeads)
    if (cachedTasks) setTasks(cachedTasks)

    const requests = [
      ['opps', crmApi.opportunities(), setOpportunities],
      ['leads', crmApi.leads(), setLeads],
      ['tasks', crmApi.tasks(), setTasks],
    ]
    Promise.allSettled(requests.map(([, request]) => request)).then((results) => {
      if (!live) return
      if (results[1].status === 'rejected') {
        setLoadError(`Could not load leads from CRM: ${results[1].reason?.message || 'check the CRM connection.'}`)
      }
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return
        const [key, , setData] = requests[index]
        const data = arr(result.value)
        setData(data)
        writeCache(`crm-dashboard-${key}`, data)
      })
      if (results.every((result) => result.status === 'rejected') && results[1].status !== 'rejected') {
        setLoadError('Could not reach the CRM API. Check that your backend is running and VITE_API_BASE_URL is correct.')
      }
    })
    return () => { live = false }
  }, [])

  const now = new Date()
  const openOpportunities = useMemo(() => opportunities.filter((deal) => !isWon(deal) && !isLost(deal)), [opportunities])
  const wonDeals = useMemo(() => opportunities.filter(isWon), [opportunities])
  const topOpportunities = useMemo(() => opportunities
    .filter((deal) => deal.opportunityid || deal.id)
    .sort((a, b) => Number(pick(b, ['estimatedvalue', 'expectedrevenue', 'value'], 0)) - Number(pick(a, ['estimatedvalue', 'expectedrevenue', 'value'], 0)))
    .slice(0, 5), [opportunities])
  const topLeads = useMemo(() => leads
    .filter((lead) => lead.leadid || lead.id || lead.leadId)
    .sort((a, b) => Number(pick(b, ['leadscore', 'score'], 0)) - Number(pick(a, ['leadscore', 'score'], 0)))
    .slice(0, 5), [leads])
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const riskDeals = openOpportunities.filter((deal) => {
    const close = asDate(pick(deal, ['estimatedclosedate', 'closeDate'], ''))
    const status = String(pick(deal, ['statuscode_label', 'status', 'risk'], '')).toLowerCase()
    return (close && close < new Date(todayStart.getTime() + 30 * 86400000)) ||
      status.includes('risk') || status.includes('no activity')
  }).sort((a, b) => {
    const first = asDate(pick(a, ['estimatedclosedate'], ''))?.getTime() ?? Infinity
    const second = asDate(pick(b, ['estimatedclosedate'], ''))?.getTime() ?? Infinity
    return first - second
  })
  const riskOpportunityIds = riskDeals.map((deal) => deal.opportunityid || deal.id).filter(Boolean).map(String)
  const dueTaskIds = tasks.filter((task) => {
    const due = getTaskDue(task)
    return !isComplete(task) && due && due < new Date(todayStart.getTime() + 86400000)
  }).map((task) => task.activityid || task.taskid || task.id).filter(Boolean).map(String)
  const openView = (view) => openDashboardView({ ...view, recordIds: [...new Set(view.recordIds)] })
  const openTopOpportunity = (opportunityId) => openView({ page: 'opportunities', entityType: 'opportunity', label: 'Top opportunities', filter: 'top-five', recordIds: [opportunityId] })
  const openTopLead = (leadId) => openView({ page: 'leads', entityType: 'lead', label: 'Top leads', filter: 'top-five', recordIds: [leadId] })
  const openTask = (taskId) => openView({ page: 'tasks', entityType: 'task', label: "Today's priorities", filter: 'due-open', recordIds: [taskId] })
  const openPriorityTasks = () => openView({ page: 'tasks', entityType: 'task', label: "Today's priorities", filter: 'due-open', recordIds: dueTaskIds })

  return (
    <div className="overview crm-overview crm-sales-dashboard">
      <Header />
      {loadError && <div className="crm-api-warning">{loadError}</div>}
      <div className="sales-dashboard-grid">
        <TopRecordsCard icon="pipeline" title="Top 5 Opportunities" records={topOpportunities} kind="opportunities" onRecordClick={openTopOpportunity} />
        <TopRecordsCard icon="users" title="Top 5 Leads" records={topLeads} kind="leads" onRecordClick={openTopLead} />
        <PriorityCard tasks={tasks} onTaskClick={openTask} onViewAll={openPriorityTasks} />
        <KpiCard icon="help" title="Deals at Risk" value={riskDeals.length} note="Closing soon or overdue" accent="rose" series={riskDeals.map((deal) => Number(pick(deal, ['estimatedvalue', 'value'], 0)))} onClick={() => openView({ page: 'opportunities', entityType: 'opportunity', label: 'Deals at risk', filter: 'at-risk', recordIds: riskOpportunityIds })} />
        <SalesPerformance wonDeals={wonDeals} now={now} />
        <PipelineStages opportunities={openOpportunities} />
        <AttentionDeals deals={riskDeals} />
      </div>
    </div>
  )
}
