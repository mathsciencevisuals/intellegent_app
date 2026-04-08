import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma, WorkspaceRole } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(100, "Workspace name must be 100 characters or less"),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeWorkspaceName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function generateUniqueSlug(name: string) {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    throw new Error("Invalid workspace name");
  }

  const exactMatch = await prisma.workspace.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!exactMatch) {
    return baseSlug;
  }

  for (let i = 2; i <= 50; i++) {
    const candidate = `${baseSlug}-${i}`;

    const existing = await prisma.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Could not generate a unique workspace slug");
}

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const workspaces = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      ownerId: membership.workspace.ownerId,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
      role: membership.role,
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("GET /api/workspaces failed:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createWorkspaceSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 404 }
      );
    }

    const normalizedIncomingName = normalizeWorkspaceName(parsed.name);

    const existingMemberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const duplicate = existingMemberships.find(
      (membership) =>
        normalizeWorkspaceName(membership.workspace.name) === normalizedIncomingName
    );

    if (duplicate) {
      return NextResponse.json(
        { error: "You already have a workspace with this name" },
        { status: 409 }
      );
    }

    const slug = await generateUniqueSlug(parsed.name);

    const workspace = await prisma.workspace.create({
      data: {
        name: parsed.name,
        slug,
        ownerId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        workspace,
        redirectTo: `/workspaces/${workspace.slug}`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Workspace already exists" },
        { status: 409 }
      );
    }

    console.error("POST /api/workspaces failed:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
