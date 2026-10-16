import { moveReaction, reactionKey } from "../../src/utils/reactions";

describe("reactionKey", () => {
  it("identifies a note by its author, reference and date", () => {
    expect(
      reactionKey({ uuid: "u1", ref: "Proverbs3:5", date: "2026-06-16" }),
    ).toBe("u1#Proverbs3:5#2026-06-16");
  });
});

describe("moveReaction", () => {
  it("adds a reaction that was not there", () => {
    expect(moveReaction({ "🙏": 2 }, null, "❤️")).toEqual({
      "🙏": 2,
      "❤️": 1,
    });
  });

  it("moves a reaction from one emoji to another", () => {
    expect(moveReaction({ "🙏": 2, "❤️": 1 }, "🙏", "❤️")).toEqual({
      "🙏": 1,
      "❤️": 2,
    });
  });

  it("removes a reaction when nothing replaces it", () => {
    expect(moveReaction({ "🙏": 2 }, "🙏", null)).toEqual({ "🙏": 1 });
  });

  it("never counts below zero", () => {
    expect(moveReaction({ "🙏": 0 }, "🙏", null)).toEqual({ "🙏": 0 });
  });

  it("leaves the counts alone when the reaction has not changed", () => {
    const counts = { "🙏": 2 };

    expect(moveReaction(counts, "🙏", "🙏")).toBe(counts);
  });

  it("does not mutate the counts it was given", () => {
    const counts = { "🙏": 2 };
    moveReaction(counts, "🙏", "❤️");

    expect(counts).toEqual({ "🙏": 2 });
  });
});
