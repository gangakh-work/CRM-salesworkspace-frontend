import { Fragment, useRef, useState } from 'react'
import Icon from './Icon'
import { useDismiss } from '../lib/hooks'
import { initials, pct } from '../lib/format'

/** Small glass pill with a trend arrow — "↗ 0.3%" in the reference. */
export function Trend({ value, suffix = '%', digits = 1, plain }) {
  const down = value < 0
  return (
    <span className={`trend${down ? ' down' : ''}${plain ? ' plain' : ''}`}>
      <Icon name={down ? 'down' : 'up'} size={13} stroke={2} />
      {suffix === '%' ? pct(value, digits) : `${Math.abs(value)}${suffix}`}
    </span>
  )
}

/** Pill button that opens a glass menu of options. */
export function Select({ value, options, onChange, align = 'right', small }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useDismiss(ref, open, () => setOpen(false))
  return (
    <div className={`select${open ? ' open' : ''}${small ? ' small' : ''}`} ref={ref}>
      <button type="button" className="select-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {value}
        <Icon name="chevDown" size={15} stroke={2} />
      </button>
      <div className={`menu to-${align}`} role="listbox">
        {options.map((o, i) => (
          <button
            type="button"
            key={o}
            role="option"
            aria-selected={o === value}
            className={o === value ? 'on' : ''}
            style={{ '--i': i }}
            onClick={() => {
              onChange(o)
              setOpen(false)
            }}
          >
            {o}
            {o === value && <Icon name="check" size={15} stroke={2.2} />}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Round photo or gradient monogram, with an optional presence dot. */
export function Avatar({ person, size = 36, status }) {
  const hue = (person.name.charCodeAt(0) * 37 + person.name.length * 11) % 360
  return (
    <span className="avatar" style={{ width: size, height: size, '--h': hue, fontSize: size * 0.36 }}>
      {person.photo ? <img src={person.photo} alt="" /> : initials(person.name)}
      {status && <i className={`presence ${status}`} />}
    </span>
  )
}

export function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch${on ? ' on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <i />
    </button>
  )
}

/** Segmented control with a sliding glass thumb. */
export function Segmented({ value, options, onChange }) {
  const i = Math.max(0, options.indexOf(value))
  return (
    <div className="seg" style={{ '--n': options.length, '--i': i }}>
      <i className="seg-thumb" />
      {options.map((o) => (
        <button type="button" key={o} className={o === value ? 'on' : ''} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

/** Card title row: title on the left, whatever controls on the right. */
export function CardHead({ title, icon, children }) {
  return (
    <header className="card-head">
      <h3>
        {icon && <Icon name={icon} size={19} />}
        {title}
      </h3>
      {children}
    </header>
  )
}

/** The six-dot drag handle in the corner of each reference card. */
export function Grip() {
  return (
    <span className="grip" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  )
}

/** A heading whose words arrive one after another. */
export function Words({ text }) {
  const words = text.split(' ')
  return words.map((w, i) => (
    <Fragment key={i}>
      <span className="word" style={{ '--i': i }} aria-hidden="true">
        {w}
      </span>
      {i < words.length - 1 && ' '}
    </Fragment>
  ))
}

export function PageHead({ title, sub, children }) {
  const n = title.split(' ').length
  return (
    <div className="page-head">
      <div>
        <h1 aria-label={title}>
          <Words text={title} />
        </h1>
        {sub && (
          <p className="rv" style={{ '--i': n }}>
            {sub}
          </p>
        )}
      </div>
      {children && (
        <div className="page-tools rv" style={{ '--i': n + 1 }}>
          {children}
        </div>
      )}
    </div>
  )
}
