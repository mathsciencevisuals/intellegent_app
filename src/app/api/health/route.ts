import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workspaceCount = await prisma.workspace.count();

  return NextResponse.json({
    ok: true,
    database: "connected",
    workspaceCount,
  });
}
