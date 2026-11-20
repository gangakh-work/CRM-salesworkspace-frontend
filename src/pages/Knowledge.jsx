import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import '../styles/knowledge.css'

const workflows = [
  {
    number: '01',
    title: 'Get oriented',
    text: 'Start on Overview to understand the current pipeline, lead activity, priorities, and opportunity performance. Select a dashboard item to open the related CRM records.',
  },
  {
    number: '02',
    title: 'Find the right record',
    text: 'Use the Leads, Opportunities, Contacts, and Companies pages to search and review records from the connected CRM. Open a record when you need its full details.',
  },
  {
    number: '03',
    title: 'Work with context',
    text: 'Update records in their dedicated workflow, or ask the AI Assistant to summarize information, draft next steps, or help prepare a change.',
  },
  {
    number: '04',
    title: 'Review and verify',
    text: 'Check names, values, owners, and dates before confirming an action. Refresh the relevant page afterwards to verify the CRM reflects the change.',
  },
]

const chapters = [
  {
    icon: 'grid',
    title: 'Reading your Overview',
    paragraphs: [
      'Overview brings together current sales signals from the CRM. Top Opportunities are ranked by expected value, while Top Leads are ranked by their available lead score. The right-hand rail summarizes lead volume, open pipeline value, and won opportunities.',
      'Today’s Priorities highlights open tasks due today or overdue. Deals at Risk surfaces opportunities that are nearing their expected close date or have a risk signal. Select a dashboard card or record to jump into the matching page and review the underlying items.',
    ],
  },
  {
    icon: 'target',
    title: 'Managing leads',
    paragraphs: [
      'Open Leads to search prospects and review their contact details, source, score, status, owner, and expected value. Selecting a lead opens its record so you can check the available context before deciding what to do next.',
      'Use the qualification workflow to record whether need, budget, authority, and timeline have been confirmed. The qualification score reflects those answers; it is a guide for prioritization, not a guarantee of conversion. Review the completed information before submitting any CRM update.',
    ],
  },
  {
    icon: 'pipeline',
    title: 'Managing opportunities',
    paragraphs: [
      'The Opportunities page shows open pipeline, a weighted forecast, and won value alongside the current opportunity list. Search by opportunity, customer, stage, owner, or CRM identifier, and open a record for its details.',
      'Create an opportunity with the New Opportunity action. When marking one Won or Lost, review the confirmation details and provide any requested close information. These actions update CRM data, so verify the selected record and values before confirming.',
    ],
  },
  {
    icon: 'sparkle',
    title: 'Working with the AI Assistant',
    paragraphs: [
      'Ask the Assistant in plain language for help with CRM work, such as finding or summarizing a lead, reviewing an opportunity, drafting a follow-up, or suggesting a next action. Include a person, company, opportunity name, or other identifying detail to help it select the right context.',
      'If a request could refer to more than one record or needs missing information, answer the follow-up question. When the Assistant presents a form, complete each step, review the summary, and submit only when the details are correct. Treat generated summaries and drafts as suggestions that need your review.',
      'The Assistant uses the configured sales-agent service and connected CRM data. If that service or the CRM connection is unavailable, the page will report the issue; the guide and Assistant cannot replace missing permissions or a running backend.',
    ],
  },
  {
    icon: 'calendar',
    title: 'Keeping work coordinated',
    paragraphs: [
      'Contacts and Companies help you understand who is involved in an account. Tasks and Calendar help you follow through on planned work; check the owner and due date so the next step is clear to the right person.',
      'Use refresh controls after a change if a list still shows older information. A visible connection warning means the CRM data may not be current, so resolve the connection before relying on dashboard totals or record details.',
    ],
  },
]

export default function Knowledge() {
  return (
    <div className="knowledge-book">
      <PageHead
        title="Knowledge Book"
        sub="A practical guide to the workspace, the CRM, and the sales agent."
      />

      <section className="knowledge-hero">
        <div className="knowledge-hero-copy">
          <span className="knowledge-eyebrow"><Icon name="doc" size={15} /> WORKSPACE FIELD GUIDE</span>
          <h2>From first look to confident action</h2>
          <p>
            Use this guide to understand where information lives, how the
            Assistant supports your work, and what to review before a change
            reaches the CRM.
          </p>
        </div>
        <div className="knowledge-hero-mark" aria-hidden="true"><Icon name="sparkle" size={34} /></div>
      </section>

      <section className="knowledge-workflow" aria-label="Recommended workflow">
        {workflows.map((step) => (
          <article className="knowledge-step" key={step.number}>
            <span className="knowledge-step-number">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <section className="knowledge-chapters" aria-label="Workspace guide">
        {chapters.map((chapter) => (
          <article className="card knowledge-chapter" key={chapter.title}>
            <div className="knowledge-chapter-icon"><Icon name={chapter.icon} size={19} /></div>
            <div className="knowledge-chapter-body">
              <h2>{chapter.title}</h2>
              {chapter.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </article>
        ))}
      </section>

      <aside className="knowledge-note">
        <Icon name="help" size={18} />
        <p>
          <strong>Keep the source of truth in mind.</strong> CRM records and
          sales-agent actions depend on the configured backend and Dataverse
          connection. Review generated content, confirm record changes
          deliberately, and check the CRM when accuracy matters.
        </p>
      </aside>
    </div>
  )
}
