import { Bell } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useNotification } from '@/hooks/useNotification'
import { cn } from '@/lib/utils'

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotification()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Typography variant="body" className="font-medium">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Typography variant="caption" tone="muted">
                No notifications
              </Typography>
            </div>
          ) : (
            notifications.map((item, index) => (
              <div key={item.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    !item.read && 'bg-primary/5',
                  )}
                  onClick={() => markAsRead(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Typography variant="body" className="text-sm font-medium">
                      {item.title}
                    </Typography>
                    {!item.read && <Badge variant="info">New</Badge>}
                  </div>
                  <Typography variant="caption" tone="muted" className="mt-1 line-clamp-2">
                    {item.message}
                  </Typography>
                  <Typography variant="caption" tone="muted" className="mt-1">
                    {item.timestamp}
                  </Typography>
                </button>
                <div className="flex justify-end px-4 pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => dismiss(item.id)}
                  >
                    Dismiss
                  </Button>
                </div>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
