import type { MediaKind, MediaProvider } from "./types";

/**
 * A not-yet-implemented media provider. Stands in for TMDB (cartoon) and
 * IGDB (game) until API keys are available. `available: false` tells the UI
 * to render a "coming soon" state.
 */
export function makeStubProvider(type: MediaKind): MediaProvider {
  return {
    type,
    available: false,
    async search(): Promise<[]> {
      return [];
    },
  };
}
