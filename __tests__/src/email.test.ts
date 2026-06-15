import { isValidEmail } from "../../src/utils/email";

describe("isValidEmail", () => {
  it("should accept valid email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  it("should reject email without @", () => {
    expect(isValidEmail("testexample.com")).toBe(false);
  });

  it("should reject email without domain", () => {
    expect(isValidEmail("test@")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("should reject email with spaces", () => {
    expect(isValidEmail("test@ example.com")).toBe(false);
  });
});
