"use client";

import { useEffect, useRef, useState } from "react";
import CoverImage from "@/components/CoverImage";

export type MediaKind = "anime" | "cartoon" | "game";

export interface MediaSelection {
  mediaType: MediaKind;
  mediaId: string;
  title: string;
  imageUrl?: string;
}

interface MediaResult {
  mediaId: string;
  title: string;
  imageUrl: string | null;
  mediaType: MediaKind;
}

interface SearchResponse {
  available: boolean;
  results: MediaResult[];
  error?: string;
}

const TABS: { kind: MediaKind; label: string }[] = [
  { kind: "anime", label: "Anime" },
  { kind: "cartoon", label: "Cartoon" },
  { kind: "game", label: "Game" },
];

// Providers with a live search backend. Others render a "Coming soon" panel.
// anime = AniList, cartoon = TMDB, game = IGDB (via Twitch).
const LIVE_PROVIDERS = new Set<MediaKind>(["anime", "cartoon", "game"]);

/**
 * Per-competitor media attach control. Tabbed (anime + cartoon + game live),
 * debounced search against /api/search/{type}, click-to-select.
 */
export default function MediaSearch({
  selection,
  onSelect,
  onClear,
}: {
  selection?: MediaSelection;
  onSelect: (sel: MediaSelection) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<MediaKind>("anime");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MediaResult[]>([]);

  // Debounce the query (~300ms).
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // Fetch when the debounced query or tab changes. Only runs for a non-empty
  // query; the cleanup resets transient state (so clearing the box empties the
  // result list without a synchronous setState cascade in the effect body).
  const reqRef = useRef(0);
  useEffect(() => {
    if (!open || !debounced) return;

    const req = reqRef;
    const reqId = ++req.current;
    // Loading-before-fetch is the intended sync between React and the network;
    // the rule's "external system" carve-out applies here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetch(`/api/search/${tab}?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json() as Promise<SearchResponse>)
      .then((data) => {
        if (reqId !== req.current) return; // stale response
        setAvailable(data.available);
        setResults(data.results ?? []);
        setError(data.error ?? null);
      })
      .catch(() => {
        if (reqId !== req.current) return;
        setError("Search unavailable");
        setResults([]);
      })
      .finally(() => {
        if (reqId !== req.current) return;
        setLoading(false);
      });

    return () => {
      // Invalidate any in-flight request for the previous query.
      req.current++;
    };
  }, [debounced, tab, open]);

  // Switching tabs clears stale results from the previous provider. For known
  // stub providers (cartoon/game) we optimistically show "Coming soon" right
  // away; the next fetch (once the user types) confirms availability.
  function selectTab(next: MediaKind) {
    if (next === tab) return;
    reqRef.current++; // invalidate any in-flight request
    setTab(next);
    setResults([]);
    setError(null);
    setLoading(false);
    setAvailable(LIVE_PROVIDERS.has(next));
  }

  function choose(r: MediaResult) {
    onSelect({
      mediaType: r.mediaType,
      mediaId: r.mediaId,
      title: r.title,
      imageUrl: r.imageUrl ?? undefined,
    });
    setOpen(false);
    setQuery("");
    setDebounced("");
    setResults([]);
  }

  // Selected state: show the chosen cover + title with a clear button.
  if (selection) {
    return (
      <div className="flex items-center gap-2 rounded border border-dojo-steel bg-dojo-black px-2 py-1">
        <CoverImage
          src={selection.imageUrl}
          className="h-10 w-8 rounded object-cover"
        />
        <span className="max-w-[10rem] truncate text-sm text-dojo-white">
          {selection.title}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="ml-1 text-xs text-dojo-ash transition hover:text-dojo-red"
          aria-label="Clear media"
        >
          ✕
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="display rounded border border-dojo-steel px-3 py-2 text-xs tracking-widest text-dojo-ash transition hover:border-dojo-red hover:text-dojo-white"
      >
        + Media
      </button>
    );
  }

  return (
    <div className="w-full rounded border border-dojo-steel bg-dojo-black p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => selectTab(t.kind)}
              className={`display rounded px-2 py-1 text-xs tracking-widest transition ${
                tab === t.kind
                  ? "bg-dojo-red text-dojo-white"
                  : "text-dojo-ash hover:text-dojo-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-dojo-ash transition hover:text-dojo-red"
          aria-label="Close media search"
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${tab}…`}
        className="w-full rounded border border-dojo-steel bg-dojo-coal px-3 py-2 text-sm text-dojo-white placeholder:text-dojo-ash focus:border-dojo-red focus:outline-none"
        autoFocus
      />

      <div className="mt-2">
        {!available ? (
          <p className="display py-4 text-center text-xs tracking-widest text-dojo-ash">
            Coming soon
          </p>
        ) : error ? (
          <p className="py-3 text-center text-xs text-dojo-ash">
            Search unavailable
          </p>
        ) : loading ? (
          <p className="py-3 text-center text-xs text-dojo-ash">Searching…</p>
        ) : debounced && results.length === 0 ? (
          <p className="py-3 text-center text-xs text-dojo-ash">No results</p>
        ) : debounced && results.length > 0 ? (
          <ul className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {results.map((r) => (
              <li key={r.mediaId}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  className="flex w-full flex-col items-start gap-1 rounded border border-dojo-steel p-1 text-left transition hover:border-dojo-red hover:shadow-red-glow"
                >
                  <CoverImage
                    src={r.imageUrl}
                    className="h-28 w-full rounded object-cover"
                  />
                  <span className="line-clamp-2 text-xs text-dojo-white">
                    {r.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
