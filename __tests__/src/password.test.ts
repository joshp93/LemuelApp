import { getPasswordError } from "../../src/utils/password";

describe("getPasswordError", () => {
  it("should return null for empty password", () => {
    expect(getPasswordError("")).toBeNull();
  });

  it("should return error for password shorter than 8 characters", () => {
    expect(getPasswordError("Abc1")).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("should return error for password without number", () => {
    expect(getPasswordError("NoNumbersHere")).toBe(
      "Password must contain at least 1 number",
    );
  });

  it("should return error for password without uppercase", () => {
    expect(getPasswordError("nouppercase1")).toBe(
      "Password must contain at least 1 uppercase letter",
    );
  });

  it("should return error for password without lowercase", () => {
    expect(getPasswordError("NOLOWERCASE1")).toBe(
      "Password must contain at least 1 lowercase letter",
    );
  });

  it("should return null for valid password", () => {
    expect(getPasswordError("ValidPass1")).toBeNull();
  });
});
