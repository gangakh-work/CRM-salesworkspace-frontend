import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  Mail,
  User,
  ExternalLink,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { formatRecordValue } from '@/features/crm-workspace/lib/workspace-config'
import type { WorkspaceRecord } from '@/features/crm-workspace/types/workspace.types'
import { cardHover } from '@/design-system/animations/motion'
import { cn } from '@/lib/utils'

const priorityVariant = {
  high: 'error' as const,
  medium: 'warning' as const,
  low: 'neutral' as const,
}

interface RecordCardProps {
  record: WorkspaceRecord
  compact?: boolean
  className?: string
}

function RecordDetailsDialog({
  record,
  open,
  onOpenChange,
}: {
  record: WorkspaceRecord
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {record.title}
          </DialogTitle>

          <DialogDescription>
            {record.subtitle || 'CRM record details'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-3">
            <Typography
              variant="caption"
              tone="muted"
            >
              Status
            </Typography>

            <Typography
              variant="body"
              className="mt-1 font-medium capitalize"
            >
              {record.status || '—'}
            </Typography>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <Typography
              variant="caption"
              tone="muted"
            >
              Owner
            </Typography>

            <Typography
              variant="body"
              className="mt-1 font-medium"
            >
              {record.owner || '—'}
            </Typography>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <Typography
              variant="caption"
              tone="muted"
            >
              Date
            </Typography>

            <Typography
              variant="body"
              className="mt-1 font-medium"
            >
              {record.date || '—'}
            </Typography>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <Typography
              variant="caption"
              tone="muted"
            >
              Due Date
            </Typography>

            <Typography
              variant="body"
              className="mt-1 font-medium"
            >
              {record.dueDate || '—'}
            </Typography>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <Typography
              variant="caption"
              tone="muted"
            >
              Priority
            </Typography>

            <Typography
              variant="body"
              className="mt-1 font-medium capitalize"
            >
              {record.priority || '—'}
            </Typography>
          </div>

          {record.value !== undefined && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <Typography
                variant="caption"
                tone="muted"
              >
                Value
              </Typography>

              <Typography
                variant="body"
                className="mt-1 font-medium"
              >
                {formatRecordValue(
                  record.value,
                )}
              </Typography>
            </div>
          )}

          {record.company && (
            <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
              <Typography
                variant="caption"
                tone="muted"
              >
                Company / Customer
              </Typography>

              <Typography
                variant="body"
                className="mt-1 font-medium"
              >
                {record.company}
              </Typography>
            </div>
          )}

          {record.email && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <Typography
                variant="caption"
                tone="muted"
              >
                Email
              </Typography>

              <Typography
                variant="body"
                className="mt-1 break-all font-medium"
              >
                {record.email}
              </Typography>
            </div>
          )}

          {record.phone && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <Typography
                variant="caption"
                tone="muted"
              >
                Phone
              </Typography>

              <Typography
                variant="body"
                className="mt-1 font-medium"
              >
                {record.phone}
              </Typography>
            </div>
          )}

          {record.tags &&
            record.tags.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
                <Typography
                  variant="caption"
                  tone="muted"
                >
                  Tags
                </Typography>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {record.tags.map(
                    (tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RecordCard({
  record,
  compact = false,
  className,
}: RecordCardProps) {
  const [detailsOpen, setDetailsOpen] =
    useState(false)

  return (
    <>
      <motion.div
        initial="rest"
        whileHover="hover"
        variants={cardHover}
      >
        <Card
          className={cn(
            'group border-border/60 bg-card/80 backdrop-blur-sm transition-colors hover:border-primary/30',
            className,
          )}
        >
          <CardContent
            className={cn(
              'p-4',
              compact && 'p-3',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                className="min-w-0 flex-1 cursor-pointer text-left"
                onClick={() =>
                  setDetailsOpen(true)
                }
              >
                <Typography
                  variant="body"
                  className="truncate font-semibold hover:text-primary"
                >
                  {record.title}
                </Typography>

                <Typography
                  variant="caption"
                  tone="muted"
                  className="mt-0.5 line-clamp-2"
                >
                  {record.subtitle}
                </Typography>
              </button>

              {record.priority && (
                <Badge
                  variant={
                    priorityVariant[
                      record.priority
                    ]
                  }
                  className="shrink-0 text-[10px]"
                >
                  {record.priority}
                </Badge>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] capitalize"
              >
                {record.status}
              </Badge>

              {record.value !== undefined && (
                <Typography
                  variant="caption"
                  className="font-medium tabular-nums"
                >
                  {formatRecordValue(
                    record.value,
                  )}
                </Typography>
              )}
            </div>

            {!compact && (
              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="size-3" />
                  {record.owner}
                </span>

                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {record.date}
                </span>
              </div>
            )}

            {record.tags &&
              record.tags.length > 0 &&
              !compact && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {record.tags.map(
                    (tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ),
                  )}
                </div>
              )}

            <div className="mt-3 flex justify-end border-t border-border/50 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() =>
                  setDetailsOpen(true)
                }
              >
                <ExternalLink className="size-3.5" />
                Open
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <RecordDetailsDialog
        record={record}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  )
}

export function RecordListItem({
  record,
}: {
  record: WorkspaceRecord
}) {
  const [detailsOpen, setDetailsOpen] =
    useState(false)

  return (
    <>
      <div
        className="flex cursor-pointer items-center gap-4 rounded-lg border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-sm transition-colors hover:border-primary/20 hover:bg-card"
        onClick={() =>
          setDetailsOpen(true)
        }
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault()
            setDetailsOpen(true)
          }
        }}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="size-4 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <Typography
            variant="body"
            className="truncate font-medium"
          >
            {record.title}
          </Typography>

          <Typography
            variant="caption"
            tone="muted"
            className="truncate"
          >
            {record.subtitle}
          </Typography>
        </div>

        <Badge
          variant="outline"
          className="hidden shrink-0 capitalize sm:inline-flex"
        >
          {record.status}
        </Badge>

        {record.value !== undefined && (
          <Typography
            variant="caption"
            className="hidden shrink-0 font-medium tabular-nums md:block"
          >
            {formatRecordValue(
              record.value,
            )}
          </Typography>
        )}

        <Typography
          variant="caption"
          tone="muted"
          className="hidden shrink-0 lg:block"
        >
          {record.owner}
        </Typography>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={(event) => {
            event.stopPropagation()
            setDetailsOpen(true)
          }}
        >
          Open
        </Button>
      </div>

      <RecordDetailsDialog
        record={record}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  )
}

export function RecordStatusIcon({
  icon: Icon,
}: {
  icon: LucideIcon
}) {
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
      <Icon className="size-4 text-primary" />
    </div>
  )
}