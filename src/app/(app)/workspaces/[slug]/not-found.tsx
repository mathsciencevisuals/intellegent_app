import Link from "next/link";

export default function WorkspaceNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Workspace not found</h1>
      <p className="mb-6 text-neutral-600">
        Either this workspace does not exist or you do not have access to it.
      </p>
      <Link href="/" className="rounded bg-black px-4 py-2 text-white">
        Go home
      </Link>
    </main>
  );
}
