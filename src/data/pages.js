/* sidebar order; `low` items sit in the group pinned to the bottom */
export const PAGES = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'inbox', label: 'Inbox', icon: 'chat' },
  { id: 'assistant', label: 'AI Assistant', icon: 'sparkle' },
  { id: 'leads', label: 'Leads', icon: 'target' },
  { id: 'opportunities', label: 'Opportunities', icon: 'pipeline' },
  { id: 'contacts', label: 'Contacts', icon: 'users' },
  { id: 'companies', label: 'Companies', icon: 'building' },
  { id: 'tasks', label: 'Tasks', icon: 'task' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'conversation-insights', label: 'Conversation Insights', icon: 'chart' },
  { id: 'integrations', label: 'Integrations', icon: 'apps' },
  { id: 'support', label: 'Support', icon: 'help', low: true },
]
