import Link from "next/link";
import { auth } from "@/auth";

const ITEMS = [
  { href: "/explore", label: "Explore", icon: "◎" },
  { href: "/plan", label: "Plan", icon: "✎" },
  { href: "/trips", label: "Trip", icon: "◇" },
  { href: "/passport", label: "Passport", icon: "▤" },
];

/** Forest rail carrying the primary navigation, per the mockups. */
export default async function Sidebar() {
  const session = await auth();
  const initials = (session?.user?.email ?? "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col items-center justify-between bg-forest py-5 md:flex">
      <div className="flex flex-col items-center gap-6">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full bg-clay font-display text-cream"
          aria-label="Destiny home"
        >
          D
        </Link>

        <ul className="flex flex-col items-center gap-5">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1 text-cream/60 transition hover:text-cream"
              >
                <span aria-hidden className="text-lg leading-none">
                  {item.icon}
                </span>
                <span className="text-[9px] tracking-wide">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={session?.user ? "/profile" : "/signin"}
        className="grid h-8 w-8 place-items-center rounded-full border border-cream/30 text-[11px] text-cream/80 transition hover:border-cream"
        aria-label={session?.user ? "Profile" : "Sign in"}
      >
        {initials || "··"}
      </Link>
    </nav>
  );
}
