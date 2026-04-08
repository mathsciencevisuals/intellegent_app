import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageMembers, canAssignRole } from "@/lib/permissions/workspace";
import { WorkspaceRole } from "@/generated/prisma/client";

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = await req.json();
    const parsed = addMemberSchema.parse(body);

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
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

    if (!canAssignRole(actorMembership.role, parsed.role as WorkspaceRole)) {
      return NextResponse.json(
        { error: "You do not have permission to assign this role" },
        { status: 403 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const normalizedEmail = parsed.email.toLowerCase();

    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (targetUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: targetUser.id,
            workspaceId: workspace.id,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a member of this workspace" },
          { status: 400 }
        );
      }

      const membership = await prisma.membership.create({
        data: {
          userId: targetUser.id,
          workspaceId: workspace.id,
          role: parsed.role,
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json(
        { mode: "member_added", membership },
        { status: 201 }
      );
    }

    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId: workspace.id,
        email: normalizedEmail,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "A pending invite already exists for this email" },
        { status: 400 }
      );
    }

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: workspace.id,
        email: normalizedEmail,
        role: parsed.role,
        invitedById: actor.id,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { mode: "invite_created", invite },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 }
      );
    }

    console.error("POST /api/workspaces/[slug]/members failed:", error);
    return NextResponse.json(
      { error: "Failed to add member or create invite" },
      { status: 500 }
    );
  }
}
