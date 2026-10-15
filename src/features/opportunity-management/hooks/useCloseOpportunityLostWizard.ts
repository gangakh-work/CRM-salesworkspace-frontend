import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  buildLostSummary,
  createLostDefaultValues,
  getLostReasonLabel,
  LOST_FORM_STEPS,
} from '@/features/opportunity-management/config/lost-form.config'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import type { CloseOpportunityLostResultDto } from '@/features/opportunity-management/domain/lost.dto'
import {
  closeAsLostSchema,
  closeAsLostStepSchemas,
  type CloseAsLostInput,
} from '@/features/opportunity-management/domain/lost.schema'
import { useCloseOpportunityLost } from '@/features/opportunity-management/hooks/useCloseOpportunityLost'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import { opportunityLostService } from '@/features/opportunity-management/services/opportunity-lost.service'
import { useUser } from '@/features/auth/hooks/useUser'

const stepSchemas = [
  closeAsLostStepSchemas.reason,
  closeAsLostStepSchemas.competitor,
  closeAsLostStepSchemas.followUp,
]

export function useCloseOpportunityLostWizard() {
  const {
    lostWizardOpen,
    lostOpportunityId,
    closeLostWizard,
    syncLostOpportunity,
    opportunities,
  } = useOpportunityManagement()
  const { displayName } = useUser()
  const closeMutation = useCloseOpportunityLost({ showToast: false })

  const opportunity = lostOpportunityId
    ? opportunities.find((o) => o.id === lostOpportunityId)
    : undefined
  const [step, setStep] = useState(0)
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null)
  const [canClose, setCanClose] = useState(false)

  const form = useForm<CloseAsLostInput>({
    resolver: zodResolver(closeAsLostSchema),
    defaultValues: createLostDefaultValues(),
    mode: 'onChange',
  })

  const { trigger, getValues, reset, watch, formState: { errors, isDirty } } = form
  const values = watch()
  const isSubmitting = closeMutation.isPending

  useEffect(() => {
    if (lostWizardOpen && opportunity) {
      reset(createLostDefaultValues(opportunity))
      setStep(0)
    }
  }, [lostWizardOpen, opportunity, reset])

  useEffect(() => {
    if (!lostWizardOpen || !lostOpportunityId) {
      setCanClose(false)
      setEligibilityMessage(null)
      return
    }

    let mounted = true
    void opportunityLostService.canCloseAsLost(lostOpportunityId).then((result) => {
      if (!mounted) return
      setCanClose(result.allowed)
      setEligibilityMessage(result.reason ?? null)
    })

    return () => {
      mounted = false
    }
  }, [lostWizardOpen, lostOpportunityId])

  const resetWizard = useCallback(() => {
    reset(createLostDefaultValues(opportunity))
    setStep(0)
  }, [opportunity, reset])

  const handleCancel = useCallback(() => {
    if (isSubmitting) return
    closeLostWizard()
    resetWizard()
  }, [closeLostWizard, isSubmitting, resetWizard])

  const next = useCallback(async () => {
    const schema = stepSchemas[step]
    if (!schema) return
    const fields = Object.keys(schema.shape) as (keyof CloseAsLostInput)[]
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, LOST_FORM_STEPS.length - 1))
  }, [step, trigger])

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const submit = useCallback(async (): Promise<CloseOpportunityLostResultDto | null> => {
    if (!opportunity || !lostOpportunityId) return null

    const valid = await trigger()
    if (!valid) return null

    const data = getValues()
    const result = await closeMutation.mutateAsync({
      opportunityId: lostOpportunityId,
      input: { ...data, confirmed: true },
      lostBy: displayName,
    })
    syncLostOpportunity(result)
    closeLostWizard()
    resetWizard()
    return result
  }, [
    closeMutation,
    closeLostWizard,
    displayName,
    getValues,
    opportunity,
    resetWizard,
    syncLostOpportunity,
    trigger,
    lostOpportunityId,
  ])

  return {
    lostWizardOpen,
    opportunity,
    step,
    steps: LOST_FORM_STEPS,
    form,
    values,
    errors,
    isDirty,
    isSubmitting,
    displayName,
    formatStage,
    getLostReasonLabel,
    buildSummary: buildLostSummary,
    next,
    back,
    submit,
    handleCancel,
    handleClose: handleCancel,
    canClose,
    eligibilityMessage,
  }
}
