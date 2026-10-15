import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  CONVERSION_FORM_STEPS,
  createConvertDefaultValues,
  formatForecastCategory,
} from '@/features/lead-management/config/conversion-form.config'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import type { ConvertLeadResultDto } from '@/features/lead-management/domain/conversion.dto'
import {
  convertLeadSchema,
  convertLeadStepSchemas,
  type ConvertLeadInput,
} from '@/features/lead-management/domain/conversion.schema'
import { useConvertLead } from '@/features/lead-management/hooks/useConvertLead'
import {
  buildConversionRecord,
  buildConversionSummary,
  buildOpportunityFromConversion,
} from '@/features/lead-management/lib/conversion-record'
import {
  canConvertLead,
  leadConversionService,
} from '@/features/lead-management/services/lead-conversion.service'
import { formatStage } from '@/features/opportunity-management/lib/opportunity-workflow'
import { useUser } from '@/features/auth/hooks/useUser'

const stepSchemas = [
  convertLeadStepSchemas.basics,
  convertLeadStepSchemas.details,
  convertLeadStepSchemas.commercial,
]

export function useConvertLeadWizard() {
  const {
    convertWizardOpen,
    convertLeadId,
    closeConvertWizard,
    syncConvertedLead,
    leads,
  } = useLeadManagement()
  const { displayName } = useUser()
  const convertMutation = useConvertLead({ showToast: false })

  const lead = convertLeadId ? leads.find((l) => l.id === convertLeadId) : undefined
  const [step, setStep] = useState(0)
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null)
  const [canConvert, setCanConvert] = useState(false)

  const form = useForm<ConvertLeadInput>({
    resolver: zodResolver(convertLeadSchema),
    defaultValues: createConvertDefaultValues(),
    mode: 'onChange',
  })

  const { trigger, getValues, reset, watch, formState: { errors, isDirty } } = form
  const values = watch()
  const isSubmitting = convertMutation.isPending

  useEffect(() => {
    if (convertWizardOpen && lead) {
      reset(createConvertDefaultValues(lead))
      setStep(0)
    }
  }, [convertWizardOpen, lead, reset])

  useEffect(() => {
    if (!convertWizardOpen || !convertLeadId) {
      setCanConvert(false)
      setEligibilityMessage(null)
      return
    }

    let mounted = true
    void leadConversionService.canConvert(convertLeadId).then((result) => {
      if (!mounted) return
      setCanConvert(result.allowed)
      setEligibilityMessage(result.reason ?? null)
    })

    return () => {
      mounted = false
    }
  }, [convertWizardOpen, convertLeadId])

  const resetWizard = useCallback(() => {
    reset(createConvertDefaultValues(lead))
    setStep(0)
  }, [lead, reset])

  const handleCancel = useCallback(() => {
    if (isSubmitting) return
    closeConvertWizard()
    resetWizard()
  }, [closeConvertWizard, isSubmitting, resetWizard])

  const handleReset = useCallback(() => {
    if (isSubmitting) return
    resetWizard()
  }, [isSubmitting, resetWizard])

  const next = useCallback(async () => {
    const schema = stepSchemas[step]
    if (!schema) return
    const fields = Object.keys(schema.shape) as (keyof ConvertLeadInput)[]
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, CONVERSION_FORM_STEPS.length - 1))
  }, [step, trigger])

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const previewOpportunity = lead
    ? buildOpportunityFromConversion(values, lead, 'preview-opp')
    : null

  const previewConversion = lead
    ? buildConversionRecord(values, 'preview-opp', displayName)
    : null

  const submit = useCallback(async (): Promise<ConvertLeadResultDto | null> => {
    if (!lead || !convertLeadId) return null

    if (!canConvertLead(lead.status, lead.convertedOpportunityId)) {
      throw new Error('Only qualified leads that have not been converted can proceed')
    }

    const valid = await trigger()
    if (!valid) return null

    const data = getValues()
    const result = await convertMutation.mutateAsync({
      leadId: convertLeadId,
      input: { ...data, confirmed: true },
      convertedBy: displayName,
    })
    syncConvertedLead(result)
    closeConvertWizard()
    resetWizard()
    return result
  }, [
    closeConvertWizard,
    convertLeadId,
    convertMutation,
    displayName,
    getValues,
    lead,
    resetWizard,
    syncConvertedLead,
    trigger,
  ])

  return {
    convertWizardOpen,
    lead,
    step,
    steps: CONVERSION_FORM_STEPS,
    form,
    values,
    errors,
    isDirty,
    isSubmitting,
    displayName,
    previewOpportunity,
    previewConversion,
    formatStage,
    formatForecast: formatForecastCategory,
    buildSummary: buildConversionSummary,
    next,
    back,
    submit,
    handleCancel,
    handleReset,
    handleClose: handleCancel,
    canConvert,
    eligibilityMessage,
  }
}
