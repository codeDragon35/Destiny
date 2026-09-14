import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { error, from } = await searchParams;

  async function send(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    await signIn("nodemailer", { email, redirectTo: from ?? "/" });
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-neutral-600 transition hover:text-clay">
          ← Destiny
        </Link>

        <h1 className="mt-8 text-3xl font-semibold text-forest">Sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          We&apos;ll email you a link — no password to remember.
        </p>

        {error && (
          <p className="mt-6 rounded-lg border border-accent-300/30 bg-accent-200/5 px-4 py-3 text-sm text-accent-600">
            That link didn&apos;t work. Try again.
          </p>
        )}

        <form action={send} className="mt-8 space-y-4">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-ink/12 bg-cream px-4 py-3 text-forest placeholder:text-neutral-600/50 outline-none transition focus:border-clay"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-clay py-3 font-medium text-cream transition hover:bg-clay/90"
          >
            Email me a link
          </button>
        </form>
      </div>
    </main>
  );
}
