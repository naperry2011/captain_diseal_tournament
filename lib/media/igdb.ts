import type { MediaResult } from "./types";

// IGDB powers the "game" category. Access is gated behind Twitch OAuth: we
// exchange the Twitch client id/secret for an app access token (client-
// credentials grant), then call IGDB's v4 API with Client-ID + bearer token.
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";
const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload/t_cover_big";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

interface IgdbGame {
  id?: number | string;
  name?: string | null;
  cover?: { image_id?: string | null } | null;
}

/**
 * Map an IGDB `/v4/games` response (an array of games) to MediaResult[].
 * Pure and defensive: a non-array payload or sparse entries yield safe values;
 * never throws on well-formed-but-sparse input.
 */
export function mapIgdbResponse(json: unknown): MediaResult[] {
  if (!Array.isArray(json)) return [];
  return json.map((raw: IgdbGame): MediaResult => ({
    mediaId: String(raw?.id ?? ""),
    title: raw?.name ?? "Untitled",
    imageUrl: raw?.cover?.image_id
      ? `${IGDB_IMAGE_BASE}/${raw.cover.image_id}.jpg`
      : null,
    mediaType: "game",
  }));
}

// Cache the Twitch app token in module memory (valid ~60 days). Re-fetched on a
// cold start or when within a minute of expiry. Best-effort across warm invocations.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getTwitchToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Twitch credentials are not configured");
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const url = new URL(TWITCH_TOKEN_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Twitch token request failed with status ${res.status}`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error("Twitch token missing from response");
  }
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

/**
 * Live search against IGDB games. Returns [] for blank queries. Throws a typed
 * Error on missing credentials or HTTP/network failure so the route can catch
 * and degrade gracefully.
 */
export async function searchIgdb(query: string): Promise<MediaResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) throw new Error("Twitch credentials are not configured");

  const token = await getTwitchToken();
  // Apicalypse query. Strip quotes/backslashes from the search term to keep the
  // query well-formed.
  const safe = trimmed.replace(/["\\]/g, " ");
  const body = `search "${safe}"; fields name,cover.image_id; limit 12;`;

  let res: Response;
  try {
    res = await fetch(IGDB_GAMES_URL, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body,
    });
  } catch (cause) {
    throw new Error("IGDB request failed", { cause });
  }

  if (!res.ok) {
    throw new Error(`IGDB responded with status ${res.status}`);
  }

  const json: unknown = await res.json();
  if (isObject(json) && !Array.isArray(json)) {
    // IGDB returns an array on success; an object here signals an error shape.
    throw new Error("IGDB returned an unexpected response");
  }
  return mapIgdbResponse(json);
}
