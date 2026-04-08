import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invites = await prisma.workspaceInvite.findMany({
      where: {
        email: session.user.email.toLowerCase(),
        status: "PENDING",
      },
      include: {
        workspace: true,
        invitedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("GET /api/invites failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
