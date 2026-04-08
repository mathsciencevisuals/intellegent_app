import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { CreateWorkspaceForm } from "@/components/workspaces/create-workspace-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewWorkspacePage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace setup"
        title="Create workspace"
        description="Create a new workspace for documents, members, and settings."
      />

      <Card className="max-w-2xl rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
