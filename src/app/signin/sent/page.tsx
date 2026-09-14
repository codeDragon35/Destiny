import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-4xl" aria-hidden>
          ✦
        </p>
        <h1 className="mt-6 text-3xl font-semibold text-forest">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          We sent you a sign-in link. It expires in 24 hours.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-clay transition hover:text-clay/80"
        >
          ← Back to Destiny
        </Link>
      </div>
    </main>
  );
}
