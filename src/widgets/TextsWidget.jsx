import { useState } from 'react'
import { AreaLine } from '../components/Charts'
import { CardHead, Select, Trend } from '../components/ui'
import { TEXTS } from '../data/seed'
import { num } from '../lib/format'
import { useCountUp } from '../lib/hooks'

/** The dark glass card: texts sent with a smooth area line. */
export default function TextsWidget() {
  const [range, setRange] = useState('All time')
  const d = TEXTS[range]
  const total = useCountUp(d.total, 1200, 800)
  return (
    <section className="win widget texts hl" style={{ '--n': 2 }}>
      <CardHead title="Texts Sent">
        <Select value={range} options={Object.keys(TEXTS)} onChange={setRange} small />
      </CardHead>
      <strong className="figure">{num(total)}</strong>
      <p className="sub">
        {num(d.today)} today <Trend value={d.delta} digits={0} />
      </p>
      <AreaLine key={range} points={d.points} ticks={d.ticks} label={d.label} />
    </section>
  )
}
