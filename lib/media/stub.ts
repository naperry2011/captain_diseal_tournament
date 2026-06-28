import type { MediaKind, MediaProvider } from "./types";

/**
 * A not-yet-implemented media provider. Stands in for TMDB (cartoon) and
 * IGDB (game) until API keys are available. `available: false` tells the UI
 * to render a "coming soon" state.
 *
 * Scaffolding for the Phase 4 provider registry, which will register these
 * alongside the live AniList provider. The search route currently reproduces
 * this stub behavior inline rather than consuming the registry.
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
