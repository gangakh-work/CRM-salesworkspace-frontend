import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import {
  CREATE_LEAD_DEFAULT_VALUES,
  LEAD_FORM_STEPS,
} from '@/features/lead-management/config/lead-form.config'

import {
  createLeadSchema,
  createLeadStepSchemas,
  type CreateLeadInput,
} from '@/features/lead-management/domain/lead.schema'

import type { CreateLeadResultDto } from '@/features/lead-management/domain/lead.dto'

import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'

import { useCreateLead } from '@/features/lead-management/hooks/useLeadQueries'

import { LeadApi } from '@/features/lead-management/api/LeadApi'

import { useUser } from '@/features/auth/hooks/useUser'

import {
  deleteLeadDraft,
  saveLeadDraft,
} from '@/features/lead-management/lib/lead-drafts'

const stepSchemas = [
  createLeadStepSchemas.customer,
  createLeadStepSchemas.company,
  createLeadStepSchemas.opportunity,
  createLeadStepSchemas.additional,
]

export function useCreateLeadWizard() {
  const {
    wizardOpen,
    draftToEdit,
    closeWizard,
    syncCreatedLead,
  } = useLeadManagement()

  const { displayName, email } = useUser()

  const navigate = useNavigate()

  const createLeadMutation = useCreateLead({
    showToast: false,
  })

  const [step, setStep] = useState(0)

  const [draftId, setDraftId] = useState<string | undefined>(
    undefined,
  )

  const [isExtractingDocument, setIsExtractingDocument] =
    useState(false)

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: CREATE_LEAD_DEFAULT_VALUES,
    mode: 'onChange',
  })

  const {
    trigger,
    getValues,
    reset,
    watch,
    formState: { errors, isDirty },
  } = form

  const values = watch()

  /*
   * When opening the wizard:
   *
   * - If a draft was selected -> load the draft
   * - Otherwise -> start a fresh Lead
   */
  useEffect(() => {
    if (!wizardOpen) return

    if (draftToEdit) {
      reset({
        ...CREATE_LEAD_DEFAULT_VALUES,
        ...draftToEdit.data,
      })

      setDraftId(draftToEdit.id)
      setStep(0)

      return
    }

    setDraftId(undefined)
    reset(CREATE_LEAD_DEFAULT_VALUES)
    setStep(0)
  }, [draftToEdit, reset, wizardOpen])

  const isSubmitting = createLeadMutation.isPending

  const resetWizard = useCallback(() => {
    reset(CREATE_LEAD_DEFAULT_VALUES)
    setStep(0)
    setDraftId(undefined)
  }, [reset])

  const handleCancel = useCallback(() => {
    if (isSubmitting) return

    closeWizard()
    resetWizard()
  }, [
    closeWizard,
    isSubmitting,
    resetWizard,
  ])

  const handleReset = useCallback(() => {
    if (isSubmitting) return

    resetWizard()
  }, [isSubmitting, resetWizard])

  const next = useCallback(async () => {
    const schema = stepSchemas[step]

    if (!schema) return

    const fields = Object.keys(
      schema.shape,
    ) as (keyof CreateLeadInput)[]

    const valid = await trigger(fields)

    if (valid) {
      setStep((s) =>
        Math.min(
          s + 1,
          LEAD_FORM_STEPS.length - 1,
        ),
      )
    }
  }, [step, trigger])

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  /*
   * Extract Lead information from:
   * - Email (.eml)
   * - PDF
   * - RFP PDF
   *
   * Existing values are preserved when the document
   * does not contain a particular field.
   */
  const extractDocument = useCallback(
    async (file: File) => {
      setIsExtractingDocument(true)

      try {
        const result =
          await LeadApi.extractLeadDocument(file)

        const extracted =
          result.extracted as Record<string, unknown>

        const current = getValues()

        const stringValue = (key: string) => {
          const value = extracted[key]

          if (typeof value === 'string') {
            return value
          }

          if (value == null) {
            return undefined
          }

          return String(value)
        }

        const numericValue = (key: string) => {
          const value = extracted[key]

          if (value == null || value === '') {
            return undefined
          }

          return String(value)
        }

        const nextValues: CreateLeadInput = {
          ...current,

          firstName:
            stringValue('firstName') ??
            current.firstName,

          lastName:
            stringValue('lastName') ??
            current.lastName,

          email:
            stringValue('email') ??
            current.email,

          phone:
            stringValue('phone') ??
            current.phone,

          title:
            stringValue('title') ??
            current.title,

          companyName:
            stringValue('companyName') ??
            current.companyName,

          industry:
            stringValue('industry') ??
            current.industry,

          country:
            stringValue('country') ??
            current.country,

          website:
            stringValue('website') ??
            current.website,

          employees:
            stringValue('employees') ??
            current.employees,

          opportunityName:
            stringValue('opportunityName') ??
            current.opportunityName,

          expectedRevenue:
            numericValue('expectedRevenue') ??
            current.expectedRevenue,

          budget:
            numericValue('budget') ??
            current.budget,

          closeDate:
            stringValue('closeDate') ??
            current.closeDate,

          source:
            stringValue('source') ??
            current.source,

          priority:
            ['high', 'medium', 'low'].includes(
              stringValue('priority') ?? '',
            )
              ? (stringValue(
                  'priority',
                ) as CreateLeadInput['priority'])
              : current.priority,

          description:
            stringValue('description') ??
            current.description,

          notes: [
            current.notes,
            `Source document: ${result.source_document}`,
            stringValue('notes'),
          ]
            .filter(Boolean)
            .join('\n'),
        }

        reset(nextValues)
        setStep(0)

        return result
      } finally {
        setIsExtractingDocument(false)
      }
    },
    [getValues, reset],
  )

  /*
   * Save current Lead form into localStorage.
   *
   * If draftId exists, the same draft is updated.
   * Otherwise, a new draft is created.
   */
  const saveDraft = useCallback(() => {
    const data = getValues()

    const hasContent = Object.values(data).some(
      (value) =>
        typeof value === 'string'
          ? value.trim().length > 0
          : Boolean(value),
    )

    if (!hasContent) {
      return null
    }

    const draft = saveLeadDraft(
      data,
      draftId,
      'lead-create-wizard',
    )

    setDraftId(draft.id)

    return draft
  }, [draftId, getValues])

  /*
   * Create Lead in Dataverse.
   *
   * Existing creation flow is preserved.
   *
   * If this Lead came from a draft, delete the draft
   * only after successful Dataverse creation.
   */
  const submit = useCallback(
    async (): Promise<CreateLeadResultDto | null> => {
      const valid = await trigger()

      if (!valid) {
        return null
      }

      const data = getValues()

      const result =
        await createLeadMutation.mutateAsync({
          input: data,
          owner: displayName,
          ownerEmail: email,
        })

      syncCreatedLead(result)

      if (draftId) {
        deleteLeadDraft(draftId)
      }

      resetWizard()
      closeWizard()

      navigate(
        `/workspace/leads/${result.lead.id}`,
      )

      return result
    },
    [
      closeWizard,
      createLeadMutation,
      displayName,
      email,
      draftId,
      getValues,
      navigate,
      resetWizard,
      syncCreatedLead,
      trigger,
    ],
  )

  return {
    wizardOpen,

    step,

    steps: LEAD_FORM_STEPS,

    form,

    values,

    errors,

    isDirty,

    isSubmitting,

    draftId,

    saveDraft,

    extractDocument,

    isExtractingDocument,

    displayName,

    next,

    back,

    submit,

    handleCancel,

    handleReset,

    handleClose: handleCancel,
  }
}