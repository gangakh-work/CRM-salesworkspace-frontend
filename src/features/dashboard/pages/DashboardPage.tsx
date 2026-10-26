import { motion } from 'framer-motion'
import { ArrowUpRight, BookOpen, CalendarDays, CircleDollarSign, CreditCard, LayoutDashboard, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome'
import { KpiMetricsGrid } from '@/features/dashboard/components/KpiMetricsGrid'
import { RecentActivitiesPanel } from '@/features/dashboard/components/RecentActivitiesPanel'
import { SalesPipelinePanel } from '@/features/dashboard/components/SalesPipelinePanel'
import { UpcomingMeetingsPanel } from '@/features/dashboard/components/UpcomingMeetingsPanel'
import { DashboardTablesGrid } from '@/features/dashboard/components/DashboardTablesGrid'
import { useDashboardKpisQuery } from '@/features/dashboard/hooks/useDashboardQueries'
import { pageTransition } from '@/design-system/animations/motion'
import './dashboard-showcase.css'

const benefits = [
  { path: '/workspace/leads', icon: Zap, title: 'Faster Lead Qualification', description: 'Keep your sales team moving with clear, actionable lead insights.' },
  { path: '/workspace/opportunities', icon: TrendingUp, title: 'Real-Time Pipeline Tracking', description: 'Follow opportunities and revenue trends as they develop.' },
  { path: '/accounts', icon: Users, title: 'Connected Customer View', description: 'Bring account and contact activity into one workspace.' },
  { path: '/workspace/activities', icon: ShieldCheck, title: 'Reliable Sales Operations', description: 'Stay organized with consistent workflows and follow-ups.' },
  { path: '/ai-assistant', icon: Sparkles, title: 'Intelligent Recommendations', description: 'Prioritize the opportunities that need your attention.' },
  { path: '/workspace/activities', icon: CalendarDays, title: 'Activities & Follow-Ups', description: 'Keep meetings and next steps visible across your day.' },
  { path: '/knowledge-base', icon: BookOpen, title: 'Knowledge Base & Training', description: 'Learn to find records, create leads, import Excel templates, and use your AI Assistant.' },
]

function ShowcasePanel({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return <section className={`crm-showcase-panel ${className}`}><div className="crm-showcase-panel-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><span className="crm-showcase-panel-dot" /></div>{children}</section>
}

export function DashboardPage() {
  const kpis = useDashboardKpisQuery()
  return <motion.div className="crm-showcase" initial="initial" animate="animate" variants={pageTransition}>
    <section className="crm-showcase-hero">
      <div className="crm-showcase-hero-glow" aria-hidden="true" />
      
      <h1>Sales That Grow with<br /><em>Your Ambition</em></h1>
      <p>Bring every lead, opportunity, and customer relationship together.<br />Make smarter decisions and turn momentum into measurable growth.</p>
      <div className="crm-showcase-hero-actions"><Link className="crm-showcase-primary" to="/workspace/leads">Explore Leads <ArrowUpRight size={15}/></Link><Link className="crm-showcase-secondary" to="/workspace/opportunities"><TrendingUp size={15}/> View Pipeline</Link><Link className="crm-showcase-secondary" to="/knowledge-base"><BookOpen size={15}/> Learn the CRM</Link></div>
      <div className="crm-showcase-dashboard-frame">
        <div className="crm-showcase-frame-top"><div className="crm-showcase-brand"><span className="crm-showcase-brand-icon"><img src="/logo.png" alt="Sonata" onError={(event) => { event.currentTarget.style.display = "none" }} /></span> CRM Sales Workspace</div><div className="crm-showcase-frame-links"><Link className="active" to="/dashboard">Overview</Link><Link to="/workspace/activities">Activity</Link><Link to="/workspace/opportunities">Opportunities</Link><Link to="/accounts">Accounts</Link></div><button type="button" onClick={() => void kpis.refetch()} aria-label="Refresh CRM dashboard"><RefreshCw size={15} className={kpis.isFetching ? 'animate-spin' : ''}/></button></div>
        <div className="crm-showcase-frame-content"><DashboardWelcome /><div className="crm-showcase-kpi"><KpiMetricsGrid /></div><div className="crm-showcase-frame-panels"><ShowcasePanel title="Sales pipeline" subtitle="Live opportunity distribution"><SalesPipelinePanel /></ShowcasePanel><ShowcasePanel title="Upcoming activities" subtitle="Stay ahead of your next steps"><UpcomingMeetingsPanel /></ShowcasePanel></div></div>
      </div>
    </section>

    <section className="crm-showcase-section"><div className="crm-showcase-section-heading"><span>YOUR WORKSPACE</span><h2>Everything Your Sales Team Needs</h2><p>Connected tools, meaningful insights, and a clear view of your pipeline.</p></div><div className="crm-showcase-benefits">{benefits.map(({path,icon:Icon,title,description})=><Link to={path} className="crm-showcase-benefit" key={title}><span className="crm-showcase-benefit-icon"><Icon size={22}/></span><h3>{title}</h3><p>{description}</p></Link>)}</div></section>

    <section className="crm-showcase-section crm-showcase-operations"><div className="crm-showcase-section-heading"><span>STAY ON TOP OF WHAT MATTERS</span><h2>Your Pipeline. Your Momentum.</h2><p>A focused view of recent activity and the records that move deals forward.</p></div><div className="crm-showcase-operations-grid"><ShowcasePanel title="Recent sales activity" subtitle="Latest updates from your CRM"><RecentActivitiesPanel /></ShowcasePanel><ShowcasePanel title="Sales records" subtitle="Recently updated leads and opportunities"><DashboardTablesGrid /></ShowcasePanel></div></section>

    <section className="crm-showcase-cta"><span><CircleDollarSign size={18}/> GROW WITH CONFIDENCE</span><h2>Turn Every Opportunity Into Progress</h2><p>Keep your team connected to the work that drives results.</p><Link className="crm-showcase-primary" to="/workspace/opportunities">Open Opportunities <ArrowUpRight size={16}/></Link><div className="crm-showcase-cta-icons" aria-hidden="true"><CreditCard/><TrendingUp/><Sparkles/></div></section>
    <div className="sr-only" role="status" aria-live="polite">{kpis.isFetching ? 'Refreshing dashboard metrics' : kpis.isError ? 'Dashboard metrics could not be refreshed' : ''}</div>
  </motion.div>
}
