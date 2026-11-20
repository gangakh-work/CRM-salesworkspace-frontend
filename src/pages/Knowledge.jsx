import Icon from '../components/Icon'
import { PageHead } from '../components/ui'
import '../styles/knowledge.css'

const workflows = [
  {
    number: '01',
    title: 'Start with Overview',
    steps: ['Check sales totals and due tasks.', 'Select a top record to open its CRM page.'],
  },
  {
    number: '02',
    title: 'Find a record',
    steps: ['Choose Leads, Opportunities, Contacts, or Companies.', 'Search by name, then open the record you need.'],
  },
  {
    number: '03',
    title: 'Ask for help',
    steps: ['Open AI Assistant and describe what you need.', 'Include a name or company so it finds the right record.'],
  },
  {
    number: '04',
    title: 'Check your work',
    steps: ['Review names, owners, amounts, and dates.', 'Refresh the page to confirm the saved change.'],
  },
]

const chapters = [
  {
    icon: 'grid',
    title: 'Reading your Overview',
    steps: [
      'Use the KPI cards to review leads, opportunities, pipeline, and sales performance.',
      'Check Today’s Priorities for tasks due today or past due.',
      'Select a card or record to open the related list.',
    ],
  },
  {
    icon: 'target',
    title: 'Managing leads',
    steps: [
      'Open Leads and search for a person or company.',
      'Open a lead to review its contact details, status, owner, and expected revenue.',
      'Choose Qualify and answer the questions about need, budget, decision-maker, and timing.',
      'Review your answers before submitting the qualification.',
    ],
  },
  {
    icon: 'pipeline',
    title: 'Managing opportunities',
    steps: [
      'Open Opportunities to review pipeline, forecast, and current deals.',
      'Search by opportunity, customer, stage, or owner; select a row for details.',
      'Use New Opportunity to add a deal, and check its name, customer, value, and close date.',
      'Before choosing Won or Lost, verify the deal and review the confirmation details.',
    ],
  },
  {
    icon: 'sparkle',
    title: 'Working with the AI Assistant',
    steps: [
      'Ask in everyday language, for example: “Summarize the Contoso opportunity.”',
      'Include a person, company, or deal name so the Assistant can find the right record.',
      'Answer follow-up questions if the request is unclear or information is missing.',
      'If a form appears, complete it, review every detail, then submit only when it is correct.',
      'Check AI summaries and drafts yourself; they are suggestions, not final decisions.',
      'The Assistant needs the configured backend and CRM connection to retrieve records or make changes.',
    ],
  },
  {
    icon: 'calendar',
    title: 'Keeping work coordinated',
    steps: [
      'Use Contacts and Companies to find people and the organizations they belong to.',
      'Use Tasks and Calendar to check owners, due dates, and planned follow-ups.',
      'If information looks old, choose Refresh and check the connection warning if one appears.',
    ],
  },
]

export default function Knowledge() {
  return (
    <div className="knowledge-book">
      <PageHead
        title="CRM User Guide – Everything You Need to Get Started"
        sub="A simple, beginner-friendly guide to using your CRM."
      />

      <section className="knowledge-hero">
        <div className="knowledge-hero-copy">
          <span className="knowledge-eyebrow"><Icon name="doc" size={15} /> WORKSPACE FIELD GUIDE</span>
          <h2>Start with the essentials</h2>
          <p>
            New to the CRM? Follow these simple steps to find information, work
            with the Assistant, and safely save your updates.
          </p>
        </div>
        <div className="knowledge-hero-mark" aria-hidden="true"><Icon name="sparkle" size={34} /></div>
      </section>

      <section className="knowledge-workflow" aria-label="Recommended workflow">
        {workflows.map((step) => (
          <article className="knowledge-step" key={step.number}>
            <span className="knowledge-step-number">{step.number}</span>
            <h3>{step.title}</h3>
            <ul>{step.steps.map((text) => <li key={text}>{text}</li>)}</ul>
          </article>
        ))}
      </section>

      <section className="knowledge-chapters" aria-label="Workspace guide">
        {chapters.map((chapter) => (
          <article className="card knowledge-chapter" key={chapter.title}>
            <div className="knowledge-chapter-icon"><Icon name={chapter.icon} size={19} /></div>
            <div className="knowledge-chapter-body">
              <h2>{chapter.title}</h2>
              <ul>{chapter.steps.map((text) => <li key={text}>{text}</li>)}</ul>
            </div>
          </article>
        ))}
      </section>

      <aside className="knowledge-note">
        <Icon name="help" size={18} />
        <div>
          <strong>Before you finish</strong>
          <ul>
            <li>CRM information comes from your connected Dataverse environment.</li>
            <li>Review any change before submitting it, then refresh to confirm it was saved.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
