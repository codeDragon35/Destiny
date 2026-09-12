import type { Metadata } from "next";
import "./globals.css";
import StarField from "@/components/StarField";

export const metadata: Metadata = {
  title: "Destiny",
  description: "Discover, plan, experience and remember your journey.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StarField />
        {children}
      </body>
    </html>
  );
}
