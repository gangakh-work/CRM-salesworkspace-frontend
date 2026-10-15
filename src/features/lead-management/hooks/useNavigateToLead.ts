import { useNavigate } from 'react-router-dom'

import type { Lead } from '@/features/lead-management/types/lead.types'

export function useNavigateToLead() {
  const navigate = useNavigate()
  return (lead: Lead) => navigate(`/workspace/leads/${lead.id}`)
}
