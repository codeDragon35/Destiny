"use client";

import { useState } from "react";

/**
 * Print and share. Printing goes through the browser's own dialog, which
 * produces a PDF via "Save as PDF" — no PDF library, and the print stylesheet
 * controls the layout.
 */
export default function PassportActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    // Native share where the browser offers it; clipboard everywhere else.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or unsupported — fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; leave the URL in the address bar for the user.
    }
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-clay px-6 py-3 font-display text-sm text-cream shadow-md transition hover:bg-accent-600"
      >
        Print as a book
      </button>
      <button
        type="button"
        onClick={share}
        className="rounded-full border border-forest/30 px-6 py-3 font-display text-sm text-forest transition hover:bg-surface"
      >
        {copied ? "Link copied" : "Share page"}
      </button>
    </div>
  );
}
