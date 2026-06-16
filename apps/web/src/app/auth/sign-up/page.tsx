import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { auth } from "@/lib/auth";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard/overview");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Create your workspace</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Local-first setup, optional OAuth, and no AI key required.</p>
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account? <Link href="/auth/sign-in" className="text-sky-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
