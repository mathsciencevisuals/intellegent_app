"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export type CapabilityCard = {
  id: string;
  title: string;
  module: string;
  description: string;
  maturity: "NON_AGENTIC" | "PARTIAL" | "AGENTIC";
  gapDescription: string;
  recommendation: string;
  agentType: string;
  impactTags: string[];
  scores: {
    roi: number;
    repeatability: number;
    risk: number;
    dataAvailability: number;
  };
  scoreExplanations: {
    roiPotential: string;
    repeatability: string;
    risk: string;
    dataAvailability: string;
  };
  impact: {
    weeklyHours: number;
    yearlyHours: number;
    annualDollar: number;
  };
  priorityScore: number;
};

export type FeaturesStats = {
  features: number;
  gaps: number;
  partial: number;
  automated: number;
  hoursPerWeek: number;
};

const MODULE_BORDER_COLORS = [
  "border-l-violet-500",
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
  "border-l-orange-500",
  "border-l-teal-500",
];

function getModuleBorderColor(module: string, allModules: string[]) {
  const idx = allModules.indexOf(module);
  return MODULE_BORDER_COLORS[idx % MODULE_BORDER_COLORS.length];
}

function ScoreBar({
  label,
  score,
  description,
  compact = false,
}: {
  label: string;
  score: number;
  description?: string;
  compact?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, score));
  const barColor =
    pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-red-400";

  if (compact) {
    return (
      <div className="min-w-0">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {label}
          </span>
          <span className="text-[10px] font-bold text-neutral-700">{pct}</span>
        </div>
        <div className="h-1 w-full rounded-full bg-neutral-100">
          <div
            className={`h-1 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
          {label}
        </span>
        <span className="text-xs font-bold text-neutral-900">{pct}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-100">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {description && (
        <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
      )}
    </div>
  );
}

function MaturityBadge({ maturity }: { maturity: CapabilityCard["maturity"] }) {
  const config = {
    NON_AGENTIC: {
      label: "Gap",
      cls: "border-red-200 bg-red-50 text-red-700",
    },
    PARTIAL: {
      label: "Partial",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    },
    AGENTIC: {
      label: "Automated",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };
  const { label, cls } = config[maturity];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

type SortKey = "priority" | "roi" | "risk";
type MaturityFilter = CapabilityCard["maturity"] | null;

export function FeaturesPanel({
  capabilities,
  stats,
  workspaceName,
  scoreGuide,
}: {
  capabilities: CapabilityCard[];
  stats: FeaturesStats;
  workspaceName: string;
  scoreGuide?: string;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeMaturity, setActiveMaturity] = useState<MaturityFilter>(null);
  const [sort, setSort] = useState<SortKey>("priority");

  const allModules = useMemo(
    () => Array.from(new Set(capabilities.map((c) => c.module))).sort(),
    [capabilities]
  );

  const tierCards = [
    {
      maturity: "NON_AGENTIC" as const,
      label: "Non-Agentic",
      description: "Manual workflows with full automation potential",
      topBorder: "border-t-red-400",
      count: capabilities.filter((c) => c.maturity === "NON_AGENTIC").length,
    },
    {
      maturity: "PARTIAL" as const,
      label: "Partial",
      description: "Partially automated — ready for full agent handoff",
      topBorder: "border-t-amber-400",
      count: capabilities.filter((c) => c.maturity === "PARTIAL").length,
    },
    {
      maturity: "AGENTIC" as const,
      label: "Already Agentic",
      description: "Fully automated or agent-managed workflows",
      topBorder: "border-t-emerald-500",
      count: capabilities.filter((c) => c.maturity === "AGENTIC").length,
    },
  ];

  const filtered = useMemo(() => {
    let list = capabilities;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.module.toLowerCase().includes(q)
      );
    }
    if (activeModule) {
      list = list.filter((c) => c.module === activeModule);
    }
    if (activeMaturity) {
      list = list.filter((c) => c.maturity === activeMaturity);
    }
    return [...list].sort((a, b) => {
      if (sort === "roi") return b.scores.roi - a.scores.roi;
      if (sort === "risk") return b.scores.risk - a.scores.risk;
      return b.priorityScore - a.priorityScore;
    });
  }, [capabilities, search, activeModule, activeMaturity, sort]);

  const filteredModules = useMemo(
    () => Array.from(new Set(filtered.map((c) => c.module))).sort(),
    [filtered]
  );

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleMaturity(m: CapabilityCard["maturity"]) {
    setActiveMaturity((prev) => (prev === m ? null : m));
  }

  return (
    <div className="space-y-6">
      {/* Header row: title + summary | stat tiles */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{workspaceName}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {stats.gaps} automation gap{stats.gaps !== 1 ? "s" : ""} identified across{" "}
            {allModules.length} module{allModules.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {(
            [
              { label: "Features", value: stats.features },
              { label: "Gaps", value: stats.gaps },
              { label: "Partial", value: stats.partial },
              { label: "Automated", value: stats.automated },
              { label: "Hrs/Week", value: stats.hoursPerWeek },
            ] as const
          ).map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border bg-white px-4 py-3 text-center shadow-sm"
            >
              <div className="text-xl font-bold text-neutral-900">{value}</div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {tierCards.map((tier) => {
          const active = activeMaturity === tier.maturity;
          return (
            <button
              key={tier.maturity}
              onClick={() => toggleMaturity(tier.maturity)}
              className={`rounded-2xl border-t-4 bg-white p-5 text-left shadow-sm transition hover:shadow-md ${tier.topBorder} ${active ? "ring-2 ring-neutral-900 ring-offset-1" : ""}`}
            >
              <div className="text-3xl font-bold text-neutral-900">{tier.count}</div>
              <div className="mt-1 text-sm font-semibold text-neutral-800">{tier.label}</div>
              <div className="mt-1 text-xs text-neutral-500">{tier.description}</div>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search features…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-xl border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Module pills */}
          {allModules.map((mod) => (
            <button
              key={mod}
              onClick={() => setActiveModule((prev) => (prev === mod ? null : mod))}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                activeModule === mod
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {mod}
            </button>
          ))}

          {/* Sort */}
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="priority">Sort: Priority</option>
              <option value="roi">Sort: ROI</option>
              <option value="risk">Sort: Risk</option>
            </select>
          </div>
        </div>

        {scoreGuide && (
          <p className="text-xs text-neutral-400">{scoreGuide}</p>
        )}
      </div>

      {/* Feature cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-neutral-500">
          No features match the current filters.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredModules.map((module) => {
            const cards = filtered.filter((c) => c.module === module);
            const moduleHours = cards.reduce(
              (sum, c) => sum + c.impact.weeklyHours,
              0
            );
            const borderColor = getModuleBorderColor(module, allModules);

            return (
              <div key={module} className="space-y-3">
                {/* Module header */}
                <div
                  className={`flex items-center gap-3 border-l-4 pl-3 py-0.5 ${borderColor}`}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-600">
                    {module}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                    {cards.length} gap{cards.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {moduleHours}h/wk at risk
                  </span>
                </div>

                {/* 2-col card grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {cards.map((cap) => {
                    const isExpanded = expandedIds.has(cap.id);
                    return (
                      <div
                        key={cap.id}
                        className="rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
                      >
                        <button
                          className="w-full p-5 text-left"
                          onClick={() => toggleExpand(cap.id)}
                        >
                          {/* Card top row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <MaturityBadge maturity={cap.maturity} />
                                {cap.impactTags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2 font-semibold leading-snug text-neutral-900">
                                {cap.title}
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                                {cap.description}
                              </div>
                            </div>
                            <div className="shrink-0 text-neutral-400">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>

                          {/* Inline score bars (always visible) */}
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <ScoreBar label="ROI" score={cap.scores.roi} compact />
                            <ScoreBar
                              label="Rep."
                              score={cap.scores.repeatability}
                              compact
                            />
                            <ScoreBar label="Risk" score={cap.scores.risk} compact />
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="space-y-4 border-t px-5 pb-5 pt-4">
                            {/* Gap Identified */}
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                              <div className="text-xs font-bold uppercase tracking-[0.15em] text-red-700">
                                Gap Identified
                              </div>
                              <p className="mt-2 text-sm leading-6 text-red-900">
                                {cap.gapDescription || cap.description}
                              </p>
                            </div>

                            {/* AI Agent Recommendation */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                                  AI Agent Recommendation
                                </div>
                                {cap.agentType && (
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                    {cap.agentType}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-emerald-900">
                                {cap.recommendation}
                              </p>
                              {cap.impactTags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {cap.impactTags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Full score bars with descriptions */}
                            <div className="space-y-3">
                              <ScoreBar
                                label="ROI Potential"
                                score={cap.scores.roi}
                                description={cap.scoreExplanations.roiPotential}
                              />
                              <ScoreBar
                                label="Repeatability"
                                score={cap.scores.repeatability}
                                description={cap.scoreExplanations.repeatability}
                              />
                              <ScoreBar
                                label="Data Availability"
                                score={cap.scores.dataAvailability}
                                description={cap.scoreExplanations.dataAvailability}
                              />
                              <ScoreBar
                                label="Risk"
                                score={cap.scores.risk}
                                description={cap.scoreExplanations.risk}
                              />
                            </div>

                            {/* Hours / value stat row */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-xl bg-neutral-50 p-3 text-center">
                                <div className="text-lg font-bold text-neutral-900">
                                  {cap.impact.weeklyHours}h
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                                  Per Week
                                </div>
                              </div>
                              <div className="rounded-xl bg-neutral-50 p-3 text-center">
                                <div className="text-lg font-bold text-neutral-900">
                                  {cap.impact.yearlyHours}h
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                                  Per Year
                                </div>
                              </div>
                              <div className="rounded-xl bg-neutral-50 p-3 text-center">
                                <div className="text-lg font-bold text-neutral-900">
                                  $
                                  {cap.impact.annualDollar >= 1000
                                    ? `${Math.round(cap.impact.annualDollar / 1000)}k`
                                    : cap.impact.annualDollar}
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                                  Annual Value
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
