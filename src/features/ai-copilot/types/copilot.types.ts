import type { RecordCardData } from '@/components/patterns/RecordGallery'

export type { RecordCardData as AiRecordCard }

export type AiCopilotMode = 'docked' | 'floating' | 'fullscreen' | 'collapsed'

export type AiMessageRole = 'user' | 'assistant' | 'system'

export type AiMessageContentType = 'text' | 'markdown' | 'card' | 'table' | 'actions'

export interface AiMessageAction {
  id: string
  label: string
  variant?: 'primary' | 'outline'
  url?: string
}

export type AiFormFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'textarea'
  | 'select'
  | 'checkbox'

/** Select option. Plain strings are still accepted (value === label). */
export interface AiFormOption {
  value: string
  label: string
}

export interface AiFormField {
  name: string
  label: string
  type: AiFormFieldType
  required?: boolean
  placeholder?: string
  default?: string
  options?: Array<string | AiFormOption>
  /** Zero-based wizard step this field belongs to (stepped forms only). */
  step?: number
  /** Span both columns in the flat grid layout. */
  fullWidth?: boolean
  min?: number
  max?: number
  rows?: number
  /** Secondary line under a checkbox label. */
  helpText?: string
  /** Only show (and validate) the field when another field has this value. */
  showWhen?: { field: string; equals: string }
}

export interface AiFormReviewRow {
  label: string
  /** Field whose (display) value is shown. */
  field?: string
  /** Static value shown as-is. */
  value?: string
  /** currency → formatted with currencyField; percent → "n%"; count_yes → "n/N criteria". */
  format?: 'currency' | 'percent' | 'count_yes'
  currencyField?: string
  fields?: string[]
  maxLength?: number
  hideIfEmpty?: boolean
  /** Only show this row when another field has this value. */
  showWhen?: { field: string; equals: string }
}

export interface AiMessageForm {
  id: string
  title: string
  description?: string
  fields: AiFormField[]
  /** Rendered after "Step x of y: <step> · " like the CRM wizards. */
  subtitle?: string
  /** When present the form renders as the same multi-step wizard used in the CRM. */
  steps?: string[]
  /** Caption shown at the top of a step, keyed by step index. */
  stepDescriptions?: Record<string, string>
  review?: {
    title?: string
    rows: AiFormReviewRow[]
    note?: string
  }
  /** Mandatory confirmation checkbox on the review step. */
  confirmText?: string
  submitLabel?: string
  submittingLabel?: string
  submitVariant?: 'primary' | 'danger'
  /** Eligibility / warning message shown above the form (mirrors the wizard banner). */
  warning?: string
}

export interface AiMessageCard {
  title: string
  description: string
  badge?: string
  metadata?: Record<string, string>
}

export interface AiMessageTable {
  headers: string[]
  rows: string[][]
}

export interface AiMessage {
  id: string
  role: AiMessageRole
  content: string
  contentType?: AiMessageContentType
  card?: AiMessageCard
  table?: AiMessageTable
  actions?: AiMessageAction[]
  form?: AiMessageForm
  /** Visual record cards (gallery). */
  cards?: RecordCardData[]
  timestamp: string
  isStreaming?: boolean
  capability?: AiCapability
}

export type AiCapability =
  | 'ask'
  | 'generate_summary'
  | 'draft_email'
  | 'create_followup'
  | 'meeting_summary'
  | 'lead_summary'
  | 'customer_summary'
  | 'proposal_summary'
  | 'opportunity_insights'
  | 'pipeline_insights'
  | 'next_best_action'
  | 'risk_analysis'
  | 'task_suggestions'
  | 'win_probability'
  | 'missing_information'
  | 'suggest_stage'

export type AiContextEntityType =
  | 'page'
  | 'lead'
  | 'opportunity'
  | 'workflow'
  | 'customer'
  | 'proposal'
  | 'pipeline'

export interface AiPageContext {
  page: string
  pageLabel: string
  entityType?: AiContextEntityType
  entityId?: string
  entityName?: string
  metadata?: Record<string, string>
}

export interface AiConversation {
  id: string
  title: string
  messages: AiMessage[]
  context?: AiPageContext
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
  isPinned?: boolean
}

export interface AiSuggestedPrompt {
  id: string
  label: string
  prompt: string
  capability?: AiCapability
  pinned?: boolean
}

export interface AiCopilotState {
  mode: AiCopilotMode
  panelWidth: number
  isOpen: boolean
  isGenerating: boolean
  activeConversationId: string | null
  conversations: AiConversation[]
  pageContext: AiPageContext | null
}

export type FutureIntegration =
  | 'azure_openai'
  | 'ai_search'
  | 'power_automate'
  | 'dataverse'
  | 'sharepoint'
  | 'teams'
