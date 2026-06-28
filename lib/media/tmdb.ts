import type { MediaKind, MediaResult } from "./types";

// TMDB powers the "show" (TV) and "movie" categories. We authenticate with the
// v4 Read Access Token (bearer) when available, falling back to the v3 API key
// as a query param. Poster paths are relative; we prefix the image CDN base.
const TMDB_SEARCH_TV = "https://api.themoviedb.org/3/search/tv";
const TMDB_SEARCH_MOVIE = "https://api.themoviedb.org/3/search/movie";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

interface TmdbResult {
  id?: number | string;
  // TV results use name/original_name; movie results use title/original_title.
  name?: string | null;
  original_name?: string | null;
  title?: string | null;
  original_title?: string | null;
  poster_path?: string | null;
}

/**
 * Map a TMDB search response body's `results` array to MediaResult[] of the
 * given kind ("show" or "movie"). Pure and defensive: tolerates missing fields
 * / odd payloads; never throws on a well-formed-but-sparse input.
 */
export function mapTmdbResponse(json: unknown, kind: MediaKind): MediaResult[] {
  if (!isObject(json)) return [];
  const results = (json as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];

  return results.map((raw: TmdbResult): MediaResult => {
    const title =
      kind === "movie"
        ? raw?.title ?? raw?.original_title ?? "Untitled"
        : raw?.name ?? raw?.original_name ?? "Untitled";
    return {
      mediaId: String(raw?.id ?? ""),
      title,
      imageUrl: raw?.poster_path ? `${TMDB_IMAGE_BASE}${raw.poster_path}` : null,
      mediaType: kind,
    };
  });
}

/**
 * Parse a full TMDB response body for the given kind. Pure.
 *
 * TMDB signals failures (bad token, etc.) with `success: false` and a
 * `status_message`, sometimes still on a 2xx. Surface that as a thrown Error so
 * the route degrades to "temporarily unavailable" instead of caching nothing.
 */
export function parseTmdbResponse(json: unknown, kind: MediaKind): MediaResult[] {
  if (isObject(json) && (json as { success?: unknown }).success === false) {
    const message =
      typeof (json as { status_message?: unknown }).status_message === "string"
        ? (json as { status_message: string }).status_message
        : "unknown";
    throw new Error(`TMDB error: ${message}`);
  }
  return mapTmdbResponse(json, kind);
}

/**
 * Shared live TMDB search. Returns [] for blank queries. Throws a typed Error on
 * missing credentials or HTTP/network failure so the route can degrade.
 */
async function searchTmdb(endpoint: string, query: string, kind: MediaKind): Promise<MediaResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const token = process.env.TMDB_READ_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  if (!token && !apiKey) {
    throw new Error("TMDB credentials are not configured");
  }

  const url = new URL(endpoint);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");
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
  return parseTmdbResponse(json, kind);
}

/** Live search against TMDB TV shows (the "show" category). */
export function searchTmdbShows(query: string): Promise<MediaResult[]> {
  return searchTmdb(TMDB_SEARCH_TV, query, "show");
}

/** Live search against TMDB movies (the "movie" category). */
export function searchTmdbMovies(query: string): Promise<MediaResult[]> {
  return searchTmdb(TMDB_SEARCH_MOVIE, query, "movie");
}
