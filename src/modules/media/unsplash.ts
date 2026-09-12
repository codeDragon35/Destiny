import "server-only";

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export type Photo = { url: string; credit: string; creditUrl: string };

type UnsplashResult = {
  results: {
    urls: { raw: string };
    user: { name: string; links: { html: string } };
  }[];
};

/**
 * Unsplash's Demo tier allows 50 requests/hour, so results are cached for a day.
 * Returns null when no key is configured; callers fall back to a gradient.
 */
export async function searchPhoto(query: string): Promise<Photo | null> {
  if (!ACCESS_KEY) return null;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as UnsplashResult;
    const hit = data.results[0];
    if (!hit) return null;

    return {
      url: `${hit.urls.raw}&w=1600&q=80&fm=jpg&fit=crop`,
      credit: hit.user.name,
      creditUrl: hit.user.links.html,
    };
  } catch {
    return null;
  }
}
