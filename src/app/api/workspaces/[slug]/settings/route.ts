import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceOwner } from "@/lib/permissions/workspace";

const renameWorkspaceSchema = z.object({
  action: z.literal("rename"),
  name: z.string().trim().min(2).max(100),
});

const transferOwnershipSchema = z.object({
  action: z.literal("transferOwnership"),
  membershipId: z.string().min(1),
});

const deleteWorkspaceSchema = z.object({
  action: z.literal("delete"),
  confirmSlug: z.string().min(1),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = await req.json();

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });

    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        memberships: {
          some: {
            userId: actor.id,
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const actorMembership = workspace.memberships.find(
      (membership) => membership.userId === actor.id
    );

    if (!actorMembership || !isWorkspaceOwner(actorMembership.role)) {
      return NextResponse.json(
        { error: "Only the workspace owner can perform this action" },
        { status: 403 }
      );
    }

    if (body.action === "rename") {
      const parsed = renameWorkspaceSchema.parse(body);

      const baseSlug = slugify(parsed.name);
      let nextSlug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await prisma.workspace.findUnique({
          where: { slug: nextSlug },
        });

        if (!existing || existing.id === workspace.id) {
          break;
        }

        counter += 1;
        nextSlug = `${baseSlug}-${counter}`;
      }

      const updated = await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          name: parsed.name,
          slug: nextSlug,
        },
      });

      return NextResponse.json(updated);
    }

    if (body.action === "transferOwnership") {
      const parsed = transferOwnershipSchema.parse(body);

      const targetMembership = workspace.memberships.find(
        (membership) => membership.id === parsed.membershipId
      );

      if (!targetMembership) {
        return NextResponse.json(
          { error: "Target membership not found" },
          { status: 404 }
        );
      }

      if (targetMembership.userId === actor.id) {
        return NextResponse.json(
          { error: "You already own this workspace" },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            ownerId: targetMembership.userId,
          },
        }),
        prisma.membership.update({
          where: { id: actorMembership.id },
          data: {
            role: "ADMIN",
          },
        }),
        prisma.membership.update({
          where: { id: targetMembership.id },
          data: {
            role: "OWNER",
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Unsupported action" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 }
      );
    }

    console.error("PATCH /api/workspaces/[slug]/settings failed:", error);
    return NextResponse.json(
      { error: "Failed to update workspace settings" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = await req.json().catch(() => ({}));

    const parsed = deleteWorkspaceSchema.parse({
      action: "delete",
      confirmSlug: body?.confirmSlug ?? "",
    });

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });

    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        memberships: {
          some: {
            userId: actor.id,
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    const actorMembership = workspace.memberships.find(
      (membership) => membership.userId === actor.id
    );

    if (!actorMembership || !isWorkspaceOwner(actorMembership.role)) {
      return NextResponse.json(
        { error: "Only the workspace owner can delete this workspace" },
        { status: 403 }
      );
    }

    if (parsed.confirmSlug !== workspace.slug) {
      return NextResponse.json(
        { error: "Confirmation slug does not match" },
        { status: 400 }
      );
    }

    await prisma.workspace.delete({
      where: { id: workspace.id },
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/workspaces",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 }
      );
    }

    console.error("DELETE /api/workspaces/[slug]/settings failed:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
