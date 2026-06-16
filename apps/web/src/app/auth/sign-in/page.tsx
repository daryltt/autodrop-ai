import Link from "next/link";
import { redirect } from "next/navigation";
import { getEnv } from "@autodrop/config";
import { SignInForm } from "@/components/auth/sign-in-form";
import { auth } from "@/lib/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard/overview");
  }

  const env = getEnv();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">AutoDrop AI</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Self-hostable e-commerce automation with optional AI providers.</p>
        </div>
        <SignInForm googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)} />
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Need an account? <Link href="/auth/sign-up" className="text-sky-600 hover:underline">Create one</Link>
        </p>
      </div>
    </main>
  );
}
