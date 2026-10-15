import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  createDisqualifyDefaultValues,
  DISQUALIFICATION_FORM_STEPS,
  formatDisqualificationReason,
} from '@/features/lead-management/config/disqualification-form.config'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import type { DisqualifyLeadResultDto } from '@/features/lead-management/domain/disqualification.dto'
import {
  disqualifyLeadSchema,
  disqualifyLeadStepSchemas,
  type DisqualifyLeadInput,
} from '@/features/lead-management/domain/disqualification.schema'
import { useDisqualifyLead } from '@/features/lead-management/hooks/useDisqualifyLead'
import { buildDisqualificationRecord } from '@/features/lead-management/lib/disqualification-record'
import {
  canDisqualifyLead,
  leadDisqualificationService,
} from '@/features/lead-management/services/lead-disqualification.service'
import { useUser } from '@/features/auth/hooks/useUser'

const stepSchemas = [
  disqualifyLeadStepSchemas.reason,
  disqualifyLeadStepSchemas.competitor,
  disqualifyLeadStepSchemas.followUp,
]

export function useDisqualifyLeadWizard() {
  const {
    disqualifyWizardOpen,
    disqualifyLeadId,
    closeDisqualifyWizard,
    syncDisqualifiedLead,
    leads,
  } = useLeadManagement()
  const { displayName } = useUser()
  const disqualifyMutation = useDisqualifyLead({ showToast: false })

  const lead = disqualifyLeadId ? leads.find((l) => l.id === disqualifyLeadId) : undefined
  const [step, setStep] = useState(0)
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null)
  const [canDisqualify, setCanDisqualify] = useState(false)

  const form = useForm<DisqualifyLeadInput>({
    resolver: zodResolver(disqualifyLeadSchema),
    defaultValues: createDisqualifyDefaultValues(),
    mode: 'onChange',
  })

  const { trigger, getValues, reset, watch, formState: { errors, isDirty } } = form
  const values = watch()
  const isSubmitting = disqualifyMutation.isPending

  useEffect(() => {
    if (disqualifyWizardOpen && lead) {
      reset(createDisqualifyDefaultValues())
      setStep(0)
    }
  }, [disqualifyWizardOpen, lead, reset])

  useEffect(() => {
    if (!disqualifyWizardOpen || !disqualifyLeadId) {
      setCanDisqualify(false)
      setEligibilityMessage(null)
      return
    }

    let mounted = true
    void leadDisqualificationService.canDisqualify(disqualifyLeadId).then((result) => {
      if (!mounted) return
      setCanDisqualify(result.allowed)
      setEligibilityMessage(result.reason ?? null)
    })

    return () => {
      mounted = false
    }
  }, [disqualifyWizardOpen, disqualifyLeadId])

  const resetWizard = useCallback(() => {
    reset(createDisqualifyDefaultValues())
    setStep(0)
  }, [reset])

  const handleCancel = useCallback(() => {
    if (isSubmitting) return
    closeDisqualifyWizard()
    resetWizard()
  }, [closeDisqualifyWizard, isSubmitting, resetWizard])

  const handleReset = useCallback(() => {
    if (isSubmitting) return
    resetWizard()
  }, [isSubmitting, resetWizard])

  const next = useCallback(async () => {
    const schema = stepSchemas[step]
    if (!schema) return
    const fields = Object.keys(schema.shape) as (keyof DisqualifyLeadInput)[]
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, DISQUALIFICATION_FORM_STEPS.length - 1))
  }, [step, trigger])

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const previewRecord = lead
    ? buildDisqualificationRecord(values, displayName)
    : null

  const submit = useCallback(async (): Promise<DisqualifyLeadResultDto | null> => {
    if (!lead || !disqualifyLeadId) return null

    if (!canDisqualifyLead(lead.status)) {
      throw new Error('Only leads with status New, Contacted, or Qualified can be disqualified')
    }

    const valid = await trigger()
    if (!valid) return null

    const data = getValues()
    const result = await disqualifyMutation.mutateAsync({
      leadId: disqualifyLeadId,
      input: data,
      disqualifiedBy: displayName,
    })
    syncDisqualifiedLead(result)
    closeDisqualifyWizard()
    resetWizard()
    return result
  }, [
    closeDisqualifyWizard,
    displayName,
    getValues,
    lead,
    disqualifyLeadId,
    disqualifyMutation,
    resetWizard,
    syncDisqualifiedLead,
    trigger,
  ])

  return {
    disqualifyWizardOpen,
    lead,
    step,
    steps: DISQUALIFICATION_FORM_STEPS,
    form,
    values,
    errors,
    isDirty,
    isSubmitting,
    displayName,
    previewRecord,
    formatReason: formatDisqualificationReason,
    next,
    back,
    submit,
    handleCancel,
    handleReset,
    handleClose: handleCancel,
    canDisqualify,
    eligibilityMessage,
  }
}
