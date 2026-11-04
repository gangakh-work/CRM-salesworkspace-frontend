/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import { crmApi } from '../lib/api'
import { getMicrosoftGraphToken } from '../auth'
import { useApp } from '../lib/store'

const FROM = 8
const TO = 19
const HOURS = Array.from({ length: TO - FROM }, (_, i) => FROM + i)
const TYPE = { call: 'phone', meeting: 'users', appointment: 'users', demo: 'video', focus: 'sparkle' }
const time = (hour) => `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`
const rowsOf = (result) => Array.isArray(result) ? result : (result?.data || result?.items || result?.value || [])

export default function Calendar() {
  const now = useMemo(() => new Date(), [])
  const week = useMemo(() => {
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return date
    })
  }, [now])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const { toast } = useApp()
  const [showSchedule,setShowSchedule]=useState(false)
  const [meeting,setMeeting]=useState({subject:'',start:'',end:'',attendees:'',body:''})
  const [saving,setSaving]=useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await crmApi.activities()
      const mapped = rowsOf(result).map((item) => {
        const start = new Date(item.starts_at || item.scheduledstart || item.actualstart || '')
        const end = new Date(item.ends_at || item.scheduledend || item.actualend || start)
        return {
          id: item.activityid || item.id,
          title: item.title || item.subject || item.description || 'Activity',
          start,
          end,
          day: week.findIndex((date) => date.toDateString() === start.toDateString()),
          who: item.owner || item.regarding || item.ownerid_name || item.regardingobjectid_name || '',
          type: String(item.tags?.[0] || item.activitytypecode_label || item.activitytypecode || 'meeting').toLowerCase(),
        }
      }).filter((item) => item.id && item.day >= 0 && !Number.isNaN(item.start.getTime()) && (item.starts_at || item.scheduledstart || item.tags?.some((tag) => String(tag).toLowerCase().includes('meeting'))))
      let combined = mapped
      if (import.meta.env.VITE_MS_GRAPH_SCOPES) {
        try {
          const token = await getMicrosoftGraphToken()
          const from = new Date(week[0]); from.setHours(0,0,0,0)
          const until = new Date(week[6]); until.setHours(23,59,59,999)
          const url = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(from.toISOString())}&endDateTime=${encodeURIComponent(until.toISOString())}&$select=id,subject,start,end,organizer,attendees,bodyPreview&$top=100`
          const response = await fetch(url,{headers:{Authorization:`Bearer ${token}`,Prefer:'outlook.timezone="UTC"'}})
          if (!response.ok) throw new Error(`Microsoft Calendar returned ${response.status}`)
          const graph = await response.json()
          const graphRows = (graph.value||[]).map(item=>{const start=new Date(item.start.dateTime+'Z'),end=new Date(item.end.dateTime+'Z');return {id:`graph-${item.id}`,graphId:item.id,title:item.subject||'Meeting',start,end,day:week.findIndex(d=>d.toDateString()===start.toDateString()),who:item.organizer?.emailAddress?.name||'Microsoft 365',type:'meeting',source:'Microsoft 365'}}).filter(x=>x.day>=0)
          combined = [...mapped,...graphRows]
        } catch (graphError) { toast({title:'Microsoft Calendar not connected',text:graphError.message}) }
      }
      setEvents(combined)
      setSelectedId(null)
    } catch (err) {
      setError(err.message || 'Unable to load calendar activities.')
    } finally {
      setLoading(false)
    }
  }, [week, toast])

  useEffect(() => { load() }, [load])
  const todayIndex = Math.max(0, week.findIndex((date) => date.toDateString() === now.toDateString()))
  const agenda = useMemo(() => events.filter((event) => event.day === todayIndex).sort((a, b) => a.start - b.start), [events, todayIndex])
  const selected = events.find((event) => event.id === selectedId) || agenda[0] || events[0]
  const nowHour = now.getHours() + now.getMinutes() / 60
  const monday = week[0]
  const scheduleMeeting=async(e)=>{e.preventDefault();if(new Date(meeting.end)<=new Date(meeting.start)){toast({title:'Check meeting time',text:'End time must be later than start time.'});return}setSaving(true);try{
    const token=await getMicrosoftGraphToken()
    const attendees=meeting.attendees.split(',').map(x=>x.trim()).filter(Boolean).map(emailAddress=>({emailAddress:{address:emailAddress},type:'required'}))
    const payload={subject:meeting.subject,start:{dateTime:meeting.start,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone},end:{dateTime:meeting.end,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone},attendees,body:{contentType:'text',content:meeting.body}}
    const response=await fetch('https://graph.microsoft.com/v1.0/me/events',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)})
    if(!response.ok){const err=await response.json().catch(()=>({}));throw new Error(err.error?.message||`Microsoft Graph returned ${response.status}`)}
    setShowSchedule(false);setMeeting({subject:'',start:'',end:'',attendees:'',body:''});toast({icon:'check',title:'Meeting scheduled',text:'Saved to your Microsoft 365 calendar.'});await load()
  }catch(err){toast({title:'Unable to schedule meeting',text:err.message})}finally{setSaving(false)}}

  return <>
    <PageHead title="Calendar" sub={`Week of ${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${events.length} CRM activities`}>
      <button className="chip" onClick={load}><Icon name="refresh" size={15} /> Refresh</button><button className="cta" onClick={()=>setShowSchedule(true)}><Icon name="plus" size={15}/> Schedule meeting</button>
    </PageHead>
    {loading && <p className="empty">Loading calendar activities…</p>}
    {error && <div className="empty" role="alert">{error}<button className="chip" onClick={load}>Retry</button></div>}
    <div className="cal-wrap">
      <div className="card cal rise">
        <div className="cal-head"><span />{week.map((date, index) => <b key={index} className={date.toDateString() === now.toDateString() ? 'today' : ''}>{date.toLocaleDateString(undefined, { weekday: 'short' })} <em>{date.getDate()}</em></b>)}</div>
        <div className="cal-grid">
          <div className="cal-hours">{HOURS.map((hour) => <span key={hour}>{time(hour)}</span>)}</div>
          {week.map((date, day) => <div key={day} className={`cal-day${date.toDateString() === now.toDateString() ? ' today' : ''}`}>
            {events.filter((event) => event.day === day).map((event) => {
              const start = event.start.getHours() + event.start.getMinutes() / 60
              const end = event.end.getHours() + event.end.getMinutes() / 60
              return <button key={event.id} type="button" className={`event ${TYPE[event.type] || 'meeting'}${selectedId === event.id ? ' on' : ''}`} style={{ top: `${Math.max(0, (start - FROM) / (TO - FROM) * 100)}%`, height: `${Math.max(3, (Math.max(start + .25, end) - start) / (TO - FROM) * 100)}%` }} onClick={() => setSelectedId(event.id)}><b>{event.title}</b><span>{event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {event.who}</span></button>
            })}
            {date.toDateString() === now.toDateString() && nowHour >= FROM && nowHour <= TO && <i className="now" style={{ top: `${(nowHour - FROM) / (TO - FROM) * 100}%` }} />}
          </div>)}
        </div>
      </div>
      <aside className="cal-side">
        {selected ? <article className="card ev-card rise"><span className="ev-ic"><Icon name={TYPE[selected.type] || 'calendar'} size={20} /></span><h3>{selected.title}</h3><p>{selected.start.toLocaleString()} – {selected.end.toLocaleTimeString()}</p><p className="ev-who"><Icon name="users" size={14} /> {selected.who || 'No owner/related record'}</p></article> : <article className="card ev-card rise"><h3>No scheduled meetings</h3><p>Meetings created in connected CRM/Outlook will appear here.</p></article>}
        <article className="card agenda rise"><h3>Today</h3><ul>{agenda.map((event) => <li key={event.id}><button type="button" className={selected?.id === event.id ? 'on' : ''} onClick={() => setSelectedId(event.id)}><i className="dot teal" /><time>{event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time><span>{event.title}</span></button></li>)}</ul>{!agenda.length && <p className="empty">No activities scheduled for today.</p>}</article>
      </aside>
    </div>
    {showSchedule&&<div className="opportunity-action-overlay"><form className="opportunity-action-modal" onSubmit={scheduleMeeting}><header><h2>Schedule a meeting</h2><button type="button" onClick={()=>setShowSchedule(false)}>×</button></header><div className="opportunity-action-content calendar-meeting-form"><label>Meeting title<input required value={meeting.subject} onChange={e=>setMeeting(v=>({...v,subject:e.target.value}))}/></label><label>Start<input required type="datetime-local" value={meeting.start} onChange={e=>setMeeting(v=>({...v,start:e.target.value}))}/></label><label>End<input required type="datetime-local" value={meeting.end} onChange={e=>setMeeting(v=>({...v,end:e.target.value}))}/></label><label>Attendees (comma-separated emails)<input value={meeting.attendees} onChange={e=>setMeeting(v=>({...v,attendees:e.target.value}))} placeholder="name@company.com"/></label><label>Agenda<textarea rows={3} value={meeting.body} onChange={e=>setMeeting(v=>({...v,body:e.target.value}))}/></label><small>Creates an event in Microsoft 365. Requires approved Calendars.ReadWrite permission.</small></div><footer><button type="button" className="opportunity-action-cancel" onClick={()=>setShowSchedule(false)}>Cancel</button><button className="cta" disabled={saving}>{saving?'Scheduling…':'Schedule meeting'}</button></footer></form></div>}
  </>
}
