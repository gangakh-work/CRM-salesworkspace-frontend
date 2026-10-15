import {
  FilePenLine,
  Trash2,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Button } from '@/components/ui/button'

import { Typography } from '@/components/ui/typography'

import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'

import {
  deleteLeadDraft,
  getLeadDraftLabel,
  listLeadDrafts,
  type LeadDraft,
} from '@/features/lead-management/lib/lead-drafts'

export function LeadDraftsSection() {
  const { openWizard } =
    useLeadManagement()

  const [drafts, setDrafts] =
    useState<LeadDraft[]>(() =>
      listLeadDrafts(),
    )

  /*
   * Refresh drafts whenever this section
   * becomes visible again.
   */
  useEffect(() => {
    setDrafts(listLeadDrafts())
  }, [])

  const sortedDrafts = useMemo(
    () =>
      [...drafts].sort(
        (a, b) =>
          b.updatedAt.localeCompare(
            a.updatedAt,
          ),
      ),
    [drafts],
  )

  const remove = (id: string) => {
    deleteLeadDraft(id)

    setDrafts((current) =>
      current.filter(
        (draft) =>
          draft.id !== id,
      ),
    )
  }

  if (sortedDrafts.length === 0) {
    return (
      <div className="m-4 rounded-xl border border-dashed bg-muted/20 p-10 text-center">
        <FilePenLine className="mx-auto mb-3 size-8 text-muted-foreground" />

        <Typography variant="heading-m">
          No lead drafts
        </Typography>

        <Typography
          variant="caption"
          tone="muted"
        >
          Use Save as Draft while creating
          a Lead. Your incomplete entries
          will appear here.
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      <div>
        <Typography variant="heading-m">
          Drafts
        </Typography>

        <Typography
          variant="caption"
          tone="muted"
        >
          {sortedDrafts.length} saved lead draft
          {sortedDrafts.length === 1
            ? ''
            : 's'}
        </Typography>
      </div>

      <div className="grid gap-3">
        {sortedDrafts.map((draft) => (
          <div
            key={draft.id}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Typography
                variant="body"
                className="font-semibold"
              >
                {getLeadDraftLabel(
                  draft,
                )}
              </Typography>

              <Typography
                variant="caption"
                tone="muted"
              >
                {draft.data.companyName ||
                  'Company not entered'}
                {' · '}
                Last updated{' '}
                {new Date(
                  draft.updatedAt,
                ).toLocaleString()}
              </Typography>

              <Typography
                variant="caption"
                tone="muted"
              >
                {draft.data.email ||
                  'No email'}
                {' · '}
                {draft.data.phone ||
                  'No phone'}
              </Typography>
            </div>

            <div className="flex shrink-0 gap-2">
              {/* Continue editing */}
              <Button
                size="sm"
                onClick={() =>
                  openWizard(draft)
                }
              >
                <FilePenLine className="size-4" />
                Continue
              </Button>

              {/* Delete draft */}
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() =>
                  remove(draft.id)
                }
                aria-label={`Delete ${getLeadDraftLabel(
                  draft,
                )}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}