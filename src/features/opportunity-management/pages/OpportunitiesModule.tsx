import { Route, Routes } from 'react-router-dom'

import { ManagementConfirmDialog } from '@/components/patterns/ManagementConfirmDialog'
import { CloseOpportunityLostWizard } from '@/features/opportunity-management/components/CloseOpportunityLostWizard'
import { CloseOpportunityWonWizard } from '@/features/opportunity-management/components/CloseOpportunityWonWizard'
import { CreateOpportunityWizard } from '@/features/opportunity-management/components/CreateOpportunityWizard'
import {
  OpportunityManagementProvider,
  useOpportunityManagement,
} from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { Opportunity360Page } from '@/features/opportunity-management/pages/Opportunity360Page'
import { OpportunityManagementListPage } from '@/features/opportunity-management/pages/OpportunityManagementListPage'

function OpportunityConfirmDialog() {
  const { confirmDialog, hideConfirm } = useOpportunityManagement()
  return <ManagementConfirmDialog confirmDialog={confirmDialog} hideConfirm={hideConfirm} />
}

export function OpportunitiesModule() {
  return (
    <OpportunityManagementProvider>
      <Routes>
        <Route index element={<OpportunityManagementListPage />} />
        <Route path=":id" element={<Opportunity360Page />} />
      </Routes>
      <OpportunityConfirmDialog />
      <CreateOpportunityWizard />
      <CloseOpportunityWonWizard />
      <CloseOpportunityLostWizard />
    </OpportunityManagementProvider>
  )
}
