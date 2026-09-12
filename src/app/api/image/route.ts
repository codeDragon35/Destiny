import { NextResponse } from "next/server";

const UA = "DestinyTravelApp/0.1 (https://github.com/codeDragon35/Destiny)";

/**
 * Proxies Wikimedia Commons images. Wikimedia serves a placeholder to clients that
 * do not send a descriptive User-Agent, so requests must originate server-side.
 */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  // Only ever fetch Wikimedia file paths — never an arbitrary URL from the query string.
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("Bad url", { status: 400 });
  }
  if (
    target.protocol !== "https:" ||
    target.hostname !== "commons.wikimedia.org" ||
    !target.pathname.startsWith("/wiki/Special:FilePath/")
  ) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  const upstream = await fetch(target, {
    headers: { "User-Agent": UA },
    next: { revalidate: 604800 },
  });
  if (!upstream.ok) return new NextResponse("Upstream error", { status: 502 });

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
