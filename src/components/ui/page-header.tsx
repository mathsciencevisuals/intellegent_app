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
          <p className="text-[11pt] font-semibold uppercase tracking-[0.18em] text-neutral-400 [font-family:Calibri,Carlito,'Segoe_UI',sans-serif]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[11pt] font-semibold tracking-tight [font-family:Calibri,Carlito,'Segoe_UI',sans-serif]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-[11pt] text-slate-500 [font-family:Calibri,Carlito,'Segoe_UI',sans-serif]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
