import { describe, expect, it } from "vitest";
import { mapIgdbResponse } from "@/lib/media/igdb";

describe("mapIgdbResponse", () => {
  it("maps IGDB games to game MediaResult[] with cover URL", () => {
    const payload = [
      { id: 1022, name: "The Legend of Zelda: Breath of the Wild", cover: { image_id: "co3p2d" } },
      { id: 7346, name: "Tetris", cover: null },
    ];
    expect(mapIgdbResponse(payload)).toEqual([
      {
        mediaId: "1022",
        title: "The Legend of Zelda: Breath of the Wild",
        imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg",
        mediaType: "game",
      },
      {
        mediaId: "7346",
        title: "Tetris",
        imageUrl: null,
        mediaType: "game",
      },
    ]);
  });

  it("falls back to 'Untitled' when no name is present", () => {
    expect(mapIgdbResponse([{ id: 5 }])).toEqual([
      { mediaId: "5", title: "Untitled", imageUrl: null, mediaType: "game" },
    ]);
  });

  it("returns [] for empty arrays and non-array payloads", () => {
    expect(mapIgdbResponse([])).toEqual([]);
    expect(mapIgdbResponse({})).toEqual([]);
    expect(mapIgdbResponse(null)).toEqual([]);
    expect(mapIgdbResponse(undefined)).toEqual([]);
  });
});
