import Icon from '../components/Icon'
import { PageHead, Switch } from '../components/ui'
import { useAuth } from '../auth'
import { useApp } from '../lib/store'

function Slider({ label, hint, value, min, max, step = 1, unit = '', onChange }) {
  const p = ((value - min) / (max - min)) * 100
  return (
    <label className="slider">
      <span className="slider-top">
        <b>{label}</b>
        <output>
          {value}
          {unit}
        </output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} style={{ '--p': `${p}%` }} onChange={(e) => onChange(+e.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  )
}

export default function Settings() {
  const { settings, set, toast } = useApp()
  const {profile,photo}=useAuth()
  const userName=profile?.displayName||'Workspace user'
  const userEmail=profile?.mail||profile?.userPrincipalName||''

  return (
    <>
      <PageHead title="Settings" sub="Shape the space around you">
        <button
          type="button"
          className="cta ghost"
          onClick={() => {
            set({ curve: 16, depth: 1700, frost: 34, tint: 30, parallax: true, motion: true })
            toast({ icon: 'sync', title: 'Defaults restored' })
          }}
        >
          Reset
        </button>
      </PageHead>

      <div className="set-grid">
        <section className="card set-group rise" style={{ '--d': 1 }}>
          <h2>
            <Icon name="cube" size={18} /> Spatial layout
          </h2>
          <Slider label="Curvature" hint="How far the side panels wrap around you. You can also drag the window bar." value={settings.curve} min={0} max={28} unit="°" onChange={(curve) => set({ curve })} />
          <Slider label="Depth" hint="Lower is closer, with a stronger 3D effect." value={settings.depth} min={900} max={3200} step={50} unit="px" onChange={(depth) => set({ depth })} />
          <div className="set-row">
            <div>
              <b>Head tracking</b>
              <small>The view shifts gently as you move the pointer</small>
            </div>
            <Switch on={settings.parallax} onChange={(parallax) => set({ parallax })} label="Head tracking" />
          </div>
        </section>

        <section className="card set-group rise" style={{ '--d': 2 }}>
          <h2>
            <Icon name="sparkle" size={18} /> Glass
          </h2>
          <Slider label="Frost" hint="Background blur behind every window." value={settings.frost} min={6} max={70} unit="px" onChange={(frost) => set({ frost })} />
          <Slider label="Tint" hint="Darker glass keeps text legible on bright scenes." value={settings.tint} min={0} max={70} unit="%" onChange={(tint) => set({ tint })} />
        </section>

        <section className="card set-group rise" style={{ '--d': 3 }}>
          <h2>
            <Icon name="eye" size={18} /> Motion & account
          </h2>
          <div className="set-row">
            <div>
              <b>Animations</b>
              <small>Entrances, count-ups and transitions</small>
            </div>
            <Switch on={settings.motion} onChange={(motion) => set({ motion })} label="Animations" />
          </div>
          <div className="set-row">
            <img className="set-me" src={photo||undefined} alt="" />
            <div>
              <b>{userName}</b>
              <small>{userEmail}</small>
            </div>
            <button type="button" className="chip" onClick={() => toast({ icon: 'mail', title: 'Verification sent', text: userEmail })}>
              Edit
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
