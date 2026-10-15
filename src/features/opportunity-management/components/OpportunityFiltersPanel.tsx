import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  useOpportunityManagement,
} from '@/features/opportunity-management/context/OpportunityManagementProvider'
import { formatStage, STAGE_ORDER } from '@/features/opportunity-management/lib/opportunity-workflow'
import { DEFAULT_OPPORTUNITY_FILTERS } from '@/features/opportunity-management/types/opportunity.types'
import type { OpportunityFilters } from '@/features/opportunity-management/types/opportunity.types'

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  format = (v: string) => v,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  format?: (v: string) => string
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
            {format(opt)}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function OpportunityFiltersPanel() {
  const { filters, setFilters, filtersOpen, setFiltersOpen, filterOptions } = useOpportunityManagement()
  const { owners, regions, industries } = filterOptions

  const update = (partial: Partial<OpportunityFilters>) => setFilters({ ...filters, ...partial })

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
              label="Stage"
              options={[...STAGE_ORDER, 'lost']}
              selected={filters.stage}
              onChange={(stage) => update({ stage: stage as OpportunityFilters['stage'] })}
              format={(s) => formatStage(s as OpportunityFilters['stage'][0])}
            />
            <MultiSelect
              label="Priority"
              options={['high', 'medium', 'low']}
              selected={filters.priority}
              onChange={(priority) => update({ priority: priority as OpportunityFilters['priority'] })}
            />
            <MultiSelect label="Owner" options={owners} selected={filters.owner} onChange={(owner) => update({ owner })} />
            <MultiSelect label="Region" options={regions} selected={filters.region} onChange={(region) => update({ region })} />
            <MultiSelect
              label="Industry"
              options={industries}
              selected={filters.industry}
              onChange={(industry) => update({ industry })}
            />
            <MultiSelect
              label="Risk"
              options={['high', 'medium', 'low']}
              selected={filters.risk}
              onChange={(risk) => update({ risk: risk as OpportunityFilters['risk'] })}
            />
            <MultiSelect
              label="Status"
              options={['open', 'won', 'lost']}
              selected={filters.status}
              onChange={(status) => update({ status: status as OpportunityFilters['status'] })}
            />
            <MultiSelect
              label="Forecast"
              options={['pipeline', 'best_case', 'commit', 'closed', 'omitted']}
              selected={filters.forecastCategory}
              onChange={(forecastCategory) =>
                update({ forecastCategory: forecastCategory as OpportunityFilters['forecastCategory'] })
              }
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 px-4 py-2">
            <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_OPPORTUNITY_FILTERS)}>
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(false)}>
              Close
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
