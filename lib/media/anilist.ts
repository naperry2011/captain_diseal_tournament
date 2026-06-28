import type { MediaResult } from "./types";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export const ANILIST_QUERY = `
query ($search: String, $perPage: Int) {
  Page(perPage: $perPage) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      title { romaji english }
      coverImage { large medium }
    }
  }
}
`;

/** Build the GraphQL variables. Pure. */
export function anilistQueryVariables(query: string, perPage = 12): { search: string; perPage: number } {
  return { search: query, perPage };
}

interface AnilistMedia {
  id?: number | string;
  title?: { romaji?: string | null; english?: string | null } | null;
  coverImage?: { large?: string | null; medium?: string | null } | null;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Map an AniList `Page` object (the thing holding `media`) to MediaResult[].
 * Pure and defensive: tolerates missing fields, null media, or odd payloads;
 * never throws on a well-formed-but-sparse input.
 */
export function mapAnilistResponse(json: unknown): MediaResult[] {
  if (!isObject(json)) return [];
  const media = (json as { media?: unknown }).media;
  if (!Array.isArray(media)) return [];

  return media.map((raw: AnilistMedia): MediaResult => {
    const title = raw?.title ?? null;
    const cover = raw?.coverImage ?? null;
    return {
      mediaId: String(raw?.id ?? ""),
      title: title?.english ?? title?.romaji ?? "Untitled",
      imageUrl: cover?.large ?? cover?.medium ?? null,
      mediaType: "anime",
    };
  });
}

/**
 * Parse a full AniList GraphQL response body. Pure.
 *
 * AniList returns HTTP 200 even for invalid/throttled queries, signalling the
 * failure via a top-level `errors` array (with `data` null). We surface that as
 * a thrown Error so the route degrades to "temporarily unavailable" rather than
 * caching an empty result set for 24h. A genuinely empty search still returns [].
 */
export function parseAnilistResponse(json: unknown): MediaResult[] {
  if (isObject(json)) {
    const errors = (json as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      const message =
        isObject(first) && typeof first.message === "string" ? first.message : "unknown";
      throw new Error(`AniList error: ${message}`);
    }
    const data = (json as { data?: { Page?: unknown } }).data;
    return mapAnilistResponse(data?.Page);
  }
  return mapAnilistResponse(undefined);
}

/**
 * Live search against AniList's public GraphQL API (no key required).
 * Returns [] for blank queries. Throws a typed Error on HTTP/network failure
 * (or on an AniList `errors` payload) so the route can catch and degrade
 * gracefully.
 */
export async function searchAnilist(query: string): Promise<MediaResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let res: Response;
  try {
    res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: anilistQueryVariables(trimmed),
      }),
    });
  } catch (cause) {
    throw new Error("AniList request failed", { cause });
  }

  if (!res.ok) {
    throw new Error(`AniList responded with status ${res.status}`);
  }

  const json: unknown = await res.json();
  return parseAnilistResponse(json);
}
