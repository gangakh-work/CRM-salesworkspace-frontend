import Icon from '../components/Icon'
import { CardHead, Grip } from '../components/ui'
import { money } from '../lib/format'
import { useCountUp } from '../lib/hooks'
import { useApp } from '../lib/store'

export default function CreditsWidget() {
  const { credits, openSheet } = useApp()
  const balance = useCountUp(credits.balance, 1200, 650)
  return (
    <section className="win widget credits hl" style={{ '--n': 1 }}>
      <CardHead title="Credits" icon="card">
        <Grip />
      </CardHead>
      <div className="credits-row">
        <strong className="figure">{money(balance)}</strong>
        <span className="used">{money(credits.used)} Used</span>
        <button type="button" className="plus-btn" aria-label="Top up credits" onClick={() => openSheet('topup')}>
          <Icon name="plus" size={18} stroke={2.4} />
        </button>
      </div>
    </section>
  )
}
