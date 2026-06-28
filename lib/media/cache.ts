import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MediaResult } from "./types";

// We cache by a NORMALIZED QUERY string (not per media id). One AniList search
// returns up to a dozen results; caching the whole result set under a single
// query key lets us serve repeat searches without re-hitting AniList, which is
// what keeps us under its ~90 req/min limit. The MediaCache row's `mediaId`
// column is repurposed as this normalized cache key.
//
// NOTE: there is no eviction yet. Expired rows are filtered out on read (we
// treat expiresAt <= now as a miss) but are never deleted, so rows accumulate
// over time. TODO: add a periodic cleanup, e.g. a cron calling
// prisma.mediaCache.deleteMany({ where: { expiresAt: { lt: new Date() } } }).

/** Build the normalized cache key for a search query. */
function cacheKey(query: string): string {
  return `search:${query.trim().toLowerCase()}`;
}

/**
 * Return cached results for (provider, query) if present and not expired.
 * Best-effort: any read failure resolves to null so callers can fall back to
 * a live provider call rather than erroring.
 */
export async function getCachedSearch(
  provider: string,
  query: string
): Promise<MediaResult[] | null> {
  try {
    const row = await prisma.mediaCache.findUnique({
      where: { provider_mediaId: { provider, mediaId: cacheKey(query) } },
    });
    if (!row) return null;
    if (row.expiresAt <= new Date()) return null;

    const json = row.json as { results?: MediaResult[] } | null;
    return json?.results ?? null;
  } catch {
    // Cache is best-effort; never block the caller on a cache read error.
    return null;
  }
}

/**
 * Upsert cached results for (provider, query) with a TTL (default 24h).
 */
export async function setCachedSearch(
  provider: string,
  query: string,
  results: MediaResult[],
  ttlHours = 24
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const key = cacheKey(query);
  // MediaResult[] is a typed interface array; Prisma's InputJsonValue requires a
  // structural JSON type, so we serialize through the JSON-safe shape.
  const json = { results } as unknown as Prisma.InputJsonValue;
  await prisma.mediaCache.upsert({
    where: { provider_mediaId: { provider, mediaId: key } },
    create: { provider, mediaId: key, json, expiresAt },
    update: { json, expiresAt },
  });
}
