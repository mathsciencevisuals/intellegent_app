import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { KeyRound, Settings, ShieldCheck, UserRound } from "lucide-react";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PasswordSettingsForm } from "@/components/settings/password-settings-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PreferencesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      memberships: {
        select: {
          id: true,
        },
      },
      sentInvites: {
        where: {
          status: "PENDING",
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const accountStats = [
    {
      label: "Role",
      value: user.role,
    },
    {
      label: "Workspaces",
      value: String(user.memberships.length),
    },
    {
      label: "Pending invites sent",
      value: String(user.sentInvites.length),
    },
    {
      label: "Member since",
      value: user.createdAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="System"
        title="Preferences"
        description="Manage your profile, security settings, and account context."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                <UserRound className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile preferences</CardTitle>
                <CardDescription>
                  Update the account details shown across the platform.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileSettingsForm
              initialName={user.name ?? ""}
              email={user.email}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                <KeyRound className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription>
                  Rotate your sign-in password for this workspace account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PasswordSettingsForm />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Account overview</CardTitle>
            <CardDescription>
              Current account metadata pulled from your active user record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {accountStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-neutral-900">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Preference roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-2xl border p-4">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <ShieldCheck className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <div className="font-medium text-neutral-900">
                  More account controls can land here next
                </div>
                <div className="mt-1 text-sm text-neutral-500">
                  Notification delivery, display preferences, and richer profile fields still need persistence support in the schema.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">App preferences</CardTitle>
          <CardDescription>
            Current application-level defaults for this release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-2xl border border-dashed p-4">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <Settings className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <div className="font-medium text-neutral-900">
                System preferences are still fixed
              </div>
              <div className="mt-1 text-sm text-neutral-500">
                The current app uses a shared neutral theme and standard notification behavior. Once those options have persistence behind them, this section can become editable.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
