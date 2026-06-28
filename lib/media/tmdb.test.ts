import { describe, expect, it } from "vitest";
import { mapTmdbResponse, parseTmdbResponse } from "@/lib/media/tmdb";

describe("mapTmdbResponse (shows)", () => {
  it("maps TV results to show MediaResult[] using the name field + poster URL", () => {
    const payload = {
      results: [
        { id: 1, name: "Avatar: The Last Airbender", poster_path: "/abc.jpg" },
        { id: 2, name: null, original_name: "Samurai Jack", poster_path: null },
      ],
    };
    expect(mapTmdbResponse(payload, "show")).toEqual([
      {
        mediaId: "1",
        title: "Avatar: The Last Airbender",
        imageUrl: "https://image.tmdb.org/t/p/w342/abc.jpg",
        mediaType: "show",
      },
      { mediaId: "2", title: "Samurai Jack", imageUrl: null, mediaType: "show" },
    ]);
  });
});

describe("mapTmdbResponse (movies)", () => {
  it("maps movie results using the title field", () => {
    const payload = {
      results: [
        { id: 603, title: "The Matrix", poster_path: "/m.jpg" },
        { id: 604, title: null, original_title: "Akira", poster_path: null },
      ],
    };
    expect(mapTmdbResponse(payload, "movie")).toEqual([
      {
        mediaId: "603",
        title: "The Matrix",
        imageUrl: "https://image.tmdb.org/t/p/w342/m.jpg",
        mediaType: "movie",
      },
      { mediaId: "604", title: "Akira", imageUrl: null, mediaType: "movie" },
    ]);
  });

  it("falls back to 'Untitled' when no title/name is present", () => {
    expect(mapTmdbResponse({ results: [{ id: 3, poster_path: null }] }, "movie")).toEqual([
      { mediaId: "3", title: "Untitled", imageUrl: null, mediaType: "movie" },
    ]);
  });

  it("returns [] for empty results and odd payloads", () => {
    expect(mapTmdbResponse({ results: [] }, "show")).toEqual([]);
    expect(mapTmdbResponse({}, "movie")).toEqual([]);
    expect(mapTmdbResponse(null, "show")).toEqual([]);
    expect(mapTmdbResponse({ results: null }, "movie")).toEqual([]);
  });
});

describe("parseTmdbResponse", () => {
  it("throws on a TMDB failure payload (success:false)", () => {
    expect(() =>
      parseTmdbResponse({ success: false, status_message: "Invalid API key" }, "show"),
    ).toThrow(/Invalid API key/);
  });

  it("maps a successful payload for the given kind", () => {
    const payload = { results: [{ id: 7, name: "Gravity Falls", poster_path: "/g.jpg" }] };
    expect(parseTmdbResponse(payload, "show")).toEqual([
      {
        mediaId: "7",
        title: "Gravity Falls",
        imageUrl: "https://image.tmdb.org/t/p/w342/g.jpg",
        mediaType: "show",
      },
    ]);
  });
});
