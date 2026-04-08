import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  action: z.literal("profile"),
  name: z.string().trim().min(2).max(80),
});

const updatePasswordSchema = z
  .object({
    action: z.literal("password"),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.action === "profile") {
      const parsed = updateProfileSchema.parse(body);

      const user = await prisma.user.update({
        where: { id: actor.id },
        data: {
          name: parsed.name,
        },
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Profile updated.",
        user,
      });
    }

    if (body.action === "password") {
      const parsed = updatePasswordSchema.parse(body);

      if (!actor.passwordHash) {
        return NextResponse.json(
          { error: "Password changes are not available for this account" },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        parsed.currentPassword,
        actor.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(parsed.newPassword, 12);

      await prisma.user.update({
        where: { id: actor.id },
        data: {
          passwordHash,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password updated.",
      });
    }

    return NextResponse.json(
      { error: "Unsupported action" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];

      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Invalid request",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("PATCH /api/settings failed:", error);

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
