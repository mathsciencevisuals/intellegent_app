import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function SectionContextPane({
  eyebrow,
  title,
  description,
  children,
}: Props) {
  return (
    <aside className="flex min-h-screen min-w-0 flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
