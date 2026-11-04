import { useState } from 'react'
import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import { FAQ } from '../data/seed'
import { useApp } from '../lib/store'

const WAYS = [
  { icon: 'chat', title: 'Chat with us', text: 'Replies in about 3 minutes', cta: 'Start chat' },
  { icon: 'mail', title: 'Email support', text: 'help@myflow.com · 24/7', cta: 'Write email' },
  { icon: 'doc', title: 'Guides & API', text: '120+ articles and recipes', cta: 'Open docs' },
]

export default function Support() {
  const { toast } = useApp()
  const [open, setOpen] = useState(0)
  const [q, setQ] = useState('')
  const t = q.trim().toLowerCase()
  const faq = FAQ.filter((f) => !t || `${f.q} ${f.a}`.toLowerCase().includes(t))

  return (
    <>
      <PageHead title="Support" sub="We’re here whenever you need a hand">
        <label className="search">
          <Icon name="search" size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles" />
        </label>
      </PageHead>

      <div className="ways">
        {WAYS.map((w, i) => (
          <article key={w.title} className="card way hl rise" style={{ '--d': i + 1 }}>
            <span className="way-ic">
              <Icon name={w.icon} size={22} />
            </span>
            <h3>{w.title}</h3>
            <p>{w.text}</p>
            <button type="button" className="cta ghost sm" onClick={() => toast({ icon: w.icon, title: w.cta, text: 'Opening…' })}>
              {w.cta} <Icon name="arrowRight" size={15} stroke={2} />
            </button>
          </article>
        ))}
      </div>

      <section className="card faq rise" style={{ '--d': 4 }}>
        <h2>Frequently asked</h2>
        {faq.map((f, i) => (
          <div key={f.q} className={`faq-item${open === i ? ' open' : ''}`}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              {f.q}
              <Icon name="chevDown" size={18} stroke={2} />
            </button>
            <div className="faq-a">
              <p>{f.a}</p>
            </div>
          </div>
        ))}
        {faq.length === 0 && <p className="empty">No articles match “{q}”.</p>}
      </section>
    </>
  )
}
