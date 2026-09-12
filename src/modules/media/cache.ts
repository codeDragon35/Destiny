import "server-only";
import Redis from "ioredis";

const url = process.env.REDIS_URL;

/**
 * Optional Redis. Every call degrades to a miss when Redis is absent or failing,
 * so the app works without it — it is a cache, never a dependency.
 */
let client: Redis | null = null;
if (url) {
  client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  client.on("error", () => {
    // Swallow: a dead cache must not take the page down.
  });
  void client.connect().catch(() => {
    client = null;
  });
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number) {
  if (!client) return;
  try {
    await client.set(key, value, "EX", ttlSeconds);
  } catch {
    // Ignore: failing to cache is not an error.
  }
}
