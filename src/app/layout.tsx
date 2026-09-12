import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import StarField from "@/components/StarField";

// Display serif for headings, sans for everything else.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Destiny",
  description: "Discover, plan, experience and remember your journey.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <StarField />
        {children}
      </body>
    </html>
  );
}
