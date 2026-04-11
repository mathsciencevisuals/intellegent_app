import { notFound } from "next/navigation";
import { FileText, Upload } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatUtcDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDocumentForm } from "@/components/workspaces/upload-document-form";
import { DocumentActions } from "@/components/workspaces/document-actions";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = {
  slug: string;
  userId: string;
};

export async function WorkspaceDocumentsView({ slug, userId }: Props) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      slug,
      memberships: {
        some: {
          userId,
        },
      },
    },
    include: {
      documents: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      sources: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Documents"
        description={`Upload and manage documents for ${workspace.name}.`}
      />

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UploadDocumentForm slug={workspace.slug} sources={workspace.sources} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Document management</CardTitle>
        </CardHeader>
        <CardContent>
          {workspace.documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <FileText className="h-5 w-5 text-neutral-500" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                No documents yet
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Upload your first document to start managing content in this workspace.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">File name</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.documents.map((doc) => (
                    <tr key={doc.id} className="border-t align-top hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{doc.title}</div>
                        {doc.errorMessage ? (
                          <div className="mt-1 text-xs text-red-600">
                            {doc.errorMessage}
                          </div>
                        ) : null}
                        {doc.processingSummary ? (
                          <div className="mt-1 text-xs text-neutral-500">
                            {doc.processingSummary}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {doc.source ? `${doc.source.name}` : "Manual"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {doc.fileName || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {typeof doc.fileSize === "number"
                          ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatUtcDateTime(doc.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <DocumentActions
                          slug={workspace.slug}
                          documentId={doc.id}
                          status={doc.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
