import { Wrench } from 'lucide-react'

import { EmptyState } from '@/components/global/EmptyState'
import { APP_NAME } from '@/config/constants'

export function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={Wrench}
        title="Under maintenance"
        description={`${APP_NAME} is temporarily unavailable while we perform scheduled maintenance. Please check back shortly.`}
      />
    </div>
  )
}
