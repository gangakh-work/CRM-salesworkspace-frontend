import { ArrowDown, ArrowUp, RotateCcw, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { useDashboardSettings } from '@/features/dashboard/hooks/useDashboardSettings'
import {
  WIDGET_LABELS,
} from '@/features/dashboard/types/dashboard.types'
import { ThemeSwitcher } from '@/shell/ThemeSwitcher'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'

export function DashboardSettingsPanel() {
  const { widgetOrder, moveWidget, resetLayout, isCollapsed, toggleSection } =
    useDashboardSettings()
  const { settings, updateSettings } = useSettings()
  const { theme } = useTheme()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="size-4" />
          <span className="hidden sm:inline">Dashboard Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dashboard Settings</SheetTitle>
          <SheetDescription>
            Reorder widgets, collapse sections, and manage preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          <section className="space-y-4">
            <Typography variant="body" className="font-semibold">
              Widget Order
            </Typography>
            <div className="space-y-2">
              {widgetOrder.map((id, index) => (
                <WidgetOrderRow
                  key={id}
                  label={WIDGET_LABELS[id]}
                  index={index}
                  total={widgetOrder.length}
                  collapsed={isCollapsed(id)}
                  onMoveUp={() => moveWidget(id, 'up')}
                  onMoveDown={() => moveWidget(id, 'down')}
                  onToggleCollapse={() => toggleSection(id)}
                />
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={resetLayout}>
              <RotateCcw className="size-4" />
              Reset layout
            </Button>
          </section>

          <section className="space-y-4">
            <Typography variant="body" className="font-semibold">
              Appearance
            </Typography>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Theme</Label>
                <Typography variant="caption" tone="muted">
                  Current: {theme}
                </Typography>
              </div>
              <ThemeSwitcher />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="animated-background">Animated background</Label>
                <Typography variant="caption" tone="muted">
                  Energy globe behind every page (uses dark theme)
                </Typography>
              </div>
              <Switch
                id="animated-background"
                checked={settings.animatedBackground}
                onCheckedChange={(checked) => updateSettings({ animatedBackground: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="animations">Animations</Label>
              <Switch
                id="animations"
                checked={settings.animationsEnabled}
                onCheckedChange={(checked) => updateSettings({ animationsEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="compact">Compact mode</Label>
              <Switch
                id="compact"
                checked={settings.compactMode}
                onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function WidgetOrderRow({
  label,
  index,
  total,
  collapsed,
  onMoveUp,
  onMoveDown,
  onToggleCollapse,
}: {
  label: string
  index: number
  total: number
  collapsed: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleCollapse: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="min-w-0 flex-1">
        <Typography variant="body" className="text-sm font-medium">
          {label}
        </Typography>
        <Typography variant="caption" tone="muted">
          {collapsed ? 'Collapsed' : 'Expanded'}
        </Typography>
      </div>
      <div className="flex items-center gap-1">
        <Switch checked={!collapsed} onCheckedChange={onToggleCollapse} aria-label={`Toggle ${label}`} />
        <Button variant="ghost" size="icon-sm" disabled={index === 0} onClick={onMoveUp}>
          <ArrowUp className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" disabled={index === total - 1} onClick={onMoveDown}>
          <ArrowDown className="size-4" />
        </Button>
      </div>
    </div>
  )
}
