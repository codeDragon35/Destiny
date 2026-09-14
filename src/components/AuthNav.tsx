import Link from "next/link";
import { auth, signOut } from "@/auth";
import SoundToggle from "@/components/SoundToggle";

export default async function AuthNav() {
  const session = await auth();

  return (
    <nav className="pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-3 text-sm sm:right-8 sm:top-6">
      <SoundToggle />
      {session?.user ? (
        <>
          <Link href="/trips" className="text-neutral-600 transition hover:text-clay">
            My trips
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="text-neutral-600/70 transition hover:text-accent-600">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/signin"
          className="rounded-full border border-clay/30 px-4 py-1.5 text-clay transition hover:border-clay"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
