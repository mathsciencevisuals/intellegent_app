import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inviteActionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

type RouteContext = {
  params: Promise<{
    inviteId: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteId } = await context.params;
    const body = await req.json();
    const parsed = inviteActionSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
      include: {
        workspace: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.email !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You do not have access to this invite" },
        { status: 403 }
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invite is no longer pending" },
        { status: 400 }
      );
    }

    if (parsed.action === "decline") {
      const declined = await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: {
          status: "DECLINED",
        },
      });

      return NextResponse.json({ success: true, invite: declined });
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (!existingMembership) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      });
    }

    const accepted = await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedById: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      invite: accepted,
      redirectTo: `/workspaces/${invite.workspace.slug}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten() },
        { status: 400 }
      );
    }

    console.error("PATCH /api/invites/[inviteId] failed:", error);
    return NextResponse.json(
      { error: "Failed to process invite" },
      { status: 500 }
    );
  }
}
