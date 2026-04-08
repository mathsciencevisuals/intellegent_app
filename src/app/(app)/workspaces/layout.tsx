import { ReactNode } from "react";
import { WorkspaceBrowserPane } from "@/components/workspaces/workspace-browser-pane";

export default async function WorkspacesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
      <WorkspaceBrowserPane />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
