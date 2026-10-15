import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast as sonnerToast } from 'sonner'

import type {
  AssignOwnerInput,
  OnHoldInput,
  TransitionStageInput,
} from '@/features/opportunity-management/domain/stage.schema'
import { notifyOpportunityUpdated } from '@/features/opportunity-management/opportunity.events'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import {
  OpportunityStageError,
  opportunityStageService,
} from '@/features/opportunity-management/services/opportunity-stage.service'
import { queryKeys } from '@/infrastructure/api/query-keys'

function invalidateOpportunityQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
  notifyOpportunityUpdated()
}

interface StageMutationOptions {
  showToast?: boolean
}

export function useOpportunityStage(options: StageMutationOptions = {}) {
  const { showToast = true } = options
  const queryClient = useQueryClient()

  const onError = (error: Error) => {
    if (showToast) {
      sonnerToast.error(
        error instanceof OpportunityStageError ? error.message : 'Opportunity update failed',
      )
    }
  }

  const transition = useMutation({
    mutationFn: (input: TransitionStageInput) => opportunityStageService.transitionStage(input),
    onSuccess: (result) => {
      invalidateOpportunityQueries(queryClient)
      if (showToast) {
        sonnerToast.success(`Stage updated to ${formatStage(result.toStage)}`)
      }
    },
    onError,
  })

  const moveNext = useMutation({
    mutationFn: ({
      opportunityId,
      transitionedBy,
      isAdmin,
    }: {
      opportunityId: string
      transitionedBy: string
      isAdmin?: boolean
    }) => opportunityStageService.moveToNextStage(opportunityId, transitionedBy, isAdmin),
    onSuccess: () => {
      invalidateOpportunityQueries(queryClient)
      if (showToast) sonnerToast.success('Moved to next stage')
    },
    onError,
  })

  const movePrevious = useMutation({
    mutationFn: ({
      opportunityId,
      transitionedBy,
      isAdmin,
    }: {
      opportunityId: string
      transitionedBy: string
      isAdmin?: boolean
    }) => opportunityStageService.moveToPreviousStage(opportunityId, transitionedBy, isAdmin),
    onSuccess: () => {
      invalidateOpportunityQueries(queryClient)
      if (showToast) sonnerToast.success('Moved to previous stage')
    },
    onError,
  })

  const setOnHold = useMutation({
    mutationFn: (input: OnHoldInput) => opportunityStageService.setOnHold(input),
    onSuccess: (result) => {
      invalidateOpportunityQueries(queryClient)
      if (showToast) {
        sonnerToast.success(result.opportunity.onHold ? 'Opportunity marked on hold' : 'Opportunity resumed')
      }
    },
    onError,
  })

  const assignOwner = useMutation({
    mutationFn: (input: AssignOwnerInput) => opportunityStageService.assignOwner(input),
    onSuccess: (result) => {
      invalidateOpportunityQueries(queryClient)
      if (showToast) sonnerToast.success(`Assigned to ${result.opportunity.owner}`)
    },
    onError,
  })

  const duplicate = useMutation({
    mutationFn: ({
      opportunityId,
      duplicatedBy,
    }: {
      opportunityId: string
      duplicatedBy: string
    }) => opportunityStageService.duplicateOpportunity(opportunityId, duplicatedBy),
    onSuccess: () => {
      invalidateOpportunityQueries(queryClient)
      if (showToast) sonnerToast.success('Opportunity duplicated')
    },
    onError,
  })

  return {
    transition,
    moveNext,
    movePrevious,
    setOnHold,
    assignOwner,
    duplicate,
    isPending:
      transition.isPending ||
      moveNext.isPending ||
      movePrevious.isPending ||
      setOnHold.isPending ||
      assignOwner.isPending ||
      duplicate.isPending,
  }
}
