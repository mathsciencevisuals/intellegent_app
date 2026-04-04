'use server';

import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/lib/auth';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' });
}

export async function signInWithGitHub() {
  await signIn('github', { redirectTo: '/dashboard' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/auth' });
  redirect('/auth');
}
