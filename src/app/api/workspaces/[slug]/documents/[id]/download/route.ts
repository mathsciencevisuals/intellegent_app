import { readFile } from "fs/promises";
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

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
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

    if (!document || !document.storageKey) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const uploadsRoot = path.resolve(process.cwd(), "uploads");
    const absolutePath = path.resolve(process.cwd(), document.storageKey);

    if (!absolutePath.startsWith(uploadsRoot + path.sep)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const fileBuffer = await readFile(absolutePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${document.title}"`,
      },
    });
  } catch (error) {
    console.error("GET download failed:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}
