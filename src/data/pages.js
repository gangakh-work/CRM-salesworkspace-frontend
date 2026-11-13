/* sidebar order; `low` items sit in the group pinned to the bottom */
export const PAGES = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'assistant', label: 'AI Assistant', icon: 'sparkle' },
  { id: 'leads', label: 'Leads', icon: 'target' },
  { id: 'opportunities', label: 'Opportunities', icon: 'pipeline' },
  { id: 'contacts', label: 'Contacts', icon: 'users' },
  { id: 'companies', label: 'Companies', icon: 'building' },
  { id: 'tasks', label: 'Tasks', icon: 'task' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'support', label: 'Support', icon: 'help', low: true },
]
