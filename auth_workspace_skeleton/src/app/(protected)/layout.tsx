import { redirect } from 'next/navigation';
import { getRequestContext } from '@/lib/auth/session';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await getRequestContext();
    return children;
  } catch {
    redirect('/auth');
  }
}
