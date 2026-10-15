import { Route, Routes } from 'react-router-dom'

import { ManagementConfirmDialog } from '@/components/patterns/ManagementConfirmDialog'
import { CreateLeadWizard } from '@/features/lead-management/components/CreateLeadWizard'
import { QualifyLeadWizard } from '@/features/lead-management/components/QualifyLeadWizard'
import { DisqualifyLeadWizard } from '@/features/lead-management/components/DisqualifyLeadWizard'
import { ConvertLeadWizard } from '@/features/lead-management/components/ConvertLeadWizard'
import {
  LeadManagementProvider,
  useLeadManagement,
} from '@/features/lead-management/context/LeadManagementProvider'
import { Lead360Page } from '@/features/lead-management/pages/Lead360Page'
import { LeadManagementListPage } from '@/features/lead-management/pages/LeadManagementListPage'

function LeadConfirmDialog() {
  const {
    confirmDialog,
    hideConfirm,
  } = useLeadManagement()

  return (
    <ManagementConfirmDialog
      confirmDialog={confirmDialog}
      hideConfirm={hideConfirm}
    />
  )
}

export function LeadsModule() {
  return (
    <LeadManagementProvider>
      <Routes>
        <Route
          index
          element={<LeadManagementListPage />}
        />

        <Route
          path=":id"
          element={<Lead360Page />}
        />
      </Routes>

      <CreateLeadWizard />
      <QualifyLeadWizard />
      <DisqualifyLeadWizard />
      <ConvertLeadWizard />
      <LeadConfirmDialog />
    </LeadManagementProvider>
  )
}