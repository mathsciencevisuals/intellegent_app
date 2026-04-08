import { unlink } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        workspaceId: workspace.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.storageKey) {
      const absolutePath = path.join(process.cwd(), document.storageKey);
      try {
        await unlink(absolutePath);
      } catch (fileError) {
        console.warn("Could not delete file from disk:", fileError);
      }
    }

    await prisma.document.delete({
      where: { id: document.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE document failed:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
