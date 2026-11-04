import { PillBars } from '../components/Charts'
import { CardHead, Grip, Trend } from '../components/ui'
import { CONTACT_STATS } from '../data/seed'
import { num } from '../lib/format'
import { useCountUp } from '../lib/hooks'

/** The blue "water" glass card at the top of the widget stack. */
export default function ContactsWidget() {
  const total = useCountUp(CONTACT_STATS.total, 1300, 500)
  return (
    <section className="win widget contacts hl" style={{ '--n': 0 }}>
      <i className="water" aria-hidden="true" />
      <CardHead title="Contacts">
        <Grip />
      </CardHead>
      <strong className="figure">{num(total)}</strong>
      <p className="sub">
        {CONTACT_STATS.newThisMonth} New in July <Trend value={CONTACT_STATS.delta} digits={0} />
      </p>
      <PillBars data={CONTACT_STATS.months} />
    </section>
  )
}
