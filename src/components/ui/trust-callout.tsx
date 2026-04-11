import type { ReactNode } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

type Props = {
  title: string;
  body: string;
  points?: string[];
  tone?: "neutral" | "warning";
  trailing?: ReactNode;
};

export function TrustCallout({
  title,
  body,
  points = [],
  tone = "neutral",
  trailing,
}: Props) {
  const Icon = tone === "warning" ? AlertTriangle : ShieldCheck;
  const iconClassName =
    tone === "warning" ? "text-amber-700" : "text-slate-700";
  const wrapperClassName =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border p-4 ${wrapperClassName}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Icon className={`h-4 w-4 ${iconClassName}`} />
            {title}
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{body}</p>
          {points.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {points.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-700"
                >
                  {point}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}
