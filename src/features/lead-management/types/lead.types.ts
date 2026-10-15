export type LeadWorkflowStatus =
  | 'draft'
  | 'assigned'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiation'
  | 'converted'
  | 'disqualified'

export type LeadPriority = 'high' | 'medium' | 'low'
export type LeadViewMode = 'table' | 'kanban' | 'cards' | 'timeline'
export type LeadGroupBy = 'none' | 'status' | 'owner' | 'industry' | 'priority'

export type TimelineEventType =
  | 'lead_created'
  | 'email_sent'
  | 'meeting_scheduled'
  | 'status_changed'
  | 'owner_changed'
  | 'note_added'
  | 'call_logged'
  | 'task_created'
  | 'task_completed'
  | 'proposal_sent'
  | 'converted'
  | 'disqualified'
  | 'lead_qualified'
  | 'disqualification_reason'
  | 'follow_up_scheduled'
  | 'opportunity_created'
  | 'owner_assigned'

export type ActivityType = 'call' | 'email' | 'meeting' | 'task'

export interface LeadTimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description: string
  timestamp: string
  actor: string
  metadata?: Record<string, string>
}

export interface LeadActivity {
  id: string
  type: ActivityType
  subject: string
  description?: string
  dueDate?: string
  status: 'planned' | 'completed' | 'cancelled'
  owner: string
  createdAt: string
}

export interface LeadNote {
  id: string
  content: string
  author: string
  createdAt: string
}

export interface LeadAttachment {
  id: string
  name: string
  size: string
  uploadedBy: string
  uploadedAt: string
  type?: 'pdf' | 'doc' | 'xlsx' | 'pptx' | 'image' | 'other'
}

export interface LeadMeeting {
  id: string
  title: string
  scheduledAt: string
  duration: string
  status: 'scheduled' | 'completed' | 'cancelled'
  attendees: string
}

export interface LeadEmail {
  id: string
  subject: string
  preview: string
  direction: 'inbound' | 'outbound'
  sentAt: string
  status: 'sent' | 'draft' | 'received'
}

export type LeadQualificationRating = 'hot' | 'warm' | 'cold'

export type DisqualificationReason =
  | 'budget_constraints'
  | 'no_business_need'
  | 'lost_to_competitor'
  | 'duplicate_lead'
  | 'invalid_contact'
  | 'no_response'
  | 'project_cancelled'
  | 'other'

export type RevisitAfterDays = 30 | 60 | 90 | 180

export interface LeadDisqualificationData {
  reason: DisqualificationReason
  remarks?: string
  competitorName?: string
  scheduleFollowUp: boolean
  revisitAfterDays?: RevisitAfterDays
  followUpOwner?: string
  followUpDate?: string
  disqualifiedAt: string
  disqualifiedBy: string
}

export interface LeadConversionData {
  opportunityId: string
  opportunityName: string
  convertedAt: string
  convertedBy: string
  expectedRevenue: number
  salesStage: string
  region: string
  businessUnit: string
  currency: string
  expectedMargin: number
}

export interface LeadQualificationData {
  productsInterested: string
  expectedRevenue: number
  priority: LeadPriority
  budgetRange: string
  buyingTimeline: string
  decisionMaker: string
  competitors?: string
  needConfirmed: boolean
  budgetConfirmed: boolean
  authorityConfirmed: boolean
  timelineConfirmed: boolean
  painPoints: string
  qualificationScore: number
  qualificationRating: LeadQualificationRating
  qualifiedAt: string
  qualifiedBy: string
}

export interface LeadExtras {
  timeline: LeadTimelineEvent[]
  activities: LeadActivity[]
  notes: LeadNote[]
  attachments: LeadAttachment[]
  meetings: LeadMeeting[]
  emails: LeadEmail[]
  qualification?: LeadQualificationData
  disqualification?: LeadDisqualificationData
  conversion?: LeadConversionData
}

export interface Lead {
  id: string
  name: string
  company: string
  industry: string
  country: string
  owner: string
  source: string
  priority: LeadPriority
  score: number
  status: LeadWorkflowStatus
  budget?: number
  expectedRevenue?: number
  createdDate: string
  lastActivity: string
  nextFollowUp: string
  email: string
  phone: string
  title: string
  description?: string
  kanbanColumn: string
  convertedOpportunityId?: string
  website?: string
  employees?: string
  opportunityName?: string
  closeDate?: string
  qualifiedDate?: string
  qualifiedBy?: string
  qualificationScore?: number
  qualificationRating?: LeadQualificationRating
  disqualifiedDate?: string
  disqualifiedBy?: string
  disqualificationReason?: DisqualificationReason
  convertedDate?: string
  convertedBy?: string
}

export interface LeadColumnDef {
  id: keyof Lead | 'select' | 'actions'
  label: string
  defaultVisible: boolean
  minWidth: number
  sortable?: boolean
}

export interface SavedView {
  id: string
  name: string
  filters: LeadFilters
  groupBy: LeadGroupBy
  sortColumn: string
  sortDirection: 'asc' | 'desc'
}

export interface LeadFilters {
  status: LeadWorkflowStatus[]
  priority: LeadPriority[]
  industry: string[]
  country: string[]
  owner: string[]
  source: string[]
  scoreMin: number
  scoreMax: number
}

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  status: [],
  priority: [],
  industry: [],
  country: [],
  owner: [],
  source: [],
  scoreMin: 0,
  scoreMax: 100,
}

export const LEAD_COLUMNS: LeadColumnDef[] = [
  { id: 'select', label: '', defaultVisible: true, minWidth: 48 },
  { id: 'name', label: 'Lead Name', defaultVisible: true, minWidth: 180, sortable: true },
  { id: 'company', label: 'Company', defaultVisible: true, minWidth: 160, sortable: true },
  { id: 'industry', label: 'Industry', defaultVisible: true, minWidth: 130, sortable: true },
  { id: 'country', label: 'Country', defaultVisible: true, minWidth: 110, sortable: true },
  { id: 'owner', label: 'Owner', defaultVisible: true, minWidth: 130, sortable: true },
  { id: 'source', label: 'Lead Source', defaultVisible: true, minWidth: 120, sortable: true },
  { id: 'priority', label: 'Priority', defaultVisible: true, minWidth: 90, sortable: true },
  { id: 'score', label: 'Lead Score', defaultVisible: true, minWidth: 100, sortable: true },
  { id: 'status', label: 'Status', defaultVisible: true, minWidth: 130, sortable: true },
  { id: 'budget', label: 'Budget', defaultVisible: true, minWidth: 100, sortable: true },
  { id: 'expectedRevenue', label: 'Expected Revenue', defaultVisible: true, minWidth: 140, sortable: true },
  { id: 'createdDate', label: 'Created Date', defaultVisible: true, minWidth: 120, sortable: true },
  { id: 'lastActivity', label: 'Last Activity', defaultVisible: true, minWidth: 120, sortable: true },
  { id: 'nextFollowUp', label: 'Next Follow-up', defaultVisible: true, minWidth: 130, sortable: true },
]

export const WORKFLOW_KANBAN_COLUMNS = [
  'Draft',
  'Assigned',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Converted',
  'Disqualified',
] as const

export const KANBAN_COLUMNS = WORKFLOW_KANBAN_COLUMNS

export interface CreateLeadFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  title: string
  companyName: string
  industry: string
  country: string
  website: string
  employees: string
  opportunityName: string
  expectedRevenue: string
  budget: string
  closeDate: string
  source: string
  priority: LeadPriority
  description: string
  notes: string
}

export type { ConfirmDialogState } from '@/types/confirm-dialog.types'

export type LeadRiskLevel = 'low' | 'medium' | 'high'

export interface Lead360Profile {
  healthScore: number
  riskLevel: LeadRiskLevel
  riskReason: string
  linkedInUrl?: string
  website?: string
  employeeCount?: string
  location: string
}

export interface RelatedOpportunity {
  id: string
  name: string
  stage: string
  value: number
  closeDate: string
  probability: number
}

export interface ProposalHistoryItem {
  id: string
  title: string
  version: string
  sentDate: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
  value: number
}

export interface Lead360AiInsight {
  id: string
  type: 'action' | 'risk' | 'followup' | 'summary' | 'insight'
  title: string
  description: string
  confidence?: number
}
