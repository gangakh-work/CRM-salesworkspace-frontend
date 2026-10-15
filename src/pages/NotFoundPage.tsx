import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/global/EmptyState'
import { Button } from '@/components/ui/button'
import { routeMeta } from '@/config/routes'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Button asChild>
            <Link to={routeMeta.defaultRedirect}>Go to Dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
