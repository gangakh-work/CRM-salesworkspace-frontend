/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import { crmApi } from '../lib/api'
import { useDismiss } from '../lib/hooks'

const rowsOf = (result) => Array.isArray(result) ? result : (result?.data || result?.items || result?.value || [])

export default function Companies() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchRef = useRef(null)

  useDismiss(searchRef, searchOpen, () => setSearchOpen(false))

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await crmApi.accounts()
      setItems(rowsOf(result).map((row) => ({
        id: row.accountid || row.id,
        name: row.title || row.name || row.accountname || 'Unnamed account',
        industry: row.industrycode_label || row.industry || row.subtitle || '',
        city: row.city || row.address1_city || '',
        phone: row.phone || row.telephone1 || '',
        website: row.websiteurl || '',
        owner: row.owner || row.ownerid_name || '',
      })).filter((company) => company.id))
    } catch (loadError) {
      setError(loadError.message || 'Unable to load accounts from Dataverse.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const suggestions = useMemo(() => items
    .filter((company) => !normalizedQuery || company.name.toLowerCase().startsWith(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name)), [items, normalizedQuery])
  const shown = useMemo(() => items.filter((company) =>
    `${company.name} ${company.industry} ${company.city} ${company.phone}`.toLowerCase().includes(normalizedQuery),
  ), [items, normalizedQuery])

  return (
    <>
      <PageHead title="Companies" sub={`${items.length} accounts from Dataverse`}>
        <div className="company-search" ref={searchRef}>
          <label className="search">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search companies"
              aria-label="Search companies"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="company-search-suggestions"
            />
          </label>
          {searchOpen && !loading && !error && (
            <div className="company-suggestions" id="company-search-suggestions" role="listbox" aria-label="Company names">
              {suggestions.length ? suggestions.map((company) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={query === company.name}
                  key={company.id}
                  onClick={() => {
                    setQuery(company.name)
                    setSearchOpen(false)
                  }}
                >
                  <span>{company.name}</span>
                  {company.city && <small>{company.city}</small>}
                </button>
              )) : <p className="company-suggestions-empty">No company names match “{query}”.</p>}
            </div>
          )}
        </div>
        <button className="chip" onClick={load}>Refresh</button>
      </PageHead>
      {loading && <p className="empty">Loading accounts from CRM…</p>}
      {error && <div className="empty" role="alert">{error}<button className="chip" onClick={load}>Retry</button></div>}
      <div className="co-grid">
        {shown.map((company, index) => (
          <article key={company.id} className="card co hl rise" style={{ '--d': index + 1 }}>
            <header>
              <span className="co-logo">{company.name[0]}</span>
              <div><h3>{company.name}</h3><span>{company.industry || 'Industry not specified'}</span></div>
            </header>
            <p className="co-city">{company.city || 'Location not specified'}</p>
            <div className="co-stats">
              <div><small>Phone</small><b>{company.phone || '—'}</b></div>
              <div><small>Website</small><b>{company.website || '—'}</b></div>
            </div>
            <footer><span>{company.owner || 'Owner not assigned'}</span></footer>
          </article>
        ))}
        {!loading && !error && !shown.length && <p className="empty">No accounts returned by Dataverse.</p>}
      </div>
    </>
  )
}
