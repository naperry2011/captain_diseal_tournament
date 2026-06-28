export type MediaKind = "anime" | "cartoon" | "game";

export interface MediaResult {
  mediaId: string;
  title: string;
  imageUrl: string | null;
  mediaType: MediaKind;
}

export interface SearchResponse {
  available: boolean; // false for not-yet-implemented providers (stubs)
  results: MediaResult[];
  error?: string; // set when a provider failed gracefully
}

// Scaffolding for the Phase 4 provider registry, which will resolve a
// MediaKind to its MediaProvider and call search() uniformly. Until then the
// search route hardcodes provider behavior inline (AniList live, others stubbed).
export interface MediaProvider {
  type: MediaKind;
  available: boolean;
  search(query: string): Promise<MediaResult[]>;
}
