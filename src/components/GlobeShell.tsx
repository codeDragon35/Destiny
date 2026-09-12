"use client";

import dynamic from "next/dynamic";
import type { GlobeCountry } from "./Globe";

// Three.js touches window/document, so the globe must never render on the server.
const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <p className="animate-pulse text-sm text-soft-gray">Loading the world…</p>
    </div>
  ),
});

export default function GlobeShell({ available }: { available: GlobeCountry[] }) {
  return <Globe available={available} />;
}
