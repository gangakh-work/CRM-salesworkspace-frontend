import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { LeadScoreBadge, PriorityBadge, QualificationRatingBadge, StatusBadge, DisqualificationReasonBadge } from '@/features/lead-management/components/LeadBadges'
import type { Lead360Profile } from '@/features/lead-management/types/lead.types'
import type { Lead } from '@/features/lead-management/types/lead.types'
import { fadeIn } from '@/design-system/animations/motion'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function Lead360LeftPanel({ lead, profile }: { lead: Lead; profile: Lead360Profile }) {

  return (
    <motion.aside
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex h-full w-full flex-col overflow-y-auto border-r border-border/60 bg-gradient-to-b from-muted/20 via-background to-background xl:w-72 xl:shrink-0"
    >
      <div className="p-5">
        <div className="flex flex-col items-center text-center">
          <Avatar className="size-20 border-2 border-primary/30 shadow-elevation-2 ring-4 ring-primary/5">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <Typography variant="heading-m" className="mt-3 text-base">{lead.name}</Typography>
          <Typography variant="caption" tone="muted">{lead.title}</Typography>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
            {lead.qualificationRating && (
              <QualificationRatingBadge rating={lead.qualificationRating} />
            )}
            {lead.disqualificationReason && (
              <DisqualificationReasonBadge reason={lead.disqualificationReason} />
            )}
          </div>
        </div>

        <Separator className="my-5" />

        <section className="space-y-3">
          <SectionLabel icon={Building2} label="Company" />
          <Typography variant="body" className="text-sm font-semibold">{lead.company}</Typography>
          {profile.website && (
            <Button variant="link" className="h-auto p-0 text-xs" disabled>
              {profile.website.replace('https://', '')}
              <ExternalLink className="size-3" />
            </Button>
          )}
          {profile.employeeCount && (
            <Typography variant="caption" tone="muted">{profile.employeeCount} employees</Typography>
          )}
        </section>

        <Separator className="my-5" />

        <section className="space-y-3">
          <SectionLabel label="Contact Details" />
          <ContactRow label="Email" value={lead.email} />
          <ContactRow label="Phone" value={lead.phone} />
          <ContactRow label="Designation" value={lead.title} />
          <ContactRow label="Location" value={profile.location} icon={MapPin} />
          <ContactRow label="Industry" value={lead.industry} />
          <ContactRow label="Owner" value={lead.owner} />
          <ContactRow label="Source" value={lead.source} />
        </section>

        <Button variant="outline" size="sm" className="mt-4 w-full gap-2" disabled>
          <ExternalLink className="size-4 text-[#0A66C2]" />
          View LinkedIn Profile
        </Button>

        <Separator className="my-5" />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="caption" className="font-semibold uppercase tracking-wider text-muted-foreground">
              Lead Score
            </Typography>
            <LeadScoreBadge score={lead.qualificationScore ?? lead.score} />
          </div>
          {lead.qualifiedDate && (
            <Typography variant="caption" tone="muted">
              Qualified {lead.qualifiedDate} by {lead.qualifiedBy}
            </Typography>
          )}


        </section>


      </div>
    </motion.aside>
  )
}

function SectionLabel({ label, icon: Icon }: { label: string; icon?: typeof Building2 }) {
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      <Typography variant="caption" className="font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Typography>
    </div>
  )
}

function ContactRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof MapPin
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 text-right font-medium">
        {Icon && <Icon className="size-3 shrink-0 text-muted-foreground" />}
        <span className="truncate">{value}</span>
      </span>
    </div>
  )
}

export function Lead360BackLink() {
  return (
    <Link
      to="/workspace/leads"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to Leads
      <ChevronRight className="size-3 opacity-0" />
    </Link>
  )
}
