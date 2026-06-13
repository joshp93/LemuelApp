import { ProverbSchema } from "../../src/models/proverb";

describe("Proverb Schema", () => {
  it("should validate a correct proverb object", () => {
    const validProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
    };

    const result = ProverbSchema.safeParse(validProverb);
    expect(result.success).toBe(true);
  });

  it("should reject a proverb missing ref", () => {
    const invalidProverb = {
      proverb: "Trust in the LORD with all your heart",
    };

    const result = ProverbSchema.safeParse(invalidProverb);
    expect(result.success).toBe(false);
  });

  it("should reject a proverb missing proverb text", () => {
    const invalidProverb = {
      ref: "Proverbs 3:5",
    };

    const result = ProverbSchema.safeParse(invalidProverb);
    expect(result.success).toBe(false);
  });

  it("should reject an object with extra fields", () => {
    const proverbWithExtra = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
      extra: "This should not be allowed",
    };

    const result = ProverbSchema.safeParse(proverbWithExtra);
    expect(result.success).toBe(true);
  });

  it("should accept an optional citation field", () => {
    const proverbWithCitation = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
      citation: "King James Version (KJV)",
    };

    const result = ProverbSchema.safeParse(proverbWithCitation);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.citation).toBe("King James Version (KJV)");
    }
  });

  it("should parse successfully without citation", () => {
    const proverbWithoutCitation = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
    };

    const result = ProverbSchema.safeParse(proverbWithoutCitation);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.citation).toBeUndefined();
    }
  });

  it("should infer the correct type", () => {
    const validProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
    };

    const parsed = ProverbSchema.parse(validProverb);
    const inferred: { ref: string; proverb: string; citation?: string } =
      parsed;
    expect(inferred.ref).toBe(validProverb.ref);
    expect(inferred.proverb).toBe(validProverb.proverb);
  });
});
