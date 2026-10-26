import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Typography } from '@/components/ui/typography'
import { routeMeta } from '@/config/routes'
import { useSession } from '@/features/auth/hooks/useSession'
import { useUser } from '@/features/auth/hooks/useUser'
import { useMicrosoftProfilePhoto } from '@/features/auth/hooks/useMicrosoftProfilePhoto'

export function ProfileMenu() {
  const { displayName, email, role, initials } = useUser()
  const photoUrl = useMicrosoftProfilePhoto(email)
  const { logout } = useSession()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(routeMeta.login, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-9 rounded-full p-0" aria-label="Profile menu">
          <Avatar className="size-8">
            {photoUrl && <AvatarImage src={photoUrl} alt={displayName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <Typography variant="body" className="text-sm font-medium">
              {displayName}
            </Typography>
            <Typography variant="caption" tone="muted">
              {role}
            </Typography>
            <Typography variant="caption" tone="muted">
              {email}
            </Typography>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => void handleLogout()}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
