import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  createQualifyDefaultValues,
  QUALIFICATION_FORM_STEPS,
} from '@/features/lead-management/config/qualification-form.config'
import { formatQualificationRating } from '@/features/lead-management/config/qualification-scoring.config'
import type { QualifyLeadResultDto } from '@/features/lead-management/domain/qualification.dto'
import {
  qualifyLeadSchema,
  qualifyLeadStepSchemas,
  type QualifyLeadInput,
} from '@/features/lead-management/domain/qualification.schema'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { useQualifyLead } from '@/features/lead-management/hooks/useQualifyLead'
import { calculateQualificationScore } from '@/features/lead-management/lib/qualification-scoring'
import { canQualifyLead } from '@/features/lead-management/services/lead-qualification.service'
import { useUser } from '@/features/auth/hooks/useUser'

const stepSchemas = [
  qualifyLeadStepSchemas.interest,
  qualifyLeadStepSchemas.budget,
  qualifyLeadStepSchemas.questions,
]

export function useQualifyLeadWizard() {
  const {
    qualifyWizardOpen,
    qualifyLeadId,
    closeQualifyWizard,
    syncQualifiedLead,
    leads,
  } = useLeadManagement()
  const { displayName } = useUser()
  const qualifyMutation = useQualifyLead({ showToast: false })

  const lead = qualifyLeadId ? leads.find((l) => l.id === qualifyLeadId) : undefined
  const [step, setStep] = useState(0)

  const form = useForm<QualifyLeadInput>({
    resolver: zodResolver(qualifyLeadSchema),
    defaultValues: createQualifyDefaultValues(),
    mode: 'onChange',
  })

  const { trigger, getValues, reset, watch, formState: { errors, isDirty } } = form
  const values = watch()
  const isSubmitting = qualifyMutation.isPending

  useEffect(() => {
    if (qualifyWizardOpen && lead) {
      reset(createQualifyDefaultValues(lead))
      setStep(0)
    }
  }, [qualifyWizardOpen, lead, reset])

  const resetWizard = useCallback(() => {
    reset(createQualifyDefaultValues(lead))
    setStep(0)
  }, [lead, reset])

  const handleCancel = useCallback(() => {
    if (isSubmitting) return
    closeQualifyWizard()
    resetWizard()
  }, [closeQualifyWizard, isSubmitting, resetWizard])

  const handleReset = useCallback(() => {
    if (isSubmitting) return
    resetWizard()
  }, [isSubmitting, resetWizard])

  const next = useCallback(async () => {
    const schema = stepSchemas[step]
    if (!schema) return
    const fields = Object.keys(schema.shape) as (keyof QualifyLeadInput)[]
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, QUALIFICATION_FORM_STEPS.length - 1))
  }, [step, trigger])

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const previewScore = lead
    ? calculateQualificationScore(values, lead)
    : null

  const submit = useCallback(async (): Promise<QualifyLeadResultDto | null> => {
    if (!lead || !qualifyLeadId) return null

    if (!canQualifyLead(lead.status)) {
      throw new Error('Only leads with status New or Contacted can be qualified')
    }

    const valid = await trigger()
    if (!valid) return null

    const data = getValues()
    const result = await qualifyMutation.mutateAsync({
      leadId: qualifyLeadId,
      input: data,
      qualifiedBy: displayName,
    })
    syncQualifiedLead(result)
    closeQualifyWizard()
    resetWizard()
    return result
  }, [
    closeQualifyWizard,
    displayName,
    getValues,
    lead,
    qualifyLeadId,
    qualifyMutation,
    resetWizard,
    syncQualifiedLead,
    trigger,
  ])

  return {
    qualifyWizardOpen,
    lead,
    step,
    steps: QUALIFICATION_FORM_STEPS,
    form,
    values,
    errors,
    isDirty,
    isSubmitting,
    displayName,
    previewScore,
    formatRating: formatQualificationRating,
    next,
    back,
    submit,
    handleCancel,
    handleReset,
    handleClose: handleCancel,
    canQualify: lead ? canQualifyLead(lead.status) : false,
  }
}
