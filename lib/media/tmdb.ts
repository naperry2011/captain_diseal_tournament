import type { MediaResult } from "./types";

// TMDB powers the "cartoon" category via TV-show search. We authenticate with
// the v4 Read Access Token (bearer) when available, falling back to the v3 API
// key as a query param. Poster paths are relative; we prefix the image CDN base.
const TMDB_SEARCH_TV = "https://api.themoviedb.org/3/search/tv";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

interface TmdbTv {
  id?: number | string;
  name?: string | null;
  original_name?: string | null;
  poster_path?: string | null;
}

/**
 * Map a TMDB `search/tv` response body's `results` array to MediaResult[].
 * Pure and defensive: tolerates missing fields / odd payloads; never throws on
 * a well-formed-but-sparse input.
 */
export function mapTmdbResponse(json: unknown): MediaResult[] {
  if (!isObject(json)) return [];
  const results = (json as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];

  return results.map((raw: TmdbTv): MediaResult => ({
    mediaId: String(raw?.id ?? ""),
    title: raw?.name ?? raw?.original_name ?? "Untitled",
    imageUrl: raw?.poster_path ? `${TMDB_IMAGE_BASE}${raw.poster_path}` : null,
    mediaType: "cartoon",
  }));
}

/**
 * Parse a full TMDB response body. Pure.
 *
 * TMDB signals failures (bad token, etc.) with `success: false` and a
 * `status_message`, sometimes still on a 2xx. Surface that as a thrown Error so
 * the route degrades to "temporarily unavailable" instead of caching nothing.
 */
export function parseTmdbResponse(json: unknown): MediaResult[] {
  if (isObject(json) && (json as { success?: unknown }).success === false) {
    const message =
      typeof (json as { status_message?: unknown }).status_message === "string"
        ? (json as { status_message: string }).status_message
        : "unknown";
    throw new Error(`TMDB error: ${message}`);
  }
  return mapTmdbResponse(json);
}

/**
 * Live search against TMDB TV shows (used for cartoons). Returns [] for blank
 * queries. Throws a typed Error on missing credentials or HTTP/network failure
 * so the route can catch and degrade gracefully.
 */
export async function searchTmdb(query: string): Promise<MediaResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const token = process.env.TMDB_READ_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  if (!token && !apiKey) {
    throw new Error("TMDB credentials are not configured");
  }

  const url = new URL(TMDB_SEARCH_TV);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");
  // v3 fallback when no bearer token is present.
  if (!token && apiKey) url.searchParams.set("api_key", apiKey);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (cause) {
    throw new Error("TMDB request failed", { cause });
  }

  if (!res.ok) {
    throw new Error(`TMDB responded with status ${res.status}`);
  }

  const json: unknown = await res.json();
  return parseTmdbResponse(json);
}
