import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <LoginForm />
    </main>
  );
}
<p className="mt-4 text-sm">
  Don’t have an account?{" "}
  <a href="/signup" className="underline">
    Sign up
  </a>
</p>
