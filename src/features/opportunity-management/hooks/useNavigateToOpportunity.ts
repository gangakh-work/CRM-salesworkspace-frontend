import { useNavigate } from 'react-router-dom'

import type { Opportunity } from '@/features/opportunity-management/types/opportunity.types'

export function useNavigateToOpportunity() {
  const navigate = useNavigate()
  return (opp: Opportunity | { id: string }) => navigate(`/workspace/opportunities/${opp.id}`)
}
