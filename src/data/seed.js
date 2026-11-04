/* ============================================================
   All demo data for the Myflow dashboard. Each list is a named
   export so a page can pull just what it needs.
   ============================================================ */

export const USER = {
  first: 'Sarah',
  name: 'Sarah Jensen',
  email: 'sarah@myflow.com',
  photo: '/people/sarah.jpg',
  workspace: "Sarah's Workspace",
}

/* ---------------- overview cards ---------------- */
export const DELIVERY = { rate: 91.7, delta: 0.3, today: 5.6, pending: 8.3 }

export const CAMPAIGN_STATS = { total: 25, active: 4 }

export const CONTACT_STATS = {
  total: 3241,
  newThisMonth: 192,
  delta: 12,
  months: [
    { m: 'D', label: 'December', v: 150 },
    { m: 'J', label: 'January', v: 268 },
    { m: 'F', label: 'February', v: 206 },
    { m: 'M', label: 'March', v: 121 },
    { m: 'A', label: 'April', v: 94 },
    { m: 'M', label: 'May', v: 204 },
    { m: 'J', label: 'June', v: 141 },
    { m: 'J', label: 'July', v: 192, live: true },
  ],
}


export const TOP_CONTACTS = {
  'This Week': [
    { name: 'Sarah Mitchell', email: 'sarah@brightsidemedia.com', share: 12, count: 1240, tone: 'teal' },
    { name: 'David Kim', email: 'david.kim@emailhub.io', share: 8, count: 850, tone: 'blue' },
    { name: 'Priya Patel', email: 'priya@oakrealty.co', share: 4, count: 425, tone: 'sky' },
    { name: 'Others', share: 76, count: 7011, tone: 'hatch' },
  ],
  'This Month': [
    { name: 'David Kim', email: 'david.kim@emailhub.io', share: 15, count: 4380, tone: 'teal' },
    { name: 'Sarah Mitchell', email: 'sarah@brightsidemedia.com', share: 11, count: 3215, tone: 'blue' },
    { name: 'Nora Fitzgerald', email: 'nora@fitzandco.com', share: 6, count: 1702, tone: 'sky' },
    { name: 'Others', share: 68, count: 19840, tone: 'hatch' },
  ],
  'All Time': [
    { name: 'Priya Patel', email: 'priya@oakrealty.co', share: 18, count: 17140, tone: 'teal' },
    { name: 'David Kim', email: 'david.kim@emailhub.io', share: 13, count: 12380, tone: 'blue' },
    { name: 'Sarah Mitchell', email: 'sarah@brightsidemedia.com', share: 9, count: 8570, tone: 'sky' },
    { name: 'Others', share: 60, count: 57125, tone: 'hatch' },
  ],
}

export const MESSAGE_TYPES = {
  'This Month': [
    { id: 'direct', label: 'Direct', value: 46, delta: 0.3, tone: 'ink' },
    { id: 'campaigns', label: 'Campaigns', value: 30, delta: -25.4, tone: 'teal' },
    { id: 'auto', label: 'Automations', value: 24, delta: 15, tone: 'blue' },
  ],
  'Last Month': [
    { id: 'direct', label: 'Direct', value: 38, delta: -4.1, tone: 'ink' },
    { id: 'campaigns', label: 'Campaigns', value: 41, delta: 12.6, tone: 'teal' },
    { id: 'auto', label: 'Automations', value: 21, delta: 8.2, tone: 'blue' },
  ],
  Quarter: [
    { id: 'direct', label: 'Direct', value: 42, delta: 2.4, tone: 'ink' },
    { id: 'campaigns', label: 'Campaigns', value: 33, delta: -6.8, tone: 'teal' },
    { id: 'auto', label: 'Automations', value: 25, delta: 19.5, tone: 'blue' },
  ],
}
export const MESSAGES_THIS_MONTH = { 'This Month': 38412, 'Last Month': 35060, Quarter: 109870 }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const toYear = (pairs) => pairs.map(([closed, open], i) => ({ m: MONTHS[i], closed, open }))

export const MESSAGES_BY_MONTH = {
  'This Year': toYear([
    [520, 210], [340, 380], [900, 262], [880, 190], [1080, 232], [720, 280],
    [1196, 38], [610, 330], [880, 92], [900, 270], [1380, 64], [900, 262],
  ]),
  'Last Year': toYear([
    [410, 160], [380, 240], [620, 300], [700, 210], [760, 180], [690, 260],
    [880, 140], [820, 190], [940, 120], [1010, 210], [1120, 150], [960, 230],
  ]),
}

/* texts sent — a point per day for 1–25 Jul, and smaller windows */
export const TEXTS = {
  'All time': {
    total: 95215,
    today: 1243,
    delta: 51,
    ticks: ['1 Jul', '8 Jul', '16 Jul', '25 Jul'],
    points: [
      1180, 1150, 1120, 1090, 1040, 1010, 960, 900, 830, 760, 690, 620, 570, 540, 520, 515,
      530, 560, 620, 700, 800, 920, 1030, 1140, 1243,
    ],
    label: (i) => `${i + 1} Jul`,
  },
  'This month': {
    total: 21480,
    today: 1243,
    delta: 18,
    ticks: ['1 Jul', '8 Jul', '16 Jul', '25 Jul'],
    points: [
      620, 700, 760, 740, 820, 900, 860, 940, 1010, 980, 920, 880, 900, 960, 1040, 1100,
      1060, 1010, 1080, 1150, 1120, 1180, 1210, 1190, 1243,
    ],
    label: (i) => `${i + 1} Jul`,
  },
  'This week': {
    total: 7412,
    today: 1243,
    delta: 9,
    ticks: ['Mon', 'Wed', 'Fri', 'Sun'],
    points: [980, 1110, 1060, 1180, 1020, 1090, 1243],
    label: (i) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
  },
}

/* ---------------- people ---------------- */
export const CONTACTS = [
  { id: 1, name: 'Sarah Mitchell', email: 'sarah@brightsidemedia.com', phone: '+1 415 555 0142', company: 'Brightside Media', tags: ['VIP', 'Agency'], messages: 1240, last: '2m ago', status: 'online' },
  { id: 2, name: 'David Kim', email: 'david.kim@emailhub.io', phone: '+1 646 555 0187', company: 'EmailHub', tags: ['Partner'], messages: 850, last: '18m ago', status: 'online', photo: '/people/david.jpg' },
  { id: 3, name: 'Priya Patel', email: 'priya@oakrealty.co', phone: '+1 312 555 0119', company: 'Oak Realty', tags: ['Real estate', 'VIP'], messages: 425, last: '1h ago', status: 'away' },
  { id: 4, name: 'Nora Fitzgerald', email: 'nora@fitzandco.com', phone: '+353 1 555 0173', company: 'Fitz & Co', tags: ['Retail'], messages: 392, last: '3h ago', status: 'online', photo: '/people/nora.jpg' },
  { id: 5, name: 'Lucas Moreau', email: 'lucas@atelier-m.fr', phone: '+33 1 55 50 12 90', company: 'Atelier M', tags: ['Lead'], messages: 266, last: 'Yesterday', status: 'offline', photo: '/people/lucas.jpg' },
  { id: 6, name: 'Elena Park', email: 'elena.park@lumen.studio', phone: '+1 206 555 0164', company: 'Lumen Studio', tags: ['Agency'], messages: 241, last: 'Yesterday', status: 'away', photo: '/people/elena.jpg' },
  { id: 7, name: 'James Carter', email: 'jcarter@northpeak.com', phone: '+1 303 555 0128', company: 'Northpeak', tags: ['Outdoor', 'Lead'], messages: 198, last: '2d ago', status: 'offline', photo: '/people/james.jpg' },
  { id: 8, name: 'Amara Okafor', email: 'amara@kitekitchen.ng', phone: '+234 1 555 0199', company: 'Kite Kitchen', tags: ['Food'], messages: 176, last: '2d ago', status: 'online' },
  { id: 9, name: 'Tom Becker', email: 'tom@beckerbikes.de', phone: '+49 30 5550 1834', company: 'Becker Bikes', tags: ['Retail'], messages: 143, last: '3d ago', status: 'offline' },
  { id: 10, name: 'Hana Sato', email: 'hana@sato-design.jp', phone: '+81 3 5550 2211', company: 'Sato Design', tags: ['Partner'], messages: 120, last: '4d ago', status: 'away' },
  { id: 11, name: 'Mateo Silva', email: 'mateo@ondafit.br', phone: '+55 11 5550 3301', company: 'Onda Fit', tags: ['Fitness', 'Lead'], messages: 97, last: '1w ago', status: 'offline' },
  { id: 12, name: 'Grace Liu', email: 'grace@harborclinic.org', phone: '+1 617 555 0150', company: 'Harbor Clinic', tags: ['Health'], messages: 64, last: '1w ago', status: 'offline' },
]

export const THREADS = [
  {
    id: 2,
    unread: 2,
    pinned: true,
    messages: [
      { from: 'them', text: 'Hey Sarah! The July promo list is uploaded to the shared folder 🙌', at: '09:12' },
      { from: 'me', text: 'Perfect, thanks David. I’ll set it up as a campaign this afternoon.', at: '09:15' },
      { from: 'them', text: 'Could we split it by timezone? West coast folks were asleep last time 😅', at: '09:21' },
      { from: 'them', text: 'Also — can the reminder go out 2h before the event?', at: '09:22' },
    ],
  },
  {
    id: 1,
    unread: 1,
    messages: [
      { from: 'them', text: 'Our delivery report looks amazing this week. 91% 🚀', at: 'Yesterday' },
      { from: 'me', text: 'Right? The new sender IDs made a big difference.', at: 'Yesterday' },
      { from: 'them', text: 'Can you send me the export for the board deck?', at: '08:40' },
    ],
  },
  {
    id: 4,
    messages: [
      { from: 'me', text: 'Hi Nora, your autumn collection blast is scheduled for Friday 10:00.', at: 'Mon' },
      { from: 'them', text: 'Amazing, thank you! Will the preview link be live by then?', at: 'Mon' },
    ],
  },
  {
    id: 3,
    messages: [
      { from: 'them', text: 'Open house on Saturday — can we text everyone in the Oak Park segment?', at: 'Sun' },
      { from: 'me', text: 'Done! 412 contacts, going out Friday at 6pm.', at: 'Sun' },
    ],
  },
  {
    id: 6,
    messages: [{ from: 'them', text: 'Loved the new template gallery ✨', at: 'Sat' }],
  },
  {
    id: 7,
    messages: [{ from: 'them', text: 'Trail season starts next week — let’s plan the launch SMS.', at: 'Fri' }],
  },
]

export const AUTO_REPLIES = [
  'Sounds great — thank you! 🙏',
  'Perfect, I’ll keep an eye out for it.',
  'Love it. Let’s do that.',
  'Got it, talk soon!',
]

/* ---------------- CRM: team ---------------- */
export const TEAM = [
  { name: 'Sarah Jensen', role: 'Head of Sales', photo: '/people/sarah.jpg' },
  { name: 'Omar Haddad', role: 'Account Executive' },
  { name: 'Mia Chen', role: 'Account Executive' },
  { name: 'Leo Hart', role: 'SDR' },
]
export const member = (name) => TEAM.find((t) => t.name === name) || { name }

/* ---------------- leads ---------------- */
export const LEAD_STATUSES = ['All', 'New', 'Contacted', 'Qualified', 'Unqualified']

export const LEADS = [
  { id: 1, name: 'Grace Liu', company: 'Harbor Clinic', email: 'grace@harborclinic.org', source: 'Website', score: 92, status: 'Qualified', owner: 'Sarah Jensen', value: 18400, created: 'Today' },
  { id: 2, name: 'Mateo Silva', company: 'Onda Fit', email: 'mateo@ondafit.br', source: 'Referral', score: 84, status: 'Contacted', owner: 'Omar Haddad', value: 9200, created: 'Today' },
  { id: 3, name: 'Hana Sato', company: 'Sato Design', email: 'hana@sato-design.jp', source: 'LinkedIn', score: 77, status: 'New', owner: 'Mia Chen', value: 6500, created: 'Yesterday' },
  { id: 4, name: 'Tom Becker', company: 'Becker Bikes', email: 'tom@beckerbikes.de', source: 'Events', score: 71, status: 'Contacted', owner: 'Leo Hart', value: 4800, created: 'Yesterday' },
  { id: 5, name: 'Amara Okafor', company: 'Kite Kitchen', email: 'amara@kitekitchen.ng', source: 'Website', score: 66, status: 'New', owner: 'Sarah Jensen', value: 7300, created: '2d ago' },
  { id: 6, name: 'Ivy Morgan', company: 'Morgan Legal', email: 'ivy@morganlegal.com', source: 'Ads', score: 58, status: 'New', owner: 'Mia Chen', value: 11000, created: '2d ago' },
  { id: 7, name: 'Ravi Menon', company: 'Spice Route', email: 'ravi@spiceroute.in', source: 'Referral', score: 49, status: 'Contacted', owner: 'Omar Haddad', value: 3900, created: '3d ago' },
  { id: 8, name: 'Chloe Dubois', company: 'Maison Verte', email: 'chloe@maisonverte.fr', source: 'LinkedIn', score: 41, status: 'Unqualified', owner: 'Leo Hart', value: 2500, created: '4d ago' },
  { id: 9, name: 'Jonas Berg', company: 'Fjord Coffee', email: 'jonas@fjordcoffee.no', source: 'Events', score: 35, status: 'New', owner: 'Leo Hart', value: 2100, created: '5d ago' },
  { id: 10, name: 'Zara Khan', company: 'Bloom Florals', email: 'zara@bloomflorals.co', source: 'Ads', score: 28, status: 'Unqualified', owner: 'Mia Chen', value: 1600, created: '1w ago' },
]

/* ---------------- deals pipeline ---------------- */
export const STAGES = [
  { id: 'new', label: 'New', tone: 'sky' },
  { id: 'qualified', label: 'Qualified', tone: 'blue' },
  { id: 'proposal', label: 'Proposal', tone: 'violet' },
  { id: 'negotiation', label: 'Negotiation', tone: 'amber' },
  { id: 'won', label: 'Won', tone: 'teal' },
  { id: 'lost', label: 'Lost', tone: 'mute' },
]

export const DEALS = [
  { id: 1, name: 'Clinic reminders', company: 'Harbor Clinic', value: 18400, stage: 'new', owner: 'Sarah Jensen', close: 'Aug 20' },
  { id: 2, name: 'Studio launch kit', company: 'Sato Design', value: 6500, stage: 'new', owner: 'Mia Chen', close: 'Aug 28' },
  { id: 3, name: 'Legal intake bot', company: 'Morgan Legal', value: 11000, stage: 'new', owner: 'Mia Chen', close: 'Sep 04' },
  { id: 4, name: 'Member SMS plan', company: 'Onda Fit', value: 9200, stage: 'qualified', owner: 'Omar Haddad', close: 'Aug 15' },
  { id: 5, name: 'Store alerts', company: 'Becker Bikes', value: 4800, stage: 'qualified', owner: 'Leo Hart', close: 'Aug 18' },
  { id: 6, name: 'Open-house blasts', company: 'Oak Realty', value: 14200, stage: 'proposal', owner: 'Sarah Jensen', close: 'Aug 08' },
  { id: 7, name: 'Autumn VIP drop', company: 'Fitz & Co', value: 8600, stage: 'proposal', owner: 'Mia Chen', close: 'Aug 11' },
  { id: 8, name: 'Agency reseller', company: 'Brightside Media', value: 32000, stage: 'negotiation', owner: 'Sarah Jensen', close: 'Jul 31' },
  { id: 9, name: 'Trail season', company: 'Northpeak', value: 12500, stage: 'negotiation', owner: 'Omar Haddad', close: 'Aug 02' },
  { id: 10, name: 'API partnership', company: 'EmailHub', value: 27500, stage: 'won', owner: 'Sarah Jensen', close: 'Jul 22' },
  { id: 11, name: 'Brunch promos', company: 'Kite Kitchen', value: 7300, stage: 'won', owner: 'Leo Hart', close: 'Jul 19' },
]

/* ---------------- companies ---------------- */
export const COMPANIES = [
  { id: 1, name: 'Brightside Media', industry: 'Media agency', city: 'New York', pipeline: 32000, deals: 2, people: 14, health: 92, owner: 'Sarah Jensen', hue: 210 },
  { id: 2, name: 'EmailHub', industry: 'SaaS', city: 'Seoul', pipeline: 27500, deals: 1, people: 9, health: 88, owner: 'Sarah Jensen', hue: 168 },
  { id: 3, name: 'Oak Realty', industry: 'Real estate', city: 'Chicago', pipeline: 14200, deals: 1, people: 6, health: 74, owner: 'Sarah Jensen', hue: 32 },
  { id: 4, name: 'Northpeak', industry: 'Outdoor gear', city: 'Denver', pipeline: 12500, deals: 1, people: 5, health: 61, owner: 'Omar Haddad', hue: 140 },
  { id: 5, name: 'Fitz & Co', industry: 'Retail', city: 'Dublin', pipeline: 8600, deals: 1, people: 7, health: 83, owner: 'Mia Chen', hue: 330 },
  { id: 6, name: 'Kite Kitchen', industry: 'Restaurants', city: 'Lagos', pipeline: 7300, deals: 1, people: 4, health: 95, owner: 'Leo Hart', hue: 18 },
  { id: 7, name: 'Lumen Studio', industry: 'Design', city: 'Seattle', pipeline: 0, deals: 0, people: 3, health: 38, owner: 'Mia Chen', hue: 265 },
  { id: 8, name: 'Atelier M', industry: 'Fashion', city: 'Paris', pipeline: 0, deals: 0, people: 2, health: 45, owner: 'Omar Haddad', hue: 350 },
]

/* ---------------- tasks ---------------- */
export const TASKS = [
  { id: 1, title: 'Send revised proposal', related: 'Brightside Media', due: 'Yesterday', group: 'Overdue', type: 'mail', priority: 'high' },
  { id: 2, title: 'Call Grace about clinic pilot', related: 'Harbor Clinic', due: '10:30', group: 'Today', type: 'phone', priority: 'high' },
  { id: 3, title: 'Demo for Onda Fit team', related: 'Member SMS plan', due: '13:00', group: 'Today', type: 'video', priority: 'medium' },
  { id: 4, title: 'Update Oak Realty pricing sheet', related: 'Open-house blasts', due: '15:30', group: 'Today', type: 'doc', priority: 'medium' },
  { id: 5, title: 'Follow up with Tom Becker', related: 'Becker Bikes', due: '17:00', group: 'Today', type: 'mail', priority: 'low' },
  { id: 6, title: 'Contract review with legal', related: 'Trail season', due: 'Mon', group: 'Upcoming', type: 'doc', priority: 'high' },
  { id: 7, title: 'Quarterly check-in', related: 'EmailHub', due: 'Tue', group: 'Upcoming', type: 'video', priority: 'low' },
  { id: 8, title: 'Plan autumn campaign brief', related: 'Fitz & Co', due: 'Aug 02', group: 'Upcoming', type: 'doc', priority: 'medium' },
]

/* ---------------- calendar — week of Mon 21 to Fri 25 July ---------------- */
export const WEEK = ['Mon 21', 'Tue 22', 'Wed 23', 'Thu 24', 'Fri 25']
export const TODAY_INDEX = 4
export const EVENTS = [
  { id: 1, day: 0, start: 9.5, end: 10.5, title: 'Pipeline review', who: 'Sales team', type: 'meeting' },
  { id: 2, day: 0, start: 13, end: 14, title: 'Onda Fit intro', who: 'Mateo Silva', type: 'call' },
  { id: 3, day: 1, start: 10, end: 11.5, title: 'EmailHub QBR', who: 'David Kim', type: 'meeting' },
  { id: 4, day: 1, start: 15, end: 16, title: 'Product demo', who: 'Sato Design', type: 'demo' },
  { id: 5, day: 2, start: 9, end: 11, title: 'Focus — proposals', who: 'Just you', type: 'focus' },
  { id: 6, day: 2, start: 14, end: 15, title: 'Northpeak pricing', who: 'James Carter', type: 'call' },
  { id: 7, day: 3, start: 11, end: 12, title: 'Oak Realty walkthrough', who: 'Priya Patel', type: 'demo' },
  { id: 8, day: 3, start: 16, end: 17, title: '1:1 with Leo', who: 'Leo Hart', type: 'meeting' },
  { id: 9, day: 4, start: 10.5, end: 11, title: 'Call Grace Liu', who: 'Harbor Clinic', type: 'call' },
  { id: 10, day: 4, start: 13, end: 14, title: 'Onda Fit demo', who: 'Mateo Silva', type: 'demo' },
  { id: 11, day: 4, start: 15.5, end: 16.5, title: 'Brightside negotiation', who: 'Sarah Mitchell', type: 'meeting' },
]

/* ---------------- sales reports ---------------- */
export const SALES_BY_MONTH = {
  'This Year': toYear([
    [42, 18], [38, 26], [61, 22], [58, 30], [72, 24], [66, 35],
    [84, 12], [52, 40], [70, 28], [76, 31], [94, 16], [68, 34],
  ]),
  'Last Year': toYear([
    [31, 20], [29, 22], [44, 25], [47, 19], [52, 27], [49, 30],
    [58, 21], [55, 24], [61, 22], [64, 26], [71, 18], [66, 25],
  ]),
}

export const LEAD_SOURCES = [
  { id: 'web', label: 'Website', value: 38, delta: 6.2, tone: 'ink' },
  { id: 'ref', label: 'Referral', value: 24, delta: 3.1, tone: 'teal' },
  { id: 'li', label: 'LinkedIn', value: 22, delta: -1.8, tone: 'blue' },
  { id: 'ev', label: 'Events', value: 16, delta: 4.4, tone: 'sky' },
]

export const LEADERBOARD = [
  { name: 'Sarah Jensen', won: 14, revenue: 186400, quota: 112 },
  { name: 'Omar Haddad', won: 11, revenue: 142900, quota: 94 },
  { name: 'Mia Chen', won: 9, revenue: 118300, quota: 87 },
  { name: 'Leo Hart', won: 6, revenue: 64100, quota: 71 },
]

/* ---------------- integrations ---------------- */
export const INTEGRATIONS = [
  { id: 'shopify', name: 'Shopify', cat: 'Commerce', desc: 'Sync orders and customers into contacts', hue: 140, on: true, stat: '2,140 orders synced' },
  { id: 'stripe', name: 'Stripe', cat: 'Payments', desc: 'See payments and invoices on every deal', hue: 250, on: true, stat: '$84k this month' },
  { id: 'whatsapp', name: 'WhatsApp', cat: 'Messaging', desc: 'Reply to WhatsApp chats from the inbox', hue: 145, on: true, stat: '612 chats' },
  { id: 'gmail', name: 'Gmail', cat: 'Email', desc: 'Log emails to contacts automatically', hue: 4, on: true, stat: '3,920 emails logged' },
  { id: 'gcal', name: 'Google Calendar', cat: 'Meetings', desc: 'Two-way sync for calls and demos', hue: 214, on: false, stat: 'Not connected' },
  { id: 'slack', name: 'Slack', cat: 'Alerts', desc: 'Post won deals and hot leads to a channel', hue: 300, on: false, stat: 'Not connected' },
  { id: 'zoom', name: 'Zoom', cat: 'Calls', desc: 'Start meetings and save recordings', hue: 220, on: true, stat: '48 meetings' },
  { id: 'quickbooks', name: 'QuickBooks', cat: 'Accounting', desc: 'Push won deals as invoices', hue: 120, on: false, stat: 'Not connected' },
]

export const FAQ = [
  { q: 'Why are some messages still pending?', a: 'Carriers can queue messages during peak hours. Pending messages retry automatically for 24 hours — you only pay for the ones that are delivered.' },
  { q: 'How are credits charged?', a: 'One credit is one SMS segment (160 characters). Emoji and special characters shorten a segment to 70 characters, so long messages can use more than one credit.' },
  { q: 'Can I send to contacts in other countries?', a: 'Yes. Myflow delivers to 190+ countries. International rates are shown in Billing › Rates before you send.' },
  { q: 'How do I move a deal to another stage?', a: 'Open Deals and drag the card into any column. The pipeline totals update straight away and the deal owner is notified.' },
]
