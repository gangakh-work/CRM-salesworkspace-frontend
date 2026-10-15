import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpDown, Mail, Phone, Smartphone, UserRound } from 'lucide-react'
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
} from '@/features/accounts-contacts/components/Shared'
import { LoadState, PageHeader } from '@/features/intelligence/components/IntelUi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'

export function ContactsModule() {
  return (
    <Routes>
      <Route index element={<ContactListPage />} />
      <Route path=":id" element={<ContactDetailPage />} />
    </Routes>
  )
}

type SortKey = 'name' | 'account' | 'modified'

/** A contact's parent customer can be an account or another contact. */
function parentLink(type: string | null, id: string | null): string | null {
  if (!id) return null
  return type === 'contact' ? `/contacts/${id}` : `/accounts/${id}`
}

function ContactListPage() {
  const { email } = useUser()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 })
  const term = useDebouncedValue(search.trim())

  const q = useQuery({
    queryKey: ['crm', 'contacts', email, term, includeInactive],
    queryFn: () => crmApi.contacts(email, term, includeInactive),
    enabled: Boolean(email),
    placeholderData: (prev) => prev,
  })

  const rows = useMemo(() => {
    const items = [...(q.data?.items ?? [])]
    return items.sort((a, b) => {
      const av = (a[sort.key] ?? '').toString().toLowerCase()
      const bv = (b[sort.key] ?? '').toString().toLowerCase()
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir
    })
  }, [q.data, sort])

  const header = (key: SortKey, label: string) => (
    <th className="px-4 py-3 font-medium" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'modified' ? -1 : 1 }))}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label} <ArrowUpDown className="size-3" />
      </button>
    </th>
  )

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 pb-16 pt-4">
      <PageHeader eyebrow="Contacts" title="Contacts." subtitle="People in Dynamics 365 — open one for their account, deals, activity and documents." />
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search name, email or job title"
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
        emptyText={term ? `No contacts match “${term}”.` : 'No contacts found.'}
      >
        <div className="hidden overflow-x-auto rounded-2xl border bg-card/85 backdrop-blur md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                {header('name', 'Name')}
                <th className="px-4 py-3 font-medium">Job title</th>
                {header('account', 'Account')}
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} onClick={() => navigate(c.id)} className="cursor-pointer border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link to={c.id} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {!c.active && <span className="ml-2 text-xs text-muted-foreground">inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.job_title ?? '—'}</td>
                  <td className="px-4 py-3">
                    {parentLink(c.account_type, c.account_id) ? (
                      <Link
                        to={parentLink(c.account_type, c.account_id)!}
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {c.account}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{c.phone ?? c.mobile ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.owner ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-2 md:hidden">
          {rows.map((c) => (
            <li key={c.id}>
              <Link to={c.id} className="block rounded-2xl border bg-card/85 p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{[c.job_title, c.account].filter(Boolean).join(' · ') || '—'}</p>
              </Link>
            </li>
          ))}
        </ul>
      </LoadState>
    </div>
  )
}

function ContactDetailPage() {
  const { id = '' } = useParams()
  const { email } = useUser()
  const q = useQuery({
    queryKey: ['crm', 'contact', email, id],
    queryFn: () => crmApi.contact(email, id),
    enabled: Boolean(email && id),
    retry: (count, err) => !(err instanceof ApiError && [400, 404].includes(err.status)) && count < 2,
  })
  const d = q.data
  const c = d?.contact
  const parent = c ? parentLink(c.account_type, c.account_id) : null

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 pb-16 pt-4">
      <Link to="/contacts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All contacts
      </Link>
      <LoadState isLoading={q.isLoading} error={q.error} onRetry={() => void q.refetch()}>
        {d && c && (
          <>
            <PageHeader
              eyebrow="Contact"
              title={c.name}
              subtitle={[c.job_title, c.account && `at ${c.account}`, c.owner && `Owner: ${c.owner}`].filter(Boolean).join(' · ')}
            />
            <DuplicateWarning items={d.duplicates.items} kind="contacts" />

            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border bg-border">
              {[
                ['Opportunities', d.summary.opportunities],
                ['Open activities', d.summary.open_activities],
                ['Documents', d.summary.documents],
              ].map(([label, value]) => (
                <div key={label} className="bg-card/90 p-4 backdrop-blur">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <section className="h-fit space-y-4 rounded-2xl border bg-card/85 p-5 backdrop-blur">
                <h2 className="flex items-center gap-2 font-semibold">
                  <UserRound className="size-4" /> Details
                </h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-muted/40">
                      <Mail className="size-3.5" /> {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-muted/40">
                      <Phone className="size-3.5" /> {c.phone}
                    </a>
                  )}
                  {c.mobile && (
                    <a href={`tel:${c.mobile}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-muted/40">
                      <Smartphone className="size-3.5" /> {c.mobile}
                    </a>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label={c.account_type === 'contact' ? 'Parent contact' : 'Account'}>
                    {parent ? (
                      <Link to={parent} className="hover:underline">
                        {c.account}
                      </Link>
                    ) : null}
                  </Field>
                  <Field label="Department">{c.department}</Field>
                  <Field label="Location">{[c.city, c.country].filter(Boolean).join(', ') || null}</Field>
                  <Field label="Created">{c.created?.slice(0, 10) ?? null}</Field>
                  <Field label="Status">{c.active ? 'Active' : 'Inactive'}</Field>
                </dl>
                {c.description && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.description}</p>}
              </section>
              <div className={cn('space-y-6')}>
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
