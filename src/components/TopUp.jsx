import { useState } from 'react'
import Icon from './Icon'
import { money } from '../lib/format'
import { useApp } from '../lib/store'

const AMOUNTS = [100, 250, 500, 1000]

/** Credits top-up sheet, opened from the Credits widget's + button. */
export default function TopUp({ onClose }) {
  const { credits, setCredits, toast } = useApp()
  const [amount, setAmount] = useState(250)
  const [busy, setBusy] = useState(false)

  const pay = () => {
    setBusy(true)
    setTimeout(() => {
      setCredits((c) => ({ ...c, balance: c.balance + amount }))
      toast({ icon: 'check', title: `${money(amount)} added`, text: `New balance ${money(credits.balance + amount)}` })
      onClose()
    }, 900)
  }

  return (
    <div className="sheet-wrap" onPointerDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="sheet topup" role="dialog" aria-label="Top up credits">
        <header>
          <span className="tu-ic">
            <Icon name="card" size={22} />
          </span>
          <div>
            <h2>Top up credits</h2>
            <p>Balance {money(credits.balance)} · about {Math.round(credits.balance / 0.025).toLocaleString('en-US')} texts</p>
          </div>
          <button type="button" className="round-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={16} stroke={2} />
          </button>
        </header>

        <div className="tu-grid">
          {AMOUNTS.map((a, i) => (
            <button type="button" key={a} className={`tu-amt hl${a === amount ? ' on' : ''}`} style={{ '--i': i }} onClick={() => setAmount(a)}>
              <strong>{money(a)}</strong>
              <span>{Math.round(a / 0.025).toLocaleString('en-US')} texts</span>
              {a === 500 && <em>Popular</em>}
            </button>
          ))}
        </div>

        <div className="tu-pay">
          <span className="visa">VISA</span>
          <div>
            <strong>Visa •••• 4242</strong>
            <span>Expires 08/28</span>
          </div>
          <Icon name="check" size={18} stroke={2.2} />
        </div>

        <button type="button" className={`cta${busy ? ' busy' : ''}`} onClick={pay} disabled={busy}>
          {busy ? <i className="spinner" /> : `Add ${money(amount)}`}
        </button>
      </div>
    </div>
  )
}
