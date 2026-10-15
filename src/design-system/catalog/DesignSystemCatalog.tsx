import { motion } from 'framer-motion'
import {
  Activity,
  Bell,
  DollarSign,
  Inbox,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { ActionBar } from '@/components/layout/ActionBar'
import { FilterBar } from '@/components/layout/FilterBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchBar } from '@/components/layout/SearchBar'
import {
  ActivityCard,
  KpiCard,
  NotificationCard,
  StatsCard,
  Timeline,
} from '@/components/patterns/data-display'
import { EmptyState, ErrorState, LoadingState } from '@/components/patterns/state-components'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Autocomplete } from '@/components/ui/autocomplete'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Chip } from '@/components/ui/chip'
import { DataGrid, type DataGridColumn } from '@/components/ui/data-grid'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { staggerContainer } from '@/design-system/animations/motion'

interface SampleRow {
  id: string
  name: string
  status: string
}

const sampleColumns: DataGridColumn<SampleRow>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name, sortable: true, sortValue: (row) => row.name },
  { id: 'status', header: 'Status', accessor: (row) => row.status, sortable: true, sortValue: (row) => row.status },
]

const sampleData: SampleRow[] = [
  { id: '1', name: 'Component A', status: 'Active' },
  { id: '2', name: 'Component B', status: 'Draft' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <Typography variant="heading-m">{title}</Typography>
      {children}
    </section>
  )
}

export function DesignSystemCatalog() {
  const [search, setSearch] = useState('')
  const [date, setDate] = useState<Date>()

  return (
    <TooltipProvider>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mx-auto max-w-[var(--container-6xl)] space-y-10">
        <PageHeader
          title="Design System"
          description="Enterprise component library for Sales Workspace. Inspired by Microsoft 365, Azure Portal, Notion, Vercel, and Linear."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Design System' }]}
          actions={
            <Button
              variant="secondary"
              onClick={() => toast.success('Design system ready', 'All tokens and components loaded.')}
            >
              Show Toast
            </Button>
          }
        />

        <Section title="Typography">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Typography variant="heading-xl">Heading XL</Typography>
              <Typography variant="heading-l">Heading L</Typography>
              <Typography variant="heading-m">Heading M</Typography>
              <Typography variant="body-lg">Body Large — Primary content text</Typography>
              <Typography variant="body">Body — Default paragraph text</Typography>
              <Typography variant="caption">Caption — Secondary metadata</Typography>
              <Badge variant="neutral">Badge Label</Badge>
              <Typography variant="code">const token = 'design-system'</Typography>
            </CardContent>
          </Card>
        </Section>

        <Section title="Colors">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {(['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const).map((color) => (
              <div key={color} className="space-y-2">
                <div className={`h-16 rounded-lg bg-${color} shadow-elevation-1`} style={{ backgroundColor: `var(--color-${color})` }} />
                <Typography variant="caption" className="capitalize">{color}</Typography>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" size="icon"><Bell className="size-4" /></Button>
          </div>
        </Section>

        <Section title="Form Controls">
          <Card>
            <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="text-field">Text Field</Label>
                <Input id="text-field" placeholder="Enter value..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Search Box</Label>
                <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search components..." />
              </div>
              <div className="space-y-2">
                <Label>Dropdown</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Option A</SelectItem>
                    <SelectItem value="b">Option B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autocomplete</Label>
                <Autocomplete
                  options={[
                    { value: '1', label: 'React' },
                    { value: '2', label: 'TypeScript' },
                    { value: '3', label: 'Tailwind CSS' },
                  ]}
                  placeholder="Search technologies..."
                />
              </div>
              <div className="space-y-2">
                <Label>Date Picker</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textarea">Text Area</Label>
                <Textarea id="textarea" placeholder="Multi-line input..." />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check" />
                <Label htmlFor="check">Checkbox</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="switch" />
                <Label htmlFor="switch">Switch</Label>
              </div>
              <RadioGroup defaultValue="a" className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="a" id="r1" />
                  <Label htmlFor="r1">Radio A</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="b" id="r2" />
                  <Label htmlFor="r2">Radio B</Label>
                </div>
              </RadioGroup>
              <div className="md:col-span-2">
                <FileUpload label="Upload document" onFilesSelected={() => toast.info('File selected')} />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section title="Data Display">
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard title="Total Users" value="2,847" description="vs last month" icon={Users} trend={{ value: '+12%', positive: true }} />
            <StatsCard title="Revenue" value="$48.2K" icon={DollarSign} trend={{ value: '+8%', positive: true }} />
            <KpiCard label="Conversion Rate" value="24.5" unit="%" target="30" status="warning" />
          </div>
          <DataGrid data={sampleData} columns={sampleColumns} getRowId={(row) => row.id} />
        </Section>

        <Section title="Feedback & Overlay">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Modal</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>Enterprise modal with elevation and animation.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline">Drawer</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Drawer Panel</SheetTitle>
                  <SheetDescription>Slide-in panel for secondary workflows.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="outline">Tooltip</Button></TooltipTrigger>
              <TooltipContent>Helpful context on hover</TooltipContent>
            </Tooltip>
          </div>
          <Progress value={65} className="max-w-md" />
        </Section>

        <Section title="Navigation">
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Overview</TabsTrigger>
              <TabsTrigger value="tab2">Components</TabsTrigger>
              <TabsTrigger value="tab3">Tokens</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1"><Card className="p-4"><Typography variant="body">Tab content area</Typography></Card></TabsContent>
            <TabsContent value="tab2"><Card className="p-4"><Typography variant="body">Component reference</Typography></Card></TabsContent>
            <TabsContent value="tab3"><Card className="p-4"><Typography variant="body">Design tokens</Typography></Card></TabsContent>
          </Tabs>
          <Accordion type="single" collapsible className="max-w-lg">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is the design system?</AccordionTrigger>
              <AccordionContent>A reusable component library with tokens, themes, and patterns.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Section title="States">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><EmptyState icon={Inbox} title="No items" description="Nothing to display yet." action={<Button size="sm">Add item</Button>} /></Card>
            <Card><LoadingState label="Fetching data..." /></Card>
            <Card><ErrorState onRetry={() => toast.info('Retrying...')} /></Card>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </Section>

        <Section title="Patterns">
          <Timeline
            items={[
              { id: '1', title: 'Design tokens created', timestamp: '2 hours ago', icon: Activity },
              { id: '2', title: 'Components built', timestamp: '1 hour ago', icon: TrendingUp },
            ]}
          />
          <ActivityCard
            title="Component library updated"
            subtitle="Added 40+ reusable components"
            timestamp="Just now"
            avatar={<Avatar><AvatarFallback>DS</AvatarFallback></Avatar>}
          />
          <NotificationCard title="System Ready" message="Design system foundation complete." timestamp="Today" />
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Chip onRemove={() => undefined}>Filter chip</Chip>
          </div>
        </Section>

        <Section title="Layout">
          <FilterBar>
            <Select>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
            </Select>
            <SearchBar placeholder="Filter..." className="max-w-xs" />
          </FilterBar>
          <ActionBar
            left={<Typography variant="body" tone="muted">12 components selected</Typography>}
            right={<><Button variant="outline" size="sm">Export</Button><Button size="sm">Apply</Button></>}
          />
        </Section>
      </motion.div>
    </TooltipProvider>
  )
}
