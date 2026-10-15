import { Search, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchBox } from '@/components/ui/search-box'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Typography } from '@/components/ui/typography'
import { DEFAULT_SUGGESTED_PROMPTS } from '@/features/ai-copilot/data/suggested-prompts'
import { useOpportunitiesQuery } from '@/features/opportunity-management/hooks/useOpportunityQueries'
import { getFlatNavigation } from '@/config/navigation'
import { semanticMatches } from '@/lib/semantic-search'
import { cn } from '@/lib/utils'

interface CommandBarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenCopilot?: (opts?: { prompt?: string }) => void
}

export function CommandBar({
  open,
  onOpenChange,
  onOpenCopilot,
}: CommandBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const items = useMemo(
    () => getFlatNavigation(),
    [],
  )

  const {
    data: opportunityData,
  } = useOpportunitiesQuery()

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()

    if (!q) {
      return items
    }

    return items.filter(
      (item) =>
        item.label
          .toLowerCase()
          .includes(q)
        ||
        item.description
          .toLowerCase()
          .includes(q),
    )
  }, [
    items,
    query,
  ])

  const opportunityMatches = useMemo(() => {
    const q = query.trim()

    if (!q) {
      return []
    }

    return (
      opportunityData?.opportunities ?? []
    )
      .filter(
        (opportunity) =>
          semanticMatches(
            q,
            [
              opportunity.name,
              opportunity.customer,
              opportunity.primaryContact,
              opportunity.owner,
              opportunity.description,
            ],
          ),
      )
      .slice(0, 8)
  }, [
    opportunityData?.opportunities,
    query,
  ])

  const showAiSection =
    !query.trim()
    ||
    query
      .toLowerCase()
      .includes('ai')
    ||
    query.startsWith('>')

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path)
      onOpenChange(false)
      setQuery('')
    },
    [
      navigate,
      onOpenChange,
    ],
  )

  const handleAiPrompt = useCallback(
    (prompt: string) => {
      onOpenCopilot?.({
        prompt,
      })

      onOpenChange(false)
      setQuery('')
    },
    [
      onOpenCopilot,
      onOpenChange,
    ],
  )

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next)

      if (!next) {
        setQuery('')
      }
    },
    [onOpenChange],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>
            Command palette
          </DialogTitle>

          <DialogDescription>
            Search CRM opportunities, modules or ask Copilot
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center border-b px-3">
          <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />

          <SearchBox
            placeholder="Search CRM opportunities or type > for Copilot..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            onClear={() =>
              setQuery('')
            }
            className="border-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-80">
          {showAiSection
            && onOpenCopilot
            && (
              <section className="border-b p-2">
                <Typography
                  variant="caption"
                  tone="muted"
                  className="px-2 py-1 text-[10px] uppercase tracking-wider"
                >
                  Copilot
                </Typography>

                <ul>
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
                      onClick={() =>
                        onOpenCopilot()
                      }
                    >
                      <Sparkles className="size-4 shrink-0 text-primary" />

                      <div>
                        <Typography
                          variant="body"
                          className="text-sm font-medium"
                        >
                          Open Copilot
                        </Typography>

                        <Typography
                          variant="caption"
                          tone="muted"
                        >
                          ⌃I
                        </Typography>
                      </div>
                    </button>
                  </li>

                  {DEFAULT_SUGGESTED_PROMPTS
                    .slice(0, 4)
                    .map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
                          onClick={() =>
                            handleAiPrompt(
                              p.prompt,
                            )
                          }
                        >
                          <Sparkles className="size-4 shrink-0 text-muted-foreground" />

                          <Typography
                            variant="body"
                            className="text-sm"
                          >
                            {p.label}
                          </Typography>
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            )}

          {opportunityMatches.length > 0
            && (
              <section className="border-b p-2">
                <Typography
                  variant="caption"
                  tone="muted"
                  className="px-2 py-1 text-[10px] uppercase tracking-wider"
                >
                  CRM Opportunities
                </Typography>

                <ul>
                  {opportunityMatches.map(
                    (opportunity) => (
                      <li
                        key={
                          opportunity.id
                        }
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
                          onClick={() =>
                            handleSelect(
                              `/workspace/opportunities/${opportunity.id}`,
                            )
                          }
                        >
                          <Search className="size-4 shrink-0 text-muted-foreground" />

                          <div className="min-w-0 flex-1">
                            <Typography
                              variant="body"
                              className="text-sm font-medium"
                            >
                              {
                                opportunity.name
                              }
                            </Typography>

                            <Typography
                              variant="caption"
                              tone="muted"
                              className="line-clamp-1"
                            >
                              {
                                opportunity.customer
                              }
                            </Typography>
                          </div>
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </section>
            )}

          <section className="p-2">
            <Typography
              variant="caption"
              tone="muted"
              className="px-2 py-1 text-[10px] uppercase tracking-wider"
            >
              Navigation
            </Typography>

            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Typography
                  variant="caption"
                  tone="muted"
                >
                  No navigation results found
                </Typography>
              </div>
            ) : (
              <ul>
                {filtered.map(
                  (item) => {
                    const Icon =
                      item.icon

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted',
                          )}
                          onClick={() =>
                            handleSelect(
                              item.path,
                            )
                          }
                        >
                          <Icon className="size-4 shrink-0 text-muted-foreground" />

                          <div className="min-w-0 flex-1">
                            <Typography
                              variant="body"
                              className="text-sm font-medium"
                            >
                              {item.label}
                            </Typography>

                            <Typography
                              variant="caption"
                              tone="muted"
                              className="line-clamp-1"
                            >
                              {
                                item.description
                              }
                            </Typography>
                          </div>

                          {item.badge
                            && (
                              <Badge
                                variant="secondary"
                                className="shrink-0"
                              >
                                {
                                  item.badge
                                }
                              </Badge>
                            )}
                        </button>
                      </li>
                    )
                  },
                )}
              </ul>
            )}
          </section>
        </ScrollArea>

        <div className="flex items-center justify-between border-t px-4 py-2">
          <Typography
            variant="caption"
            tone="muted"
          >
            <kbd className="rounded border px-1">
              ⌃K
            </kbd>{' '}
            palette ·{' '}
            <kbd className="rounded border px-1">
              ⌃I
            </kbd>{' '}
            Copilot
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useCommandBar() {
  const [
    open,
    setOpen,
  ] = useState(false)

  useEffect(() => {
    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        (
          event.metaKey
          || event.ctrlKey
        )
        && event.key.toLowerCase()
          === 'k'
      ) {
        event.preventDefault()

        setOpen(
          (prev) => !prev,
        )
      }
    }

    window.addEventListener(
      'keydown',
      onKeyDown,
    )

    return () =>
      window.removeEventListener(
        'keydown',
        onKeyDown,
      )
  }, [])

  return {
    open,
    setOpen,
  }
}