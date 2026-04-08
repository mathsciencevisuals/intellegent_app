import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageMembers,
  canManageTargetRole,
  canAssignRole,
} from "@/lib/permissions/workspace";
import { WorkspaceRole } from "@/generated/prisma/client";

const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

type RouteContext = {
  params: Promise<{
    slug: string;
    membershipId: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, membershipId } = await context.params;
    const body = await req.json();
    const parsed = updateRoleSchema.parse(body);

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          where: {
            workspace: {
              slug,
            },
          },
        },
      },
    });

    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const actorMembership = actor.memberships[0];

    if (!actorMembership) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    if (!canManageMembers(actorMembership.role)) {
      return NextResponse.json(
        { error: "You do not have permission to manage members" },
        { status: 403 }
      );
    }

    const targetMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
        workspace: true,
      },
    });

    if (!targetMembership || targetMembership.workspace.slug !== slug) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (
      !canManageTargetRole(actorMembership.role, targetMembership.role) ||
      !canAssignRole(actorMembership.role, parsed.role as WorkspaceRole)
    ) {
      return NextResponse.json(
        { error: "You do not have permission for this role change" },
        { status: 403 }
      );
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        role: parsed.role,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 }
      );
    }

    console.error("PATCH /api/workspaces/[slug]/members/[membershipId] failed:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, membershipId } = await context.params;

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          where: {
            workspace: {
              slug,
            },
          },
        },
      },
    });

    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const actorMembership = actor.memberships[0];

    if (!actorMembership) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    if (!canManageMembers(actorMembership.role)) {
      return NextResponse.json(
        { error: "You do not have permission to remove members" },
        { status: 403 }
      );
    }

    const targetMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        workspace: true,
      },
    });

    if (!targetMembership || targetMembership.workspace.slug !== slug) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (targetMembership.userId === actor.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the workspace here" },
        { status: 400 }
      );
    }

    if (!canManageTargetRole(actorMembership.role, targetMembership.role)) {
      return NextResponse.json(
        { error: "You do not have permission to remove this member" },
        { status: 403 }
      );
    }

    await prisma.membership.delete({
      where: { id: membershipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workspaces/[slug]/members/[membershipId] failed:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
