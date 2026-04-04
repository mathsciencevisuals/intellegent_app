import { signInWithGitHub, signInWithGoogle } from '@/lib/auth/server-actions';

export function SignInCard() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to FeatureIntel</h1>
        <p className="mt-2 text-sm text-slate-500">
          Access your workspaces, repository, extraction jobs, and reports.
        </p>
      </div>

      <div className="space-y-3">
        <form action={signInWithGoogle}>
          <button className="w-full rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-slate-50">
            Continue with Google
          </button>
        </form>
        <form action={signInWithGitHub}>
          <button className="w-full rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-slate-50">
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
