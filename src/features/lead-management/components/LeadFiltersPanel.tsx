import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useLeadManagement } from '@/features/lead-management/context/LeadManagementProvider'
import { formatWorkflowStatus } from '@/features/lead-management/lib/lead-workflow'
import { DEFAULT_LEAD_FILTERS } from '@/features/lead-management/types/lead.types'
import type { LeadFilters, LeadWorkflowStatus } from '@/features/lead-management/types/lead.types'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_OPTIONS: LeadWorkflowStatus[] = [
  'draft',
  'assigned',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'converted',
  'disqualified',
]

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt))
    else onChange([...selected, opt])
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <Button
            key={opt}
            variant={selected.includes(opt) ? 'primary' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => toggle(opt)}
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function LeadFiltersPanel() {
  const { filters, setFilters, filtersOpen, setFiltersOpen, filterOptions } = useLeadManagement()
  const { owners, industries, sources, countries } = filterOptions

  const update = (partial: Partial<LeadFilters>) => setFilters({ ...filters, ...partial })

  return (
    <AnimatePresence>
      {filtersOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-border/60 bg-muted/20"
        >
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <MultiSelect
              label="Status"
              options={STATUS_OPTIONS.map((s) => formatWorkflowStatus(s))}
              selected={filters.status.map((s) => formatWorkflowStatus(s))}
              onChange={(labels) => {
                const status = labels.map((label) =>
                  STATUS_OPTIONS.find((s) => formatWorkflowStatus(s) === label)!,
                ).filter(Boolean)
                update({ status })
              }}
            />
            <MultiSelect
              label="Priority"
              options={['high', 'medium', 'low']}
              selected={filters.priority}
              onChange={(priority) => update({ priority: priority as LeadFilters['priority'] })}
            />
            <MultiSelect label="Industry" options={industries} selected={filters.industry} onChange={(industry) => update({ industry })} />
            <MultiSelect label="Country" options={countries} selected={filters.country} onChange={(country) => update({ country })} />
            <MultiSelect label="Owner" options={owners} selected={filters.owner} onChange={(owner) => update({ owner })} />
            <MultiSelect label="Source" options={sources} selected={filters.source} onChange={(source) => update({ source })} />

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">
                Lead Score: {filters.scoreMin} – {filters.scoreMax}
              </Label>
              <div className="flex gap-4 pt-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.scoreMin}
                  onChange={(e) => update({ scoreMin: Number(e.target.value) })}
                  className="flex-1"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.scoreMax}
                  onChange={(e) => update({ scoreMax: Number(e.target.value) })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_LEAD_FILTERS)}>
                Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
