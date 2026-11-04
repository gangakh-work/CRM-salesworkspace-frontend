import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import { useApp } from '../lib/store'

const APPS = [
  { id: 'teams', name: 'Microsoft Teams', cat: 'Messaging', hue: 260, desc: 'Prepare Teams chat and messaging integration. Actions will become available when Microsoft Graph permissions are approved.' },
  { id: 'outlook', name: 'Microsoft Outlook', cat: 'Email & calendar', hue: 210, desc: 'Prepare Outlook email and calendar integration. Read/send email and meeting actions require approved delegated permissions.' },
]
export default function Integrations() {
  const { toast } = useApp()
  const status = { teams: 'Pending IT approval', outlook: 'Pending IT approval' }
  return <>
    <PageHead title="Integrations" sub="Connect Microsoft 365 services to your CRM" />
    <div className="app-grid">
      {APPS.map((app, i) => <article key={app.id} className="card app hl rise" style={{ '--d': i + 1 }}>
        <header><span className="app-logo" style={{ '--h': app.hue }}>{app.id === 'teams' ? 'T' : 'O'}</span><div><h3>{app.name}</h3><span>{app.cat}</span></div><span className="status">{status[app.id]}</span></header>
        <p>{app.desc}</p>
        <footer><i className="dot amber" /> {status[app.id]}</footer>
        <button className="cta ghost sm" type="button" onClick={() => toast({ icon: 'apps', title: `${app.name} is prepared`, text: 'Complete Microsoft Graph delegated-permission approval and configure Entra redirect settings to enable live actions.' })}>View setup status</button>
      </article>)}
    </div>
    <div className="card api rise" style={{ '--d': 3 }}>
      <span className="stat-ic"><Icon name="apps" size={18} /></span>
      <div><b>Microsoft Graph permissions</b><span>Integration controls are intentionally not marked connected while IT approval is pending.</span></div>
    </div>
  </>
}
