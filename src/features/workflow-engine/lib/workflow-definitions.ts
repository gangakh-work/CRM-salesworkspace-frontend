import type {
  WorkflowAction,
  WorkflowTemplate,
  WorkflowTemplateId,
} from '@/features/workflow-engine/types/workflow.types'

export const REUSABLE_ACTIONS: WorkflowAction[] = [
  { id: 'send_email', label: 'Send Email', reusable: true },
  { id: 'schedule_meeting', label: 'Schedule Meeting', reusable: true },
  { id: 'create_task', label: 'Create Task', reusable: true },
  { id: 'assign_owner', label: 'Assign Owner', reusable: true },
  { id: 'update_status', label: 'Update Status', reusable: true },
  { id: 'generate_document', label: 'Generate Document', reusable: true },
  { id: 'notify_team', label: 'Notify Team', reusable: true },
  { id: 'request_approval', label: 'Request Approval', reusable: true },
  { id: 'log_activity', label: 'Log Activity', reusable: true },
  { id: 'create_record', label: 'Create Record', reusable: true },
]

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'lead_creation',
    name: 'Lead Creation',
    description: 'Standard intake workflow for new inbound and outbound leads.',
    category: 'lead',
    reusableActions: ['create_record', 'assign_owner', 'send_email', 'notify_team'],
    steps: [
      { id: 'lc-1', name: 'Capture Lead Data', description: 'Enter contact, company, and source details.', type: 'action', ownerRole: 'Sales Rep', actions: ['create_record'] },
      { id: 'lc-2', name: 'Validate Contact Info', description: 'Verify email, phone, and company match.', type: 'checklist', ownerRole: 'Sales Rep', checklistItems: ['Email verified', 'Phone verified', 'Company exists in CRM'] },
      { id: 'lc-3', name: 'Assign Owner', description: 'Route lead to territory owner.', type: 'action', ownerRole: 'Sales Manager', actions: ['assign_owner', 'notify_team'] },
      { id: 'lc-4', name: 'Send Welcome Email', description: 'Trigger initial outreach email.', type: 'notification', ownerRole: 'System', actions: ['send_email'] },
      { id: 'lc-5', name: 'Create Follow-up Task', description: 'Schedule first contact within 24 hours.', type: 'action', ownerRole: 'Sales Rep', actions: ['create_task'] },
    ],
  },
  {
    id: 'lead_qualification',
    name: 'Lead Qualification',
    description: 'BANT qualification and scoring workflow for sales-ready leads.',
    category: 'lead',
    reusableActions: ['update_status', 'log_activity', 'create_task'],
    steps: [
      { id: 'lq-1', name: 'Discovery Call', description: 'Conduct initial discovery with prospect.', type: 'action', ownerRole: 'Sales Rep', actions: ['log_activity', 'schedule_meeting'] },
      { id: 'lq-2', name: 'BANT Assessment', description: 'Evaluate Budget, Authority, Need, Timeline.', type: 'checklist', ownerRole: 'Sales Rep', checklistItems: ['Budget confirmed', 'Decision maker identified', 'Need validated', 'Timeline established'] },
      { id: 'lq-3', name: 'Score Lead', description: 'Apply lead scoring model.', type: 'decision', ownerRole: 'Sales Rep', decisionBranches: [
        { id: 'lq-3-yes', label: 'Qualified (Score ≥ 70)', nextStepId: 'lq-4' },
        { id: 'lq-3-no', label: 'Not Qualified', nextStepId: 'lq-6' },
      ] },
      { id: 'lq-4', name: 'Manager Review', description: 'Sales manager validates qualification.', type: 'approval', ownerRole: 'Sales Manager', approvers: ['James Wilson', 'Sarah Chen'], requiredApprovals: 1 },
      { id: 'lq-5', name: 'Mark Qualified', description: 'Update lead status to Qualified.', type: 'action', ownerRole: 'System', actions: ['update_status', 'notify_team'] },
      { id: 'lq-6', name: 'Disqualify Lead', description: 'Move lead to nurture or disqualified.', type: 'action', ownerRole: 'Sales Rep', actions: ['update_status', 'send_email'], optional: true },
    ],
  },
  {
    id: 'opportunity_creation',
    name: 'Opportunity Creation',
    description: 'Convert qualified lead to opportunity with commercial baseline.',
    category: 'opportunity',
    reusableActions: ['create_record', 'assign_owner', 'generate_document'],
    steps: [
      { id: 'oc-1', name: 'Review Lead Data', description: 'Confirm lead qualification and history.', type: 'action', ownerRole: 'Sales Rep' },
      { id: 'oc-2', name: 'Define Opportunity Scope', description: 'Set products, services, and estimated value.', type: 'checklist', ownerRole: 'Sales Rep', checklistItems: ['Products identified', 'Estimated value set', 'Close date estimated', 'Competitors noted'] },
      { id: 'oc-3', name: 'Create Opportunity', description: 'Generate opportunity record in pipeline.', type: 'action', ownerRole: 'System', actions: ['create_record', 'assign_owner'] },
      { id: 'oc-4', name: 'Commercial Baseline', description: 'Set initial revenue and margin targets.', type: 'action', ownerRole: 'Sales Rep', actions: ['generate_document'] },
      { id: 'oc-5', name: 'Notify Stakeholders', description: 'Alert account team and manager.', type: 'notification', ownerRole: 'System', actions: ['notify_team', 'send_email'] },
    ],
  },
  {
    id: 'proposal_review',
    name: 'Proposal Review',
    description: 'Internal review cycle before proposal is sent to customer.',
    category: 'proposal',
    reusableActions: ['generate_document', 'request_approval', 'send_email'],
    steps: [
      { id: 'pr-1', name: 'Draft Proposal', description: 'Generate proposal from template.', type: 'action', ownerRole: 'Sales Rep', actions: ['generate_document'] },
      { id: 'pr-2', name: 'Technical Review', description: 'Solution architect validates scope.', type: 'approval', ownerRole: 'Solution Architect', approvers: ['Emily Park'], requiredApprovals: 1 },
      { id: 'pr-3', name: 'Pricing Review', description: 'Finance validates pricing and discounts.', type: 'approval', ownerRole: 'Finance', approvers: ['David Park'], requiredApprovals: 1 },
      { id: 'pr-4', name: 'Legal Review', description: 'Legal reviews terms and conditions.', type: 'approval', ownerRole: 'Legal', approvers: ['Susan Calvin'], requiredApprovals: 1, conditions: [{ id: 'c1', field: 'value', operator: 'greater_than', value: 100000, label: 'Deal value > $100K' }] },
      { id: 'pr-5', name: 'Final Approval', description: 'Sales director sign-off.', type: 'approval', ownerRole: 'Sales Director', approvers: ['James Wilson'], requiredApprovals: 1 },
      { id: 'pr-6', name: 'Ready to Send', description: 'Proposal approved for customer delivery.', type: 'notification', ownerRole: 'System', actions: ['notify_team'] },
    ],
  },
  {
    id: 'proposal_approval',
    name: 'Proposal Approval',
    description: 'Customer-side approval tracking and negotiation workflow.',
    category: 'proposal',
    reusableActions: ['send_email', 'log_activity', 'update_status'],
    steps: [
      { id: 'pa-1', name: 'Send to Customer', description: 'Deliver proposal via secure link.', type: 'action', ownerRole: 'Sales Rep', actions: ['send_email'] },
      { id: 'pa-2', name: 'Track Customer View', description: 'Monitor proposal open and view events.', type: 'notification', ownerRole: 'System' },
      { id: 'pa-3', name: 'Customer Decision', description: 'Await customer accept, reject, or negotiate.', type: 'decision', ownerRole: 'Customer', decisionBranches: [
        { id: 'pa-3-accept', label: 'Accepted', nextStepId: 'pa-5' },
        { id: 'pa-3-negotiate', label: 'Negotiate', nextStepId: 'pa-4' },
        { id: 'pa-3-reject', label: 'Rejected', nextStepId: 'pa-6' },
      ] },
      { id: 'pa-4', name: 'Negotiation', description: 'Revise terms and resubmit.', type: 'action', ownerRole: 'Sales Rep', actions: ['generate_document', 'send_email'] },
      { id: 'pa-5', name: 'Record Acceptance', description: 'Update opportunity to negotiation stage.', type: 'action', ownerRole: 'Sales Rep', actions: ['update_status', 'log_activity'] },
      { id: 'pa-6', name: 'Handle Rejection', description: 'Document feedback and next steps.', type: 'action', ownerRole: 'Sales Rep', actions: ['log_activity', 'create_task'], optional: true },
    ],
  },
  {
    id: 'commercial_review',
    name: 'Commercial Review',
    description: 'Margin, discount, and pricing approval for enterprise deals.',
    category: 'commercial',
    reusableActions: ['request_approval', 'generate_document', 'notify_team'],
    steps: [
      { id: 'cr-1', name: 'Submit Commercials', description: 'Enter revenue, cost, margin, and discount.', type: 'action', ownerRole: 'Sales Rep' },
      { id: 'cr-2', name: 'Margin Check', description: 'Validate margin meets threshold.', type: 'decision', ownerRole: 'System', conditions: [{ id: 'c2', field: 'margin', operator: 'greater_than', value: 25, label: 'Margin ≥ 25%' }], decisionBranches: [
        { id: 'cr-2-pass', label: 'Margin OK', nextStepId: 'cr-4' },
        { id: 'cr-2-fail', label: 'Below Threshold', nextStepId: 'cr-3' },
      ] },
      { id: 'cr-3', name: 'VP Commercial Approval', description: 'VP approves below-threshold margin.', type: 'approval', ownerRole: 'VP Sales', approvers: ['James Wilson'], requiredApprovals: 1 },
      { id: 'cr-4', name: 'Finance Sign-off', description: 'CFO validates commercial terms.', type: 'approval', ownerRole: 'Finance', approvers: ['David Park'], requiredApprovals: 1 },
      { id: 'cr-5', name: 'Commercial Approved', description: 'Deal cleared for contract generation.', type: 'notification', ownerRole: 'System', actions: ['notify_team', 'generate_document'] },
    ],
  },
  {
    id: 'won_process',
    name: 'Won Process',
    description: 'Post-win onboarding, handoff, and revenue recognition.',
    category: 'opportunity',
    reusableActions: ['update_status', 'notify_team', 'create_task', 'generate_document'],
    steps: [
      { id: 'wp-1', name: 'Confirm Win', description: 'Validate signed contract and PO.', type: 'checklist', ownerRole: 'Sales Rep', checklistItems: ['Contract signed', 'PO received', 'Start date confirmed'] },
      { id: 'wp-2', name: 'Update CRM', description: 'Mark opportunity as Won.', type: 'action', ownerRole: 'System', actions: ['update_status'] },
      { id: 'wp-3', name: 'Handoff to Delivery', description: 'Transfer to customer success / delivery team.', type: 'action', ownerRole: 'Sales Rep', actions: ['notify_team', 'create_task'] },
      { id: 'wp-4', name: 'Revenue Recognition', description: 'Finance processes revenue booking.', type: 'approval', ownerRole: 'Finance', approvers: ['David Park'], requiredApprovals: 1 },
      { id: 'wp-5', name: 'Celebrate Win', description: 'Notify team and update forecast.', type: 'notification', ownerRole: 'System', actions: ['notify_team', 'send_email'] },
    ],
  },
  {
    id: 'lost_process',
    name: 'Lost Process',
    description: 'Structured close-lost with win/loss analysis and follow-up.',
    category: 'opportunity',
    reusableActions: ['update_status', 'log_activity', 'create_task'],
    steps: [
      { id: 'lp-1', name: 'Document Loss Reason', description: 'Capture primary and secondary loss reasons.', type: 'action', ownerRole: 'Sales Rep', actions: ['log_activity'] },
      { id: 'lp-2', name: 'Win/Loss Analysis', description: 'Complete competitive analysis form.', type: 'checklist', ownerRole: 'Sales Rep', checklistItems: ['Loss reason selected', 'Competitor identified', 'Lessons learned documented'] },
      { id: 'lp-3', name: 'Manager Review', description: 'Manager validates loss documentation.', type: 'approval', ownerRole: 'Sales Manager', approvers: ['Sarah Chen'], requiredApprovals: 1 },
      { id: 'lp-4', name: 'Close Opportunity', description: 'Mark opportunity as Lost in CRM.', type: 'action', ownerRole: 'System', actions: ['update_status'] },
      { id: 'lp-5', name: 'Schedule Re-engagement', description: 'Optional nurture follow-up in 6 months.', type: 'action', ownerRole: 'Sales Rep', actions: ['create_task', 'send_email'], optional: true },
    ],
  },
  {
    id: 'customer_follow_up',
    name: 'Customer Follow-up',
    description: 'Structured post-sale and mid-cycle customer engagement.',
    category: 'customer',
    reusableActions: ['send_email', 'schedule_meeting', 'log_activity', 'create_task'],
    steps: [
      { id: 'cf-1', name: 'Identify Trigger', description: 'Renewal, QBR, or health score trigger.', type: 'decision', ownerRole: 'Customer Success', decisionBranches: [
        { id: 'cf-1-renewal', label: 'Renewal Due', nextStepId: 'cf-2' },
        { id: 'cf-1-qbr', label: 'QBR Scheduled', nextStepId: 'cf-3' },
        { id: 'cf-1-health', label: 'Health Alert', nextStepId: 'cf-4' },
      ] },
      { id: 'cf-2', name: 'Renewal Outreach', description: 'Initiate renewal conversation.', type: 'action', ownerRole: 'Account Manager', actions: ['send_email', 'schedule_meeting'] },
      { id: 'cf-3', name: 'Prepare QBR', description: 'Compile usage metrics and success stories.', type: 'checklist', ownerRole: 'Customer Success', checklistItems: ['Usage report ready', 'Success metrics compiled', 'Action items from last QBR reviewed'] },
      { id: 'cf-4', name: 'Health Recovery Plan', description: 'Address at-risk account signals.', type: 'action', ownerRole: 'Customer Success', actions: ['create_task', 'notify_team'] },
      { id: 'cf-5', name: 'Log Engagement', description: 'Record outcome and next steps.', type: 'action', ownerRole: 'Account Manager', actions: ['log_activity'] },
    ],
  },
  {
    id: 'meeting_preparation',
    name: 'Meeting Preparation',
    description: 'Pre-meeting checklist and briefing for executive engagements.',
    category: 'meeting',
    reusableActions: ['generate_document', 'send_email', 'create_task', 'schedule_meeting'],
    steps: [
      { id: 'mp-1', name: 'Confirm Attendees', description: 'Validate internal and external participants.', type: 'checklist', ownerRole: 'Sales Rep', checklistItems: ['Internal attendees confirmed', 'Customer attendees confirmed', 'Calendar invite sent'] },
      { id: 'mp-2', name: 'Research Account', description: 'Review account history, news, and stakeholders.', type: 'action', ownerRole: 'Sales Rep', actions: ['log_activity'] },
      { id: 'mp-3', name: 'Prepare Agenda', description: 'Draft meeting agenda and objectives.', type: 'action', ownerRole: 'Sales Rep', actions: ['generate_document'] },
      { id: 'mp-4', name: 'Briefing Pack', description: 'Compile slides, demo, and talking points.', type: 'checklist', ownerRole: 'Sales Rep', checklistItems: ['Presentation ready', 'Demo environment tested', 'Objection handling prepared'] },
      { id: 'mp-5', name: 'Pre-meeting Sync', description: 'Internal alignment call 30 min before.', type: 'action', ownerRole: 'Sales Manager', actions: ['schedule_meeting', 'notify_team'] },
      { id: 'mp-6', name: 'Send Reminder', description: 'Customer reminder with agenda link.', type: 'notification', ownerRole: 'System', actions: ['send_email'] },
    ],
  },
]

export function getTemplate(id: WorkflowTemplateId): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id)
}

export function getTemplateLabel(id: WorkflowTemplateId): string {
  return getTemplate(id)?.name ?? id
}

export function getAction(id: string): WorkflowAction | undefined {
  return REUSABLE_ACTIONS.find((a) => a.id === id)
}
