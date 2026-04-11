import { AuthForm } from "@/components/auth/auth-form";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const modeParam = Array.isArray(resolvedSearchParams.mode)
    ? resolvedSearchParams.mode[0]
    : resolvedSearchParams.mode;
  const initialMode = modeParam === "signup" ? "signup" : "signin";

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(245,245,244,0.92)_38%,_rgba(231,229,228,0.88)_100%)] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35),transparent_42%,rgba(214,211,209,0.22))]" />
      <div className="relative w-full max-w-sm">
        <AuthForm initialMode={initialMode} />
      </div>
    </main>
  );
}
