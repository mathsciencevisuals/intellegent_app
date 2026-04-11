"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

type AuthMode = "signin" | "signup";

type AuthFormProps = {
  initialMode?: AuthMode;
};

const OAUTH_OPTIONS = [
  {
    id: "google",
    providerName: "Google",
  },
  {
    id: "microsoft",
    providerName: "Microsoft",
  },
  {
    id: "github",
    providerName: "GitHub",
  },
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M21.81 12.23c0-.72-.06-1.25-.19-1.8H12.2v3.56h5.53c-.11.88-.72 2.21-2.08 3.1l-.02.12 3.01 2.28.21.02c1.91-1.72 2.96-4.24 2.96-7.28Z"
        fill="#4285F4"
      />
      <path
        d="M12.2 21.89c2.71 0 4.99-.87 6.66-2.38l-3.2-2.42c-.86.58-2 1-3.46 1-2.65 0-4.9-1.72-5.7-4.1l-.12.01-3.13 2.37-.04.11a10.1 10.1 0 0 0 8.99 5.41Z"
        fill="#34A853"
      />
      <path
        d="M6.5 13.99A6.04 6.04 0 0 1 6.16 12c0-.69.12-1.36.33-1.99l-.01-.13-3.17-2.41-.1.05A9.8 9.8 0 0 0 2.16 12c0 1.59.39 3.09 1.05 4.48l3.29-2.49Z"
        fill="#FBBC05"
      />
      <path
        d="M12.2 5.91c1.84 0 3.08.78 3.79 1.43l2.77-2.65C17.18 3.25 14.91 2.11 12.2 2.11a10.1 10.1 0 0 0-8.99 5.41l3.28 2.49c.81-2.38 3.06-4.1 5.71-4.1Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M3 3h8.5v8.5H3z" fill="#F25022" />
      <path d="M12.5 3H21v8.5h-8.5z" fill="#7FBA00" />
      <path d="M3 12.5h8.5V21H3z" fill="#00A4EF" />
      <path d="M12.5 12.5H21V21h-8.5z" fill="#FFB900" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.25.82-.57v-2.03c-3.34.72-4.04-1.39-4.04-1.39-.54-1.36-1.33-1.72-1.33-1.72-1.09-.73.09-.72.09-.72 1.2.08 1.84 1.22 1.84 1.22 1.08 1.82 2.82 1.29 3.51.98.11-.76.42-1.29.76-1.59-2.67-.3-5.48-1.31-5.48-5.86 0-1.29.47-2.34 1.23-3.16-.12-.3-.53-1.51.12-3.14 0 0 1-.31 3.3 1.21a11.6 11.6 0 0 1 6 0c2.29-1.52 3.29-1.21 3.29-1.21.66 1.63.25 2.84.12 3.14.76.82 1.22 1.87 1.22 3.16 0 4.56-2.81 5.55-5.49 5.84.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function getProviderIcon(providerId: (typeof OAUTH_OPTIONS)[number]["id"]) {
  switch (providerId) {
    case "google":
      return <GoogleIcon />;
    case "microsoft":
      return <MicrosoftIcon />;
    case "github":
      return <GitHubIcon />;
    default:
      return null;
  }
}

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
    <div className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
          Workspace Access
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm leading-6 text-neutral-600">
          {isSignup
            ? "Use a compact setup to create your account and continue."
            : "Sign in with a provider or use your email and password."}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 rounded-2xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
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
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            isSignup
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-600 hover:text-neutral-950"
          }`}
        >
          Sign up
        </button>
      </div>

      <div className="mt-5 flex justify-center gap-3">
        {OAUTH_OPTIONS.map((option) => {
          return (
            <button
              key={option.id}
              type="button"
              disabled
              aria-disabled="true"
              aria-label={`${option.providerName} sign-in is not configured yet.`}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
              title={`${option.providerName} sign-in is not configured yet.`}
            >
              {getProviderIcon(option.id)}
            </button>
          );
        })}
      </div>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200" />
        <span>Email and password</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
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
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-400"
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
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-400"
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
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-400"
            placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
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

      <p className="mt-5 text-center text-sm text-neutral-600">
        {isSignup ? "Already have an account?" : "Need a new account?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(isSignup ? "signin" : "signup")}
          className="font-medium text-neutral-950 underline underline-offset-4"
        >
          {isSignup ? "Sign in instead" : "Create one here"}
        </button>
      </p>

      <p className="mt-3 text-center text-xs leading-5 text-neutral-500">
        Provider buttons are styled and ready. They stay disabled until the OAuth providers are configured.
      </p>

      <p className="mt-2 text-center text-xs text-neutral-500">
        <Link href="/" className="underline underline-offset-4">
          Return to workspace home
        </Link>
      </p>
    </div>
  );
}
