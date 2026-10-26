import { BookOpen, ExternalLink } from 'lucide-react'

/** The training is a self-contained offline HTML document served by Vite public assets. */
export function KnowledgeBasePage() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-5" aria-label="Sales Workspace knowledge base">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-2 text-orange-400"><BookOpen size={22} /></span>
          <div><h1 className="text-xl font-semibold">Knowledge Base</h1><p className="text-sm text-muted-foreground">Learn how to use Sales Workspace with guided, interactive examples.</p></div>
        </div>
        <a href="/sales-workspace-training.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">Open full screen <ExternalLink size={15}/></a>
      </div>
      <iframe title="Interactive Sales Workspace training" src="/sales-workspace-training.html" className="h-[max(620px,calc(100dvh-190px))] w-full rounded-xl border border-border bg-[#080808]" allowFullScreen loading="eager" />
    </section>
  )
}
