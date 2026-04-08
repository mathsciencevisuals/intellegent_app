import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
};

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          </div>

          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-neutral-50 text-neutral-700">
              {icon}
            </div>
          ) : null}
        </div>

        {(description || trend) && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">{description}</p>

            {trend ? (
              <span
                className={
                  trend.positive
                    ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    : "inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                }
              >
                {trend.value}
              </span>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
