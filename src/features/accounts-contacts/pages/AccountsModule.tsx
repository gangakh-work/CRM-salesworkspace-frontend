import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpDown, Building2, Globe, Mail, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'

import { useUser } from '@/features/auth/hooks/useUser'
import { ApiError, crmApi } from '@/features/accounts-contacts/api/crmApi'
import {
  ActivityList,
  DocumentList,
  DuplicateWarning,
  Field,
  ListToolbar,
  OpportunityList,
  SectionCard,
} from '@/features/accounts-contacts/components/Shared'
import { LoadState, PageHeader } from '@/features/intelligence/components/IntelUi'
import { money } from '@/features/intelligence/lib/money'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'

export function AccountsModule() {
  return (
    <Routes>
      <Route index element={<AccountListPage />} />
      <Route path=":id" element={<AccountDetailPage />} />
    </Routes>
  )
}

type SortKey = 'name' | 'revenue' | 'modified'

function AccountListPage() {
  const { email } = useUser()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 })
  const term = useDebouncedValue(search.trim())

  const q = useQuery({
    queryKey: ['crm', 'accounts', email, term, includeInactive],
    queryFn: () => crmApi.accounts(email, term, includeInactive),
    enabled: Boolean(email),
    placeholderData: (prev) => prev,
  })

  const rows = useMemo(() => {
    const items = [...(q.data?.items ?? [])]
    return items.sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir
    })
  }, [q.data, sort])

  const header = (key: SortKey, label: string, className = '') => (
    <th className={cn('px-4 py-3 font-medium', className)} aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'name' ? 1 : -1 }))}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label} <ArrowUpDown className="size-3" />
      </button>
    </th>
  )

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 pb-16 pt-4">
      <PageHeader eyebrow="Accounts" title="Accounts." subtitle="Companies in Dynamics 365 — open one for its contacts, deals, leads, activity and documents." />
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search name, email or city"
        includeInactive={includeInactive}
        onIncludeInactive={setIncludeInactive}
        count={q.data?.count}
        limit={q.data?.limit}
        fetching={q.isFetching}
      />
      <LoadState
        isLoading={q.isLoading}
        error={q.error}
        onRetry={() => void q.refetch()}
        empty={rows.length === 0}
        emptyText={term ? `No accounts match “${term}”.` : 'No accounts found.'}
      >
        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-2xl border bg-card/85 backdrop-blur md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                {header('name', 'Account')}
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Primary contact</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                {header('revenue', 'Revenue', 'text-right')}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(a.id)}
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link to={a.id} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">
                      {a.name}
                    </Link>
                    {!a.active && <span className="ml-2 text-xs text-muted-foreground">inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.industry ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{[a.city, a.country].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.primary_contact ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.owner ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(a.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <ul className="space-y-2 md:hidden">
          {rows.map((a) => (
            <li key={a.id}>
              <Link to={a.id} className="block rounded-2xl border bg-card/85 p-4">
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[a.industry, a.city, a.owner].filter(Boolean).join(' · ') || '—'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </LoadState>
    </div>
  )
}

function AccountDetailPage() {
  const { id = '' } = useParams()
  const { email } = useUser()
  const q = useQuery({
    queryKey: ['crm', 'account', email, id],
    queryFn: () => crmApi.account(email, id),
    enabled: Boolean(email && id),
    retry: (count, err) => !(err instanceof ApiError && [400, 404].includes(err.status)) && count < 2,
  })
  const d = q.data
  const a = d?.account

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 pb-16 pt-4">
      <Link to="/accounts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All accounts
      </Link>
      <LoadState isLoading={q.isLoading} error={q.error} onRetry={() => void q.refetch()}>
        {d && a && (
          <>
            <PageHeader
              eyebrow={`Account${a.account_number ? ` · ${a.account_number}` : ''}`}
              title={a.name}
              subtitle={[a.industry, [a.city, a.country].filter(Boolean).join(', '), a.owner && `Owner: ${a.owner}`]
                .filter(Boolean)
                .join(' · ')}
            />
            <DuplicateWarning items={d.duplicates.items} kind="accounts" />

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
              {[
                ['Contacts', String(d.summary.contacts)],
                ['Open opportunities', String(d.summary.open_opportunities)],
                ['Open pipeline', money(d.summary.open_pipeline)],
                ['Won deals', String(d.summary.won)],
              ].map(([label, value]) => (
                <div key={label} className="bg-card/90 p-4 backdrop-blur">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <div className="space-y-6">
                <section className="space-y-4 rounded-2xl border bg-card/85 p-5 backdrop-blur">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Building2 className="size-4" /> Company details
                  </h2>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {a.phone && (
                      <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-muted/40">
                        <Phone className="size-3.5" /> {a.phone}
                      </a>
                    )}
                    {a.email && (
                      <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-muted/40">
                        <Mail className="size-3.5" /> {a.email}
                      </a>
                    )}
                    {a.website && (
                      <a
                        href={/^https?:\/\//i.test(a.website) ? a.website : `https://${a.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-muted/40"
                      >
                        <Globe className="size-3.5" /> {a.website.replace(/^https?:\/\//i, '')}
                      </a>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-4">
                    <Field label="Primary contact">
                      {a.primary_contact_id ? (
                        <Link to={`/contacts/${a.primary_contact_id}`} className="hover:underline">
                          {a.primary_contact}
                        </Link>
                      ) : null}
                    </Field>
                    <Field label="Parent account">
                      {a.parent_account_id ? (
                        <Link to={`/accounts/${a.parent_account_id}`} className="hover:underline">
                          {a.parent_account}
                        </Link>
                      ) : null}
                    </Field>
                    <Field label="Annual revenue">{a.revenue !== null ? money(a.revenue) : null}</Field>
                    <Field label="Employees">{a.employees ?? null}</Field>
                    <Field label="Address">
                      {[a.address_line, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(', ') || null}
                    </Field>
                    <Field label="Created">{a.created?.slice(0, 10) ?? null}</Field>
                  </dl>
                  {a.description && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.description}</p>}
                </section>

                <SectionCard title="Contacts" count={d.contacts.items.length} error={d.contacts.error} empty="No contacts linked.">
                  <ul className="divide-y">
                    {d.contacts.items.map((c) => (
                      <li key={c.id} className="py-2.5">
                        <Link to={`/contacts/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{[c.job_title, c.email, c.phone].filter(Boolean).join(' · ')}</p>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title="Leads" count={d.leads.items.length} error={d.leads.error} empty="No leads linked to this account.">
                  <ul className="divide-y">
                    {d.leads.items.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <Link to={`/workspace/leads/${l.id}`} className="font-medium hover:underline">
                            {l.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">{[l.topic, l.owner].filter(Boolean).join(' · ')}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{l.status}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <OpportunityList section={d.opportunities} />
                <ActivityList section={d.activities} />
                <DocumentList section={d.documents} email={email} />
              </div>
            </div>
          </>
        )}
      </LoadState>
    </div>
  )
}

