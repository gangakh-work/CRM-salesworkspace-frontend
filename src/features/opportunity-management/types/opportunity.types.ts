export type OpportunityStage =
  | 'prospect'
  | 'qualification'
  | 'discovery'
  | 'proposal'
  | 'commercial_review'
  | 'negotiation'
  | 'legal_review'
  | 'won'
  | 'lost'

export type OpportunityPriority = 'high' | 'medium' | 'low'
export type OpportunityRisk = 'low' | 'medium' | 'high'
export type ForecastCategory = 'pipeline' | 'best_case' | 'commit' | 'closed' | 'omitted'
export type OpportunityStatus = 'open' | 'won' | 'lost'
export type OpportunityViewMode = 'table' | 'kanban' | 'pipeline' | 'timeline' | 'calendar' | 'forecast'
export type OpportunityGroupBy = 'none' | 'stage' | 'owner' | 'region' | 'industry' | 'priority'

export interface Opportunity {
  id: string
  name: string
  customer: string
  primaryContact: string
  contactEmail: string
  owner: string
  stage: OpportunityStage
  probability: number
  expectedRevenue: number
  forecastCategory: ForecastCategory
  closeDate: string
  region: string
  industry: string
  priority: OpportunityPriority
  risk: OpportunityRisk
  status: OpportunityStatus
  lastActivity: string
  kanbanColumn: string
  currency: string
  description?: string
  leadId?: string
  onHold?: boolean
  previousStage?: OpportunityStage
  stageUpdatedAt?: string
  stageUpdatedBy?: string
  locked?: boolean
  closedDate?: string
  finalRevenue?: number
  finalMargin?: number
  contractValue?: number
  decisionMaker?: string
  contractStartDate?: string
  contractEndDate?: string
  expectedKickoff?: string
  deliveryOwner?: string
  businessUnit?: string
  closedBy?: string
  lostDate?: string
  lostReason?: LostReason
  competitorName?: string
  competitorSolution?: string
  priceDifference?: string
  lostRemarks?: string
  willRevisit?: boolean
  followUpDate?: string
  followUpOwner?: string
  lostBy?: string
}

export type LostReason =
  | 'price_too_high'
  | 'lost_to_competitor'
  | 'budget_cancelled'
  | 'project_cancelled'
  | 'no_decision'
  | 'not_interested'
  | 'technical_mismatch'
  | 'timeline_changed'
  | 'internal_decision'
  | 'other'

export interface OpportunityCommercials {
  revenue: number
  cost: number
  margin: number
  discount: number
  currency: string
  forecast: ForecastCategory
}

export interface OpportunityProposal {
  id: string
  title: string
  version: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
  generatedDate: string
  value: number
  isCurrent?: boolean
}

export interface OpportunityContact {
  id: string
  name: string
  title: string
  email: string
  phone: string
  role: 'decision_maker' | 'influencer' | 'champion' | 'technical'
  isPrimary?: boolean
}

export interface OpportunityTimelineEvent {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  actor: string
}

export interface OpportunityActivity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'task'
  subject: string
  status: 'planned' | 'completed' | 'cancelled'
  dueDate?: string
  owner: string
  createdAt: string
}

export interface OpportunityStageHistoryEntry {
  id: string
  fromStage: OpportunityStage
  toStage: OpportunityStage
  transitionedAt: string
  transitionedBy: string
  notes?: string
}

export interface OpportunityStageAuditRecord {
  id: string
  action: 'stage_transition' | 'owner_assigned' | 'on_hold' | 'off_hold' | 'duplicate' | 'activity_added' | 'closed_won' | 'closed_lost'
  fromStage?: OpportunityStage
  toStage?: OpportunityStage
  updatedAt: string
  updatedBy: string
  details?: string
}

export interface OpportunityExtras {
  timeline: OpportunityTimelineEvent[]
  activities: OpportunityActivity[]
  contacts: OpportunityContact[]
  notes: { id: string; content: string; author: string; createdAt: string }[]
  documents: { id: string; name: string; size: string; uploadedAt: string }[]
  meetings: { id: string; title: string; scheduledAt: string; status: string }[]
  emails: { id: string; subject: string; preview: string; sentAt: string; direction: 'inbound' | 'outbound' }[]
  commercials: OpportunityCommercials
  proposals: OpportunityProposal[]
  stageHistory: OpportunityStageHistoryEntry[]
  auditRecords: OpportunityStageAuditRecord[]
  lostAnalysis?: OpportunityLostAnalysis
}

export interface OpportunityLostAnalysis {
  reason: LostReason
  reasonLabel: string
  competitorName?: string
  competitorSolution?: string
  priceDifference?: string
  remarks?: string
  willRevisit: boolean
  followUpDate?: string
  followUpOwner?: string
  lostRevenue: number
  industry: string
  region: string
}

export interface OpportunityFilters {
  stage: OpportunityStage[]
  priority: OpportunityPriority[]
  region: string[]
  industry: string[]
  owner: string[]
  forecastCategory: ForecastCategory[]
  risk: OpportunityRisk[]
  status: OpportunityStatus[]
}

export interface OpportunityColumnDef {
  id: keyof Opportunity | 'select'
  label: string
  defaultVisible: boolean
  minWidth: number
  sortable?: boolean
}

export interface SavedOpportunityView {
  id: string
  name: string
  filters: OpportunityFilters
  groupBy: OpportunityGroupBy
  sortColumn: string
  sortDirection: 'asc' | 'desc'
}

export interface ForecastMetrics {
  quarterRevenue: number
  pipelineValue: number
  weightedRevenue: number
  expectedRevenue: number
  forecastAccuracy: number
  quarterLabel: string
  averageWinProbability: number
}

export interface StageDistributionEntry {
  stage: OpportunityStage
  label: string
  count: number
  value: number
  weightedValue: number
}

export type { ConfirmDialogState } from '@/types/confirm-dialog.types'

export const DEFAULT_OPPORTUNITY_FILTERS: OpportunityFilters = {
  stage: [],
  priority: [],
  region: [],
  industry: [],
  owner: [],
  forecastCategory: [],
  risk: [],
  status: [],
}

export const OPPORTUNITY_COLUMNS: OpportunityColumnDef[] = [
  { id: 'select', label: '', defaultVisible: true, minWidth: 48 },
  { id: 'name', label: 'Opportunity Name', defaultVisible: true, minWidth: 200, sortable: true },
  { id: 'customer', label: 'Customer', defaultVisible: true, minWidth: 160, sortable: true },
  { id: 'primaryContact', label: 'Primary Contact', defaultVisible: true, minWidth: 150, sortable: true },
  { id: 'owner', label: 'Owner', defaultVisible: true, minWidth: 130, sortable: true },
  { id: 'stage', label: 'Sales Stage', defaultVisible: true, minWidth: 130, sortable: true },
  { id: 'probability', label: 'Probability', defaultVisible: true, minWidth: 100, sortable: true },
  { id: 'expectedRevenue', label: 'Expected Revenue', defaultVisible: true, minWidth: 140, sortable: true },
  { id: 'forecastCategory', label: 'Forecast Category', defaultVisible: true, minWidth: 140, sortable: true },
  { id: 'closeDate', label: 'Close Date', defaultVisible: true, minWidth: 120, sortable: true },
  { id: 'region', label: 'Region', defaultVisible: true, minWidth: 110, sortable: true },
  { id: 'industry', label: 'Industry', defaultVisible: true, minWidth: 130, sortable: true },
  { id: 'priority', label: 'Priority', defaultVisible: true, minWidth: 90, sortable: true },
  { id: 'risk', label: 'Risk', defaultVisible: true, minWidth: 80, sortable: true },
  { id: 'status', label: 'Status', defaultVisible: true, minWidth: 90, sortable: true },
  { id: 'lastActivity', label: 'Last Activity', defaultVisible: true, minWidth: 120, sortable: true },
]

export const PIPELINE_KANBAN_COLUMNS = [
  'Prospect',
  'Qualification',
  'Discovery',
  'Proposal Submitted',
  'Commercial Review',
  'Negotiation',
  'Contract Review',
  'Won',
  'Lost',
] as const
