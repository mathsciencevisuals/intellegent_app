export const stats = [
  { label: 'Features Extracted', value: '12,480', delta: '+18%' },
  { label: 'Duplicate Candidates', value: '384', delta: '-9%' },
  { label: 'Connected Sources', value: '24', delta: '+4' },
  { label: 'Processing Accuracy', value: '92.7%', delta: '+1.4%' },
];

export const sources = [
  { name: 'Jira Cloud', status: 'Connected', projects: 18, sync: 'Every 30 mins' },
  { name: 'Azure DevOps', status: 'Connected', projects: 9, sync: 'Hourly' },
  { name: 'Confluence', status: 'Connected', projects: 22, sync: 'Daily' },
  { name: 'PDF Uploads', status: 'Active', projects: 164, sync: 'Manual + OCR optional' },
  { name: 'SharePoint', status: 'Pending', projects: 0, sync: 'Not scheduled' },
];

export const features = [
  {
    id: 'role-based-approval-workflow',
    name: 'Role-based approval workflow',
    module: 'Admin',
    status: 'In Review',
    source: 'Jira + PRD PDF',
    confidence: 94,
    tags: ['Workflow', 'RBAC', 'Enterprise'],
    summary: 'Approval steps extracted from multiple stories and normalized into one candidate feature.',
  },
  {
    id: 'bulk-feature-merge-suggestions',
    name: 'Bulk feature merge suggestions',
    module: 'Repository',
    status: 'Planned',
    source: 'ADO Stories',
    confidence: 88,
    tags: ['Deduplication', 'AI'],
    summary: 'Near-duplicate stories are clustered and surfaced with recommended merge actions.',
  },
  {
    id: 'traceability-to-source-artifacts',
    name: 'Traceability to source artifacts',
    module: 'Core Platform',
    status: 'Shipped',
    source: 'Confluence',
    confidence: 97,
    tags: ['Audit', 'Compliance'],
    summary: 'Every extracted feature retains source references and a reason trail.',
  },
  {
    id: 'customer-feedback-to-feature-mapping',
    name: 'Customer feedback to feature mapping',
    module: 'Insights',
    status: 'Exploring',
    source: 'Interview docs',
    confidence: 83,
    tags: ['VoC', 'Analytics'],
    summary: 'Links interview or support language to known feature themes.',
  },
];

export const reports = [
  'Duplicate effort report',
  'Feature coverage by module',
  'Emerging themes across incoming documents',
  'Team-wise ownership and backlog clustering',
  'Roadmap-ready features awaiting approval',
];

export const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/auth', label: 'Auth' },
  { href: '/onboarding', label: 'Onboarding' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sources', label: 'Data Sources' },
  { href: '/pipeline', label: 'Processing' },
  { href: '/repository', label: 'Feature Repository' },
  { href: '/relationships', label: 'Relationships' },
  { href: '/reports', label: 'Reports' },
  { href: '/insights', label: 'AI Insights' },
  { href: '/saved', label: 'Saved Views' },
  { href: '/collaboration', label: 'Collaboration' },
  { href: '/billing', label: 'Billing' },
  { href: '/settings', label: 'Tenant Settings' },
  { href: '/roadmap', label: 'MVP Roadmap' },
];
