import { describe, it, expect } from "vitest";
import { mapAnilistResponse, anilistQueryVariables, parseAnilistResponse } from "./anilist";

describe("mapAnilistResponse", () => {
  it("maps a sample payload with english/romaji fallback and cover image fallback", () => {
    const page = {
      media: [
        {
          id: 1,
          title: { romaji: "Naruto", english: "Naruto" },
          coverImage: { large: "https://img/large.jpg", medium: "https://img/medium.jpg" },
        },
        {
          id: 2,
          title: { romaji: "Bleach", english: null },
          coverImage: { large: null, medium: "https://img/m2.jpg" },
        },
      ],
    };

    expect(mapAnilistResponse(page)).toEqual([
      {
        mediaId: "1",
        title: "Naruto",
        imageUrl: "https://img/large.jpg",
        mediaType: "anime",
      },
      {
        mediaId: "2",
        title: "Bleach",
        imageUrl: "https://img/m2.jpg",
        mediaType: "anime",
      },
    ]);
  });

  it("returns [] for an empty media array", () => {
    expect(mapAnilistResponse({ media: [] })).toEqual([]);
  });

  it("returns [] for missing/odd payloads", () => {
    expect(mapAnilistResponse({})).toEqual([]);
    expect(mapAnilistResponse({ media: null })).toEqual([]);
    expect(mapAnilistResponse(null)).toEqual([]);
    expect(mapAnilistResponse(undefined)).toEqual([]);
    expect(mapAnilistResponse("nonsense")).toEqual([]);
  });

  it("falls back to romaji then 'Untitled' when english is absent", () => {
    const page = {
      media: [
        { id: 3, title: { romaji: "Romaji Only" }, coverImage: { large: "x" } },
        { id: 4, title: {}, coverImage: null },
      ],
    };
    const out = mapAnilistResponse(page);
    expect(out[0].title).toBe("Romaji Only");
    expect(out[1].title).toBe("Untitled");
    expect(out[1].imageUrl).toBeNull();
  });
});

describe("parseAnilistResponse", () => {
  it("throws on a non-empty top-level errors array", () => {
    expect(() =>
      parseAnilistResponse({ data: null, errors: [{ message: "Too Many Requests." }] })
    ).toThrow("Too Many Requests.");
  });

  it("throws with 'unknown' when an error lacks a message", () => {
    expect(() => parseAnilistResponse({ errors: [{}] })).toThrow("unknown");
  });

  it("maps results from a valid { data: { Page: { media } } } payload", () => {
    const json = {
      data: {
        Page: {
          media: [{ id: 7, title: { english: "Trigun" }, coverImage: { large: "x" } }],
        },
      },
    };
    expect(parseAnilistResponse(json)).toEqual([
      { mediaId: "7", title: "Trigun", imageUrl: "x", mediaType: "anime" },
    ]);
  });

  it("returns [] for { data: { Page: null } }", () => {
    expect(parseAnilistResponse({ data: { Page: null } })).toEqual([]);
  });
});

describe("anilistQueryVariables", () => {
  it("returns {search, perPage} with default perPage 12", () => {
    expect(anilistQueryVariables("naruto")).toEqual({ search: "naruto", perPage: 12 });
  });

  it("honours an explicit perPage", () => {
    expect(anilistQueryVariables("bleach", 5)).toEqual({ search: "bleach", perPage: 5 });
  });
});
