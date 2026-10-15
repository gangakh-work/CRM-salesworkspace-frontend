import type {
  OpportunityStage,
  OpportunityStatus,
} from '@/features/opportunity-management/types/opportunity.types'

/** Open pipeline stages in mandatory order (excludes Won/Lost). */
export const OPEN_STAGE_ORDER: OpportunityStage[] = [
  'prospect',
  'qualification',
  'discovery',
  'proposal',
  'commercial_review',
  'negotiation',
  'legal_review',
]

export const STAGE_ORDER: OpportunityStage[] = [
  ...OPEN_STAGE_ORDER,
  'won',
]

export const STAGE_LABELS: Record<
  OpportunityStage,
  string
> = {
  prospect: 'Prospect',
  qualification: 'Qualification',
  discovery: 'Discovery',
  proposal: 'Proposal Submitted',
  commercial_review: 'Commercial Review',
  negotiation: 'Negotiation',
  legal_review: 'Contract Review',
  won: 'Won',
  lost: 'Lost',
}

export const STAGE_PROBABILITY: Record<
  OpportunityStage,
  number
> = {
  prospect: 10,
  qualification: 20,
  discovery: 35,
  proposal: 45,
  commercial_review: 55,
  negotiation: 70,
  legal_review: 85,
  won: 100,
  lost: 0,
}

export function formatStage(
  stage: OpportunityStage,
): string {
  return STAGE_LABELS[stage]
}

export function stageToKanban(
  stage: OpportunityStage,
): string {
  return STAGE_LABELS[stage]
}

export function isClosedStage(
  stage: OpportunityStage,
): boolean {
  return (
    stage === 'won' ||
    stage === 'lost'
  )
}

export function getOpenStageIndex(
  stage: OpportunityStage,
): number {
  return OPEN_STAGE_ORDER.indexOf(stage)
}

export function getNextStage(
  stage: OpportunityStage,
): OpportunityStage | null {
  if (isClosedStage(stage)) return null

  if (stage === 'legal_review') {
    return null
  }

  const idx = getOpenStageIndex(stage)

  if (
    idx === -1 ||
    idx >= OPEN_STAGE_ORDER.length - 1
  ) {
    return null
  }

  return (
    OPEN_STAGE_ORDER[idx + 1] ??
    null
  )
}

export function getPreviousStage(
  stage: OpportunityStage,
): OpportunityStage | null {
  if (isClosedStage(stage)) {
    return null
  }

  const idx =
    getOpenStageIndex(stage)

  if (idx <= 0) {
    return null
  }

  return (
    OPEN_STAGE_ORDER[idx - 1] ??
    null
  )
}

export function getAllowedTargetStages(
  from: OpportunityStage,
  options: { isAdmin?: boolean } = {},
): OpportunityStage[] {
  if (isClosedStage(from)) {
    return []
  }

  const targets =
    new Set<OpportunityStage>()

  const next =
    getNextStage(from)

  const prev =
    getPreviousStage(from)

  /*
   * Everyone can move one stage forward
   * or one stage backward.
   */
  if (next) {
    targets.add(next)
  }

  if (prev) {
    targets.add(prev)
  }

  /*
   * Admins additionally get the ability to
   * jump forward to later open stages.
   *
   * IMPORTANT:
   * Previous-stage movement remains available
   * to admins as well.
   */
  if (options.isAdmin) {
    const fromIdx =
      getOpenStageIndex(from)

    for (
      let i = fromIdx + 1;
      i < OPEN_STAGE_ORDER.length;
      i += 1
    ) {
      targets.add(
        OPEN_STAGE_ORDER[i]!,
      )
    }
  }

  return [...targets]
}

/** @deprecated Use getAllowedTargetStages — kept for existing dropdowns. */
export function getNextStages(
  stage: OpportunityStage,
): OpportunityStage[] {
  return getAllowedTargetStages(stage)
}

/** Stages eligible for Close as Won. */
export const WIN_ELIGIBLE_STAGES: OpportunityStage[] =
  [
    'negotiation',
    'legal_review',
  ]

export function canMarkAsWon(
  stage: OpportunityStage,
): boolean {
  return WIN_ELIGIBLE_STAGES.includes(
    stage,
  )
}

/** Stages eligible for Close as Lost. */
export const LOST_ELIGIBLE_STAGES: OpportunityStage[] =
  [
    'commercial_review',
    'negotiation',
    'legal_review',
  ]

export function canMarkAsLost(
  stage: OpportunityStage,
): boolean {
  return LOST_ELIGIBLE_STAGES.includes(
    stage,
  )
}

export function isOpportunityLocked(
  opportunity: {
    status: OpportunityStatus
    locked?: boolean
  },
): boolean {
  return (
    (opportunity.status === 'won' ||
      opportunity.status === 'lost') &&
    opportunity.locked === true
  )
}

export function isForbiddenTransition(
  from: OpportunityStage,
  _to: OpportunityStage,
): boolean {
  return (
    from === 'won' ||
    from === 'lost'
  )
}

export function canTransition(
  from: OpportunityStage,
  to: OpportunityStage,
  options: { isAdmin?: boolean } = {},
): boolean {
  if (from === to) {
    return false
  }

  if (
    isForbiddenTransition(
      from,
      to,
    )
  ) {
    return false
  }

  /*
   * Won/Lost are handled by their
   * dedicated close workflows.
   */
  if (to === 'lost') {
    return false
  }

  if (to === 'won') {
    return false
  }

  if (isClosedStage(from)) {
    return false
  }

  const next =
    getNextStage(from)

  const prev =
    getPreviousStage(from)

  /*
   * CRITICAL FIX:
   *
   * Admins can also move BACK one stage.
   * Previously the admin branch only allowed:
   *
   *     toIdx > fromIdx
   *
   * which incorrectly blocked:
   *
   *     Proposal → Discovery
   *     Discovery → Qualification
   *     Qualification → Prospect
   *
   * Admins can now move one stage backward,
   * while still retaining their forward-jump
   * capability.
   */
  if (options.isAdmin) {
    if (to === prev) {
      return true
    }

    const fromIdx =
      getOpenStageIndex(from)

    const toIdx =
      getOpenStageIndex(to)

    return (
      toIdx > fromIdx
    )
  }

  /*
   * Normal users can move exactly one
   * stage forward or backward.
   */
  return (
    to === next ||
    to === prev
  )
}