import { describe, expect, it } from "vitest";
import { mapTmdbResponse, parseTmdbResponse } from "@/lib/media/tmdb";

describe("mapTmdbResponse", () => {
  it("maps TV results to cartoon MediaResult[] with poster URL", () => {
    const payload = {
      results: [
        { id: 1, name: "Avatar: The Last Airbender", poster_path: "/abc.jpg" },
        { id: 2, name: null, original_name: "Samurai Jack", poster_path: null },
      ],
    };
    expect(mapTmdbResponse(payload)).toEqual([
      {
        mediaId: "1",
        title: "Avatar: The Last Airbender",
        imageUrl: "https://image.tmdb.org/t/p/w342/abc.jpg",
        mediaType: "cartoon",
      },
      {
        mediaId: "2",
        title: "Samurai Jack",
        imageUrl: null,
        mediaType: "cartoon",
      },
    ]);
  });

  it("falls back to 'Untitled' when no name is present", () => {
    expect(mapTmdbResponse({ results: [{ id: 3, poster_path: null }] })).toEqual([
      { mediaId: "3", title: "Untitled", imageUrl: null, mediaType: "cartoon" },
    ]);
  });

  it("returns [] for empty results and for odd payloads", () => {
    expect(mapTmdbResponse({ results: [] })).toEqual([]);
    expect(mapTmdbResponse({})).toEqual([]);
    expect(mapTmdbResponse(null)).toEqual([]);
    expect(mapTmdbResponse({ results: null })).toEqual([]);
  });
});

describe("parseTmdbResponse", () => {
  it("throws on a TMDB failure payload (success:false)", () => {
    expect(() =>
      parseTmdbResponse({ success: false, status_message: "Invalid API key" }),
    ).toThrow(/Invalid API key/);
  });

  it("maps a successful payload", () => {
    const payload = { results: [{ id: 7, name: "Gravity Falls", poster_path: "/g.jpg" }] };
    expect(parseTmdbResponse(payload)).toEqual([
      {
        mediaId: "7",
        title: "Gravity Falls",
        imageUrl: "https://image.tmdb.org/t/p/w342/g.jpg",
        mediaType: "cartoon",
      },
    ]);
  });
});
