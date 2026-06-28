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

export interface MediaProvider {
  type: MediaKind;
  available: boolean;
  search(query: string): Promise<MediaResult[]>;
}
