import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Check your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "founder@example.com" },
    update: {},
    create: {
      email: "founder@example.com",
      name: "Founder",
      passwordHash: "temporary-placeholder",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      ownerId: user.id,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  const existingDoc = await prisma.document.findFirst({
    where: {
      workspaceId: workspace.id,
      title: "Welcome Document",
    },
  });

  if (!existingDoc) {
    await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        title: "Welcome Document",
        status: "READY",
        storageKey: "docs/welcome.pdf",
      },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
