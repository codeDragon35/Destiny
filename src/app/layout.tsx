import type { Metadata } from "next";
import { Caprasimo, Figtree } from "next/font/google";
import "./globals.css";

// Organic design system: Caprasimo display for headings, Figtree for body.
const display = Caprasimo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const sans = Figtree({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Destiny",
  description: "Discover, plan, experience and remember your journey.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
