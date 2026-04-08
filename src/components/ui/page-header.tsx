import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
