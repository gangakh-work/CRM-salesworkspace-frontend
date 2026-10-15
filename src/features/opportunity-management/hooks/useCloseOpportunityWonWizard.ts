import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  buildWinSummary,
  createWinDefaultValues,
  WIN_FORM_STEPS,
} from '@/features/opportunity-management/config/win-form.config'
import { useOpportunityManagement } from '@/features/opportunity-management/context/OpportunityManagementProvider'
import type { CloseOpportunityWonResultDto } from '@/features/opportunity-management/domain/win.dto'
import {
  closeAsWonSchema,
  closeAsWonStepSchemas,
  type CloseAsWonInput,
} from '@/features/opportunity-management/domain/win.schema'
import { useCloseOpportunityWon } from '@/features/opportunity-management/hooks/useCloseOpportunityWon'
import { formatCurrency } from '@/lib/formatters'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import { opportunityWinService } from '@/features/opportunity-management/services/opportunity-win.service'
import { useUser } from '@/features/auth/hooks/useUser'

const stepSchemas = [
  closeAsWonStepSchemas.revenue,
  closeAsWonStepSchemas.customer,
  closeAsWonStepSchemas.implementation,
]

export function useCloseOpportunityWonWizard() {
  const {
    winWizardOpen,
    winOpportunityId,
    closeWinWizard,
    syncWonOpportunity,
    opportunities,
  } = useOpportunityManagement()
  const { displayName } = useUser()
  const closeMutation = useCloseOpportunityWon({ showToast: false })

  const opportunity = winOpportunityId
    ? opportunities.find((o) => o.id === winOpportunityId)
    : undefined
  const [step, setStep] = useState(0)
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null)
  const [canClose, setCanClose] = useState(false)

  const form = useForm<CloseAsWonInput>({
    resolver: zodResolver(closeAsWonSchema),
    defaultValues: createWinDefaultValues(),
    mode: 'onChange',
  })

  const { trigger, getValues, reset, watch, formState: { errors, isDirty } } = form
  const values = watch()
  const isSubmitting = closeMutation.isPending

  useEffect(() => {
    if (winWizardOpen && opportunity) {
      reset(createWinDefaultValues(opportunity))
      setStep(0)
    }
  }, [winWizardOpen, opportunity, reset])

  useEffect(() => {
    if (!winWizardOpen || !winOpportunityId) {
      setCanClose(false)
      setEligibilityMessage(null)
      return
    }

    let mounted = true
    void opportunityWinService.canCloseAsWon(winOpportunityId).then((result) => {
      if (!mounted) return
      setCanClose(result.allowed)
      setEligibilityMessage(result.reason ?? null)
    })

    return () => {
      mounted = false
    }
  }, [winWizardOpen, winOpportunityId])

  const resetWizard = useCallback(() => {
    reset(createWinDefaultValues(opportunity))
    setStep(0)
  }, [opportunity, reset])

  const handleCancel = useCallback(() => {
    if (isSubmitting) return
    closeWinWizard()
    resetWizard()
  }, [closeWinWizard, isSubmitting, resetWizard])

  const next = useCallback(async () => {
    const schema = stepSchemas[step]
    if (!schema) return
    const fields = Object.keys(schema.shape) as (keyof CloseAsWonInput)[]
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, WIN_FORM_STEPS.length - 1))
  }, [step, trigger])

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const submit = useCallback(async (): Promise<CloseOpportunityWonResultDto | null> => {
    if (!opportunity || !winOpportunityId) return null

    const valid = await trigger()
    if (!valid) return null

    const data = getValues()
    const result = await closeMutation.mutateAsync({
      opportunityId: winOpportunityId,
      input: { ...data, confirmed: true },
      closedBy: displayName,
    })
    syncWonOpportunity(result)
    closeWinWizard()
    resetWizard()
    return result
  }, [
    closeMutation,
    closeWinWizard,
    displayName,
    getValues,
    opportunity,
    resetWizard,
    syncWonOpportunity,
    trigger,
    winOpportunityId,
  ])

  return {
    winWizardOpen,
    opportunity,
    step,
    steps: WIN_FORM_STEPS,
    form,
    values,
    errors,
    isDirty,
    isSubmitting,
    displayName,
    formatStage,
    formatCurrency,
    buildSummary: buildWinSummary,
    next,
    back,
    submit,
    handleCancel,
    handleClose: handleCancel,
    canClose,
    eligibilityMessage,
  }
}
