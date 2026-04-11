import { ReactNode } from "react";

export default async function WorkspacesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-full min-w-0 overflow-x-hidden bg-neutral-50">{children}</div>;
}
