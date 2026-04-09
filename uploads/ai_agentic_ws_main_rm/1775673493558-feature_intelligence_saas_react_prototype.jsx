import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Database,
  Workflow,
  Library,
  Network,
  BarChart3,
  Brain,
  Bookmark,
  Users,
  ShieldCheck,
  Search,
  Bell,
  Settings,
  Upload,
  Link2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Layers3,
  GitBranch,
  Sparkles,
  ArrowRight,
  Filter,
  Download,
  MessageSquare,
  Wand2,
  Activity,
  FolderKanban,
  Boxes,
  ServerCog,
  Lock,
  KeyRound,
  LineChart,
  PieChart,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sources', label: 'Data Sources', icon: Database },
  { id: 'pipeline', label: 'Processing', icon: Workflow },
  { id: 'repository', label: 'Feature Repository', icon: Library },
  { id: 'relationships', label: 'Relationships', icon: Network },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: Brain },
  { id: 'saved', label: 'Saved Views', icon: Bookmark },
  { id: 'collab', label: 'Collaboration', icon: Users },
  { id: 'settings', label: 'Tenant Settings', icon: Settings },
];

const stats = [
  { label: 'Features Extracted', value: '12,480', delta: '+18%' },
  { label: 'Duplicate Candidates', value: '384', delta: '-9%' },
  { label: 'Connected Sources', value: '24', delta: '+4' },
  { label: 'Processing Accuracy', value: '92.7%', delta: '+1.4%' },
];

const sources = [
  { name: 'Jira Cloud', status: 'Connected', projects: 18, sync: 'Every 30 mins' },
  { name: 'Azure DevOps', status: 'Connected', projects: 9, sync: 'Hourly' },
  { name: 'Confluence', status: 'Connected', projects: 22, sync: 'Daily' },
  { name: 'PDF Uploads', status: 'Active', projects: 164, sync: 'Manual + OCR optional' },
  { name: 'SharePoint', status: 'Pending', projects: 0, sync: 'Not scheduled' },
];

const features = [
  {
    name: 'Role-based approval workflow',
    module: 'Admin',
    status: 'In Review',
    source: 'Jira + PRD PDF',
    confidence: 94,
    tags: ['Workflow', 'RBAC', 'Enterprise'],
  },
  {
    name: 'Bulk feature merge suggestions',
    module: 'Repository',
    status: 'Planned',
    source: 'ADO Stories',
    confidence: 88,
    tags: ['Deduplication', 'AI'],
  },
  {
    name: 'Traceability to source artifacts',
    module: 'Core Platform',
    status: 'Shipped',
    source: 'Confluence',
    confidence: 97,
    tags: ['Audit', 'Compliance'],
  },
  {
    name: 'Customer feedback to feature mapping',
    module: 'Insights',
    status: 'Exploring',
    source: 'Interview docs',
    confidence: 83,
    tags: ['VoC', 'Analytics'],
  },
];

const reports = [
  'Duplicate effort report',
  'Feature coverage by module',
  'Emerging themes across incoming documents',
  'Team-wise ownership and backlog clustering',
  'Roadmap-ready features awaiting approval',
];

function Shell({ current, setCurrent, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r bg-white p-4">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">FeatureIntel</div>
              <div className="text-xs text-slate-500">SaaS product concept</div>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Architecture</div>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2"><Boxes className="h-4 w-4" /> React app shell</div>
              <div className="flex items-center gap-2"><ServerCog className="h-4 w-4" /> API gateway + workers</div>
              <div className="flex items-center gap-2"><Brain className="h-4 w-4" /> NLP / LLM extraction</div>
              <div className="flex items-center gap-2"><FolderKanban className="h-4 w-4" /> Feature knowledge graph</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Tenant RBAC + audit</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrent(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-2xl font-semibold">Feature Intelligence Platform</div>
              <div className="text-sm text-slate-500">Architecture, wireframes, and core SaaS screens in one React prototype</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input className="w-72 rounded-2xl pl-9" placeholder="Search features, reports, sources..." />
              </div>
              <Button variant="outline" className="rounded-2xl"><Bell className="mr-2 h-4 w-4" />Alerts</Button>
              <Button className="rounded-2xl"><Upload className="mr-2 h-4 w-4" />Ingest Data</Button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function ArchitectureOverview() {
  const layers = [
    {
      title: 'Presentation Layer',
      items: ['React app', 'Admin portal', 'Analyst workspace', 'Embedded Jira/ADO widgets'],
      icon: LayoutDashboard,
    },
    {
      title: 'Application Layer',
      items: ['Auth & tenancy', 'Workflow orchestration', 'Saved views', 'Comments & approvals'],
      icon: Layers3,
    },
    {
      title: 'AI / Intelligence Layer',
      items: ['Extraction service', 'Dedup engine', 'Classification', 'Recommendation engine'],
      icon: Brain,
    },
    {
      title: 'Data Layer',
      items: ['Feature repository', 'Vector store', 'Audit logs', 'Report marts'],
      icon: Database,
    },
    {
      title: 'Integration Layer',
      items: ['Jira', 'ADO', 'Confluence', 'Notion', 'SharePoint', 'PDF / API uploads'],
      icon: Link2,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Suggested SaaS architecture</CardTitle>
          <CardDescription>Multi-tenant platform focused on ingestion, AI extraction, governance, and product decision workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-5">
            {layers.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={layer.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-3xl border bg-white p-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4" /> {layer.title}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    {layer.items.map((item) => (
                      <div key={item} className="rounded-xl bg-slate-50 px-3 py-2">{item}</div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Data flow</CardTitle>
            <CardDescription>How raw sources become a governed feature repository</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              {[
                ['Connect', 'Source adapters and auth'],
                ['Parse', 'Text, metadata, attachment handling'],
                ['Extract', 'Feature, acceptance criteria, entities'],
                ['Normalize', 'Dedup, cluster, classify'],
                ['Govern', 'Review, audit, report, publish'],
              ].map(([title, desc], i) => (
                <div key={title} className="relative rounded-3xl border bg-slate-50 p-4">
                  <div className="mb-2 text-sm font-semibold">{title}</div>
                  <div className="text-xs text-slate-600">{desc}</div>
                  {i < 4 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-slate-400 md:block" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Core SaaS capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            {[
              ['Multi-tenancy', 'Workspace isolation, SSO, role-based access'],
              ['Auditability', 'Source links, confidence scores, approvals'],
              ['Scale', 'Async jobs, queue-based processing, retries'],
              ['Compliance', 'PII controls, data retention, encryption'],
              ['Monetization', 'Usage tiers by source volume, seats, AI runs'],
            ].map(([a, b]) => (
              <div key={a} className="rounded-2xl border p-3">
                <div className="font-medium">{a}</div>
                <div className="text-slate-500">{b}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="rounded-3xl border-none shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-3xl font-semibold">{item.value}</div>
                <Badge variant="secondary" className="rounded-full">{item.delta}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Wireframe: executive dashboard</CardTitle>
            <CardDescription>Top KPI strip, trend charts, duplicate summary, feature activity feed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium">Feature growth trend</div>
                  <LineChart className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex h-56 items-end gap-3 rounded-2xl bg-slate-50 p-4">
                  {[35, 52, 44, 63, 71, 68, 82, 90, 86, 96].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t-2xl bg-slate-300" style={{ height: `${v}%` }} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium"><GitBranch className="h-4 w-4" /> Duplicate hotspots</div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-3">Payments: 41 duplicate candidates</div>
                    <div className="rounded-2xl bg-slate-50 p-3">Admin: 23 overlapping flows</div>
                    <div className="rounded-2xl bg-slate-50 p-3">Reports: 17 near-matches</div>
                  </div>
                </div>
                <div className="rounded-3xl border p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4" /> Activity feed</div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div>PDF batch #328 extracted 94 features</div>
                    <div>7 feature merges approved by product ops</div>
                    <div>New monthly report generated for leadership</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm">
          <CardHeader>
            <CardTitle>Decision panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-slate-900 p-4 text-white">
              <div className="text-sm font-medium">AI summary</div>
              <div className="mt-2 text-sm text-slate-200">Two teams appear to be defining similar approval features. Merge review recommended before sprint planning.</div>
            </div>
            {[['Coverage gap', 'Self-service billing has low feature density'], ['Risk alert', 'Low confidence extraction in legacy PDF set'], ['Action', 'Review 13 unapproved enterprise features']].map(([a,b]) => (
              <div key={a} className="rounded-2xl border p-3">
                <div className="text-sm font-medium">{a}</div>
                <div className="text-sm text-slate-500">{b}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SourcesScreen() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Wireframe: data sources & ingestion</CardTitle>
          <CardDescription>Connection cards, sync controls, project selectors, source health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sources.map((s) => (
            <div key={s.name} className="grid gap-3 rounded-3xl border p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-slate-500">{s.projects} repositories / projects</div>
              </div>
              <Badge className="rounded-full" variant="secondary">{s.status}</Badge>
              <div className="text-sm text-slate-500">{s.sync}</div>
              <Button variant="outline" className="rounded-2xl">Manage</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Ingestion setup panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-2xl border p-4">
            <div className="mb-2 font-medium">Add source</div>
            <div className="grid gap-3">
              <Input placeholder="Workspace / tenant name" className="rounded-2xl" />
              <Input placeholder="API token / OAuth connected" className="rounded-2xl" />
              <div className="grid grid-cols-2 gap-3">
                <Button className="rounded-2xl"><Link2 className="mr-2 h-4 w-4" />Connect</Button>
                <Button variant="outline" className="rounded-2xl"><Upload className="mr-2 h-4 w-4" />Upload files</Button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="font-medium">Source preview</div>
            <div className="mt-2 space-y-2 text-slate-600">
              <div>• 1,203 Jira stories available for sync</div>
              <div>• 218 ADO work items pending parse</div>
              <div>• 34 PDFs with attachments detected</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineScreen() {
  const stages = [
    { label: 'Ingested', value: 100 },
    { label: 'Parsed', value: 86 },
    { label: 'Extracted', value: 72 },
    { label: 'Deduplicated', value: 58 },
    { label: 'Approved', value: 41 },
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Wireframe: processing pipeline</CardTitle>
          <CardDescription>Queue health, stage progression, manual retry, exception handling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {stages.map((stage) => (
            <div key={stage.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>{stage.label}</span>
                <span className="text-slate-500">{stage.value}%</span>
              </div>
              <Progress value={stage.value} className="h-3" />
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Low confidence batch', '17 docs', AlertTriangle],
              ['Manual reviews waiting', '42 items', Clock3],
              ['Completed today', '1,842 items', CheckCircle2],
            ].map(([title, value, Icon]) => (
              <div key={title} className="rounded-2xl border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4" />{title}</div>
                <div className="text-2xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Pipeline controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            'Retry failed parsing jobs',
            'Escalate low-confidence extraction for approval',
            'Re-run deduplication with stricter threshold',
            'Switch classifier from module-first to persona-first',
          ].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-2xl border p-3">
              <div>{item}</div>
              <Button variant="outline" className="rounded-2xl">Run</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RepositoryScreen() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => features.filter((f) => `${f.name} ${f.module} ${f.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <Card className="rounded-3xl border-none shadow-sm">
      <CardHeader>
        <CardTitle>Wireframe: feature repository</CardTitle>
        <CardDescription>Main operating screen for analysts and product teams</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="w-80 rounded-2xl pl-9" placeholder="Search repository" />
            </div>
            <Button variant="outline" className="rounded-2xl"><Filter className="mr-2 h-4 w-4" />Filters</Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button className="rounded-2xl"><Wand2 className="mr-2 h-4 w-4" />AI Merge Suggestions</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>Feature</div><div>Module</div><div>Status</div><div>Confidence</div><div>Source</div>
          </div>
          {filtered.map((f) => (
            <div key={f.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center border-t px-4 py-4 text-sm">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="mt-1 flex flex-wrap gap-2">{f.tags.map((t) => <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>)}</div>
              </div>
              <div>{f.module}</div>
              <div>{f.status}</div>
              <div>{f.confidence}%</div>
              <div className="text-slate-500">{f.source}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RelationshipScreen() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Wireframe: clusters & relationships</CardTitle>
          <CardDescription>Graph exploration for duplicate work, dependencies, and cross-team overlap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative flex h-[420px] items-center justify-center rounded-3xl border bg-slate-50">
            <div className="absolute left-16 top-20 rounded-full border bg-white px-4 py-3 shadow-sm">Billing Sync</div>
            <div className="absolute left-1/2 top-14 -translate-x-1/2 rounded-full border bg-white px-4 py-3 shadow-sm">Approval Workflow</div>
            <div className="absolute right-20 top-24 rounded-full border bg-white px-4 py-3 shadow-sm">Access Control</div>
            <div className="absolute bottom-24 left-24 rounded-full border bg-white px-4 py-3 shadow-sm">Reporting Export</div>
            <div className="absolute bottom-16 right-24 rounded-full border bg-white px-4 py-3 shadow-sm">Audit Traceability</div>
            <svg className="absolute inset-0 h-full w-full">
              <line x1="160" y1="110" x2="390" y2="100" stroke="currentColor" className="text-slate-300" strokeWidth="2" />
              <line x1="420" y1="100" x2="650" y2="115" stroke="currentColor" className="text-slate-300" strokeWidth="2" />
              <line x1="390" y1="120" x2="220" y2="320" stroke="currentColor" className="text-slate-300" strokeWidth="2" />
              <line x1="430" y1="120" x2="620" y2="335" stroke="currentColor" className="text-slate-300" strokeWidth="2" />
            </svg>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Relationship filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            'Show only duplicate candidates',
            'Show cross-team dependencies',
            'Highlight low-confidence clusters',
            'Overlay roadmap ownership',
          ].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-2xl border p-3">
              <div>{item}</div>
              <Check className="h-4 w-4 text-slate-500" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsScreen() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Wireframe: reports & exports</CardTitle>
          <CardDescription>Leadership and operations reporting center</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.map((report) => (
            <div key={report} className="flex items-center justify-between rounded-2xl border p-4">
              <div className="flex items-center gap-3"><FileText className="h-4 w-4" />{report}</div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-2xl">Preview</Button>
                <Button className="rounded-2xl">Generate</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Analytics panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-medium">Feature distribution by module <PieChart className="h-4 w-4" /></div>
            <div className="grid gap-3">
              {[
                ['Core Platform', 82],
                ['Admin', 64],
                ['Reporting', 51],
                ['Integrations', 39],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-sm"><span>{k}</span><span>{v}</span></div>
                  <Progress value={Number(v)} className="h-3" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightsScreen() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Wireframe: AI insights</CardTitle>
          <CardDescription>Premium layer turning extracted data into decisions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ['Possible duplicate roadmap item', 'Three teams describe a similar access approval workflow in different terms.'],
            ['Untapped demand signal', 'Customer interviews mention export automation 19 times with no matching shipped feature.'],
            ['Coverage gap', 'SMB onboarding has lower feature density than enterprise onboarding.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-3xl border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Brain className="h-4 w-4" />{title}</div>
              <div className="text-sm text-slate-600">{body}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Ask the repository</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Example: “Show me all payment-related features from last quarter with duplicate probability above 70%.”</div>
          <Input className="rounded-2xl" placeholder="Ask a natural-language question" />
          <Button className="rounded-2xl w-full"><MessageSquare className="mr-2 h-4 w-4" />Run AI query</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SavedViewsScreen() {
  return (
    <Card className="rounded-3xl border-none shadow-sm">
      <CardHeader>
        <CardTitle>Wireframe: saved views / knowledge base</CardTitle>
        <CardDescription>Bookmark filtered contexts for recurring analysis workflows</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ['Q2 Enterprise Features', '42 features • shared with product leadership'],
          ['Payments Duplicate Review', '17 merge candidates • awaiting action'],
          ['Mobile Experience Gaps', 'Coverage comparison across app journeys'],
          ['Roadmap Draft Candidates', 'Unshipped but validated features'],
          ['Compliance Traceability', 'Audit-friendly source-linked items'],
          ['Weekly PM Report', 'Auto-refreshed every Monday 8 AM'],
        ].map(([title, desc]) => (
          <div key={title} className="rounded-3xl border p-4">
            <div className="mb-2 flex items-center gap-2 font-medium"><Bookmark className="h-4 w-4" />{title}</div>
            <div className="text-sm text-slate-500">{desc}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CollaborationScreen() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Wireframe: collaboration</CardTitle>
          <CardDescription>Comments, assignments, approvals, and change tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ['PM Review Requested', 'Approval workflow feature needs decision by Friday'],
            ['Engineering Comment', 'These two ADO stories are implementation variants of one feature'],
            ['Ops Note', 'Legacy PDFs have lower extraction confidence; review manually'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border p-4">
              <div className="font-medium">{title}</div>
              <div className="mt-1 text-sm text-slate-500">{body}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Approval workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            ['Approve feature merge', 'pending'],
            ['Reject low-confidence extraction', 'pending'],
            ['Escalate compliance-tagged features', 'done'],
          ].map(([task, status]) => (
            <div key={task} className="flex items-center justify-between rounded-2xl border p-3 text-sm">
              <div>{task}</div>
              <Badge variant={status === 'done' ? 'default' : 'secondary'} className="rounded-full">{status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Tenant settings</CardTitle>
          <CardDescription>Enterprise controls for a monetizable SaaS product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {[
            ['SSO / SAML', Lock],
            ['API keys and service accounts', KeyRound],
            ['Workspace-level retention policies', ShieldCheck],
            ['Usage limits and AI credits', Activity],
          ].map(([label, Icon]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border p-4">
              <div className="flex items-center gap-3"><Icon className="h-4 w-4" />{label}</div>
              <Button variant="outline" className="rounded-2xl">Configure</Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Pricing model ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-4">Starter: limited sources, basic extraction, shared dashboard</div>
          <div className="rounded-2xl bg-slate-50 p-4">Growth: more source syncs, repository workflows, scheduled reports</div>
          <div className="rounded-2xl bg-slate-50 p-4">Enterprise: SSO, approvals, audit logs, AI insights, private deployment options</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FeatureIntelPrototype() {
  const [current, setCurrent] = useState('overview');

  const content = {
    overview: <ArchitectureOverview />,
    dashboard: <DashboardScreen />,
    sources: <SourcesScreen />,
    pipeline: <PipelineScreen />,
    repository: <RepositoryScreen />,
    relationships: <RelationshipScreen />,
    reports: <ReportsScreen />,
    insights: <InsightsScreen />,
    saved: <SavedViewsScreen />,
    collab: <CollaborationScreen />,
    settings: <SettingsScreen />,
  };

  return <Shell current={current} setCurrent={setCurrent}>{content[current]}</Shell>;
}
