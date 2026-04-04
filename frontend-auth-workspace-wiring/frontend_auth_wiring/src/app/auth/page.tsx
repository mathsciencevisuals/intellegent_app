import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignInCard } from '@/components/auth/sign-in-card';

export default async function AuthPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <SignInCard />
    </main>
  );
}
