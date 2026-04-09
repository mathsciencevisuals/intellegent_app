"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Globe, LockKeyhole, Mail, UserRound } from "lucide-react";

type AuthMode = "signin" | "signup";

type AuthFormProps = {
  initialMode?: AuthMode;
};

const OAUTH_OPTIONS = [
  {
    id: "google",
    label: "Continue with Google",
    icon: Mail,
  },
  {
    id: "github",
    label: "Continue with GitHub",
    icon: Globe,
  },
  {
    id: "microsoft",
    label: "Continue with Microsoft",
    icon: LockKeyhole,
  },
] as const;

export function AuthForm({ initialMode = "signin" }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (isSignup) {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setLoading(false);
        setError(data?.error || "Unable to create account.");
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: false,
    });

    setLoading(false);

    if (!result) {
      setError(isSignup ? "Unable to create account." : "Unable to sign in.");
      return;
    }

    if (result.error) {
      setError(isSignup ? "Account created, but automatic sign-in failed." : "Invalid email or password.");
      return;
    }

    window.location.href = result.url || "/";
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
          Workspace Access
        </p>
        <h1 className="text-3xl font-semibold text-neutral-950">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-neutral-600">
          {isSignup
            ? "Use one form for registration and sign-in."
            : "Sign in here or switch to account creation without leaving the page."}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            !isSignup
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-600 hover:text-neutral-950"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            isSignup
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-600 hover:text-neutral-950"
          }`}
        >
          Sign up
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {OAUTH_OPTIONS.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              disabled
              aria-disabled="true"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500"
              title="Provider setup is not configured yet."
            >
              <Icon className="h-4 w-4" />
              {option.label}
              <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-neutral-500">
                Soon
              </span>
            </button>
          );
        })}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200" />
        <span>Email and password</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignup ? (
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-800"
            >
              <UserRound className="h-4 w-4 text-neutral-500" />
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
              placeholder="Jane Doe"
              required={isSignup}
            />
          </div>
        ) : null}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-800"
          >
            <Mail className="h-4 w-4 text-neutral-500" />
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
            placeholder="jane@company.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-800"
          >
            <LockKeyhole className="h-4 w-4 text-neutral-500" />
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
            placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? isSignup
              ? "Creating account..."
              : "Signing in..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        {isSignup ? "Already have an account?" : "Need a new account?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(isSignup ? "signin" : "signup")}
          className="font-medium text-neutral-950 underline underline-offset-4"
        >
          {isSignup ? "Sign in instead" : "Create one here"}
        </button>
      </p>

      <p className="mt-3 text-center text-xs text-neutral-500">
        Credentials login is active now. Social sign-in buttons are ready for provider setup.
      </p>

      <p className="mt-2 text-center text-xs text-neutral-500">
        <Link href="/" className="underline underline-offset-4">
          Return to workspace home
        </Link>
      </p>
    </div>
  );
}
