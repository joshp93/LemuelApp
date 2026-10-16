import { buildPendingReply, isPendingReply } from "../../src/utils/replies";

describe("buildPendingReply", () => {
  it("carries the content and the author", () => {
    const reply = buildPendingReply("Amen", "u1", "Joshua");

    expect(reply.content).toBe("Amen");
    expect(reply.authorUuid).toBe("u1");
    expect(reply.displayName).toBe("Joshua");
    expect(isPendingReply(reply)).toBe(true);
  });

  it("gives each reply a sort key of its own", () => {
    const first = buildPendingReply("One", "u1", "Joshua");
    const second = buildPendingReply("Two", "u1", "Joshua");

    expect(first.sk).not.toBe(second.sk);
  });

  it("does not claim a saved reply is pending", () => {
    expect(isPendingReply({ sk: "REPLY#2026-06-16#u1" } as never)).toBe(false);
  });
});
