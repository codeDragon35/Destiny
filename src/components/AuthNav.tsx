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
          <Link href="/trips" className="text-soft-gray transition hover:text-jade">
            My trips
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="text-soft-gray/70 transition hover:text-coral">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/signin"
          className="rounded-full border border-jade/30 px-4 py-1.5 text-jade transition hover:border-jade"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
