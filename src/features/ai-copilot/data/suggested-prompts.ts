import type { AiSuggestedPrompt } from '@/features/ai-copilot/types/copilot.types'

export const DEFAULT_SUGGESTED_PROMPTS: AiSuggestedPrompt[] = [
  { id: 'summarize-lead', label: 'Summarize lead', prompt: 'Summarize this lead', capability: 'lead_summary' },
  {
    id: 'summarize-opp',
    label: 'Summarize opportunity',
    prompt: 'Summarize this opportunity',
    capability: 'opportunity_insights',
  },
  {
    id: 'follow-up-email',
    label: 'Draft email',
    prompt: 'Draft an email for this opportunity',
    capability: 'draft_email',
  },
  {
    id: 'meeting-notes',
    label: 'Meeting notes',
    prompt: 'Generate structured meeting notes from our last interaction',
    capability: 'meeting_summary',
  },
  {
    // Evidence-based health check (replaces an LLM-guessed win probability).
    id: 'health-check',
    label: 'Health check',
    prompt: 'How is this opportunity doing?',
    capability: 'risk_analysis',
  },
  {
    id: 'next-action',
    label: 'Next best action',
    prompt: 'What is the next best action?',
    capability: 'next_best_action',
  },
  {
    id: 'missing-info',
    label: 'Missing information',
    prompt: "What's missing in this opportunity?",
    capability: 'missing_information',
  },
  {
    id: 'suggest-stage',
    label: 'Suggest stage',
    prompt: 'Suggest the appropriate sales stage',
    capability: 'suggest_stage',
  },
  {
    id: 'suggested-tasks',
    label: 'My tasks',
    prompt: 'Show my tasks',
    capability: 'task_suggestions',
  },
]

export const PINNED_PROMPTS: AiSuggestedPrompt[] = [
  {
    id: 'risk',
    label: 'Risk analysis',
    prompt: 'What are the risks for this opportunity?',
    capability: 'risk_analysis',
    pinned: true,
  },
  {
    id: 'pipeline',
    label: 'Pipeline insights',
    prompt: 'Which opportunities need attention?',
    capability: 'pipeline_insights',
    pinned: true,
  },
]
