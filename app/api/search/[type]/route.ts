import { NextResponse } from "next/server";
import { z } from "zod";
import { searchAnilist } from "@/lib/media/anilist";
import { getCachedSearch, setCachedSearch } from "@/lib/media/cache";
import type { SearchResponse } from "@/lib/media/types";

const typeSchema = z.enum(["anime", "cartoon", "game"]);

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
  if (!q) {
    const body: SearchResponse = { available: true, results: [] };
    return NextResponse.json(body, { status: 200 });
  }

  // cartoon/game are stubbed until API keys exist.
  if (type !== "anime") {
    const body: SearchResponse = { available: false, results: [] };
    return NextResponse.json(body, { status: 200 });
  }

  // anime: cache-first, then live AniList. Never 500 on provider failure.
  try {
    const cached = await getCachedSearch("anime", q);
    if (cached) {
      const body: SearchResponse = { available: true, results: cached };
      return NextResponse.json(body, { status: 200 });
    }

    const results = await searchAnilist(q);
    // Best-effort cache write; don't fail the request if it throws.
    try {
      await setCachedSearch("anime", q, results);
    } catch {
      /* ignore cache write errors */
    }

    const body: SearchResponse = { available: true, results };
    return NextResponse.json(body, { status: 200 });
  } catch {
    const body: SearchResponse = {
      available: true,
      results: [],
      error: "Anime search is temporarily unavailable",
    };
    return NextResponse.json(body, { status: 200 });
  }
}
