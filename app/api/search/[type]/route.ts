import { NextResponse } from "next/server";
import { z } from "zod";
import { searchAnilist } from "@/lib/media/anilist";
import { searchTmdb } from "@/lib/media/tmdb";
import { getCachedSearch, setCachedSearch } from "@/lib/media/cache";
import type { MediaResult, SearchResponse } from "@/lib/media/types";

const typeSchema = z.enum(["anime", "cartoon", "game"]);

// Live providers by media type. anime = AniList (no key), cartoon = TMDB.
// game (IGDB) stays stubbed until Twitch OAuth credentials are configured.
const LIVE_PROVIDERS: Partial<Record<
  z.infer<typeof typeSchema>,
  (query: string) => Promise<MediaResult[]>
>> = {
  anime: searchAnilist,
  cartoon: searchTmdb,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type: rawType } = await params;

  const parsed = typeSchema.safeParse(rawType);
  if (!parsed.success) {
    const body: SearchResponse = {
      available: false,
      results: [],
      error: "Invalid media type. Expected one of: anime, cartoon, game.",
    };
    return NextResponse.json(body, { status: 400 });
  }
  const type = parsed.data;

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  // Blank or implausibly long queries return empty without doing any work.
  if (!q || q.length > 100) {
    const body: SearchResponse = { available: true, results: [] };
    return NextResponse.json(body, { status: 200 });
  }

  const liveSearch = LIVE_PROVIDERS[type];
  // game has no live provider yet -> "coming soon" state.
  if (!liveSearch) {
    const body: SearchResponse = { available: false, results: [] };
    return NextResponse.json(body, { status: 200 });
  }

  // Live provider: cache-first, then call out. Never 500 on provider failure.
  try {
    const cached = await getCachedSearch(type, q);
    if (cached) {
      const body: SearchResponse = { available: true, results: cached };
      return NextResponse.json(body, { status: 200 });
    }

    const results = await liveSearch(q);
    // Only cache non-empty result sets. Caching empty results would pin a
    // transient "no results" outcome for the full TTL.
    if (results.length > 0) {
      // Best-effort cache write; don't fail the request if it throws.
      try {
        await setCachedSearch(type, q, results);
      } catch {
        /* ignore cache write errors */
      }
    }

    const body: SearchResponse = { available: true, results };
    return NextResponse.json(body, { status: 200 });
  } catch {
    const body: SearchResponse = {
      available: true,
      results: [],
      error: `${type} search is temporarily unavailable`,
    };
    return NextResponse.json(body, { status: 200 });
  }
}
