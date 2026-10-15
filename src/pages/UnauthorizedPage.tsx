import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/global/EmptyState'
import { Button } from '@/components/ui/button'
import { routeMeta } from '@/config/routes'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={ShieldAlert}
        title="Unauthorized"
        description="You do not have permission to access this resource. Contact your administrator if you believe this is an error."
        action={
          <Button asChild variant="outline">
            <Link to={routeMeta.defaultRedirect}>Return home</Link>
          </Button>
        }
      />
    </div>
  )
}
