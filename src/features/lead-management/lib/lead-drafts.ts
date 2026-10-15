import type { CreateLeadInput } from '@/features/lead-management/domain/lead.schema'

export interface LeadDraft {
  id: string

  data: Partial<CreateLeadInput>

  createdAt: string

  updatedAt: string

  source?: string
}

const STORAGE_KEY =
  'sales-workspace.lead-drafts.v1'

function readDrafts(): LeadDraft[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed
      : []
  } catch {
    return []
  }
}

function writeDrafts(
  drafts: LeadDraft[],
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(drafts),
    )
  } catch {
    /*
     * Draft persistence is best-effort.
     * Existing application functionality should
     * not break if browser storage is unavailable.
     */
  }
}

export function listLeadDrafts(): LeadDraft[] {
  return readDrafts().sort(
    (a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
  )
}

export function saveLeadDraft(
  data: Partial<CreateLeadInput>,
  id?: string,
  source?: string,
): LeadDraft {
  const now =
    new Date().toISOString()

  const drafts = readDrafts()

  const draftId =
    id ?? `draft-${Date.now()}`

  const existing = drafts.find(
    (draft) => draft.id === draftId,
  )

  const draft: LeadDraft = {
    id: draftId,

    data: {
      ...(existing?.data ?? {}),
      ...data,
    },

    createdAt:
      existing?.createdAt ?? now,

    updatedAt: now,

    source:
      source ??
      existing?.source,
  }

  writeDrafts([
    draft,
    ...drafts.filter(
      (item) =>
        item.id !== draftId,
    ),
  ])

  return draft
}

export function getLeadDraft(
  id: string,
): LeadDraft | null {
  return (
    readDrafts().find(
      (draft) =>
        draft.id === id,
    ) ?? null
  )
}

export function deleteLeadDraft(
  id: string,
) {
  writeDrafts(
    readDrafts().filter(
      (draft) =>
        draft.id !== id,
    ),
  )
}

export function getLeadDraftLabel(
  draft: LeadDraft,
): string {
  const first =
    draft.data.firstName?.trim() ??
    ''

  const last =
    draft.data.lastName?.trim() ??
    ''

  const contact =
    `${first} ${last}`.trim()

  return (
    contact ||
    draft.data.companyName?.trim() ||
    'Untitled Lead Draft'
  )
}