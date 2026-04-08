import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <SignupForm />
    </main>
  );
}
