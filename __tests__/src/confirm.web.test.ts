import { confirm } from "../../src/utils/confirm.web";

describe("confirm (web)", () => {
  const mockConfirm = jest.fn();

  beforeEach(() => {
    mockConfirm.mockReset();
    (globalThis as unknown as { window: { confirm: jest.Mock } }).window = {
      confirm: mockConfirm,
    };
  });

  it("resolves true when window.confirm accepts", async () => {
    mockConfirm.mockReturnValue(true);
    await expect(confirm({ title: "Delete" })).resolves.toBe(true);
  });

  it("resolves false when window.confirm dismisses", async () => {
    mockConfirm.mockReturnValue(false);
    await expect(confirm({ title: "Delete" })).resolves.toBe(false);
  });

  it("joins the title and message for window.confirm", async () => {
    mockConfirm.mockReturnValue(false);
    await confirm({ title: "Delete Note", message: "Are you sure?" });
    expect(mockConfirm).toHaveBeenCalledWith("Delete Note\n\nAre you sure?");
  });

  it("passes only the title when no message is given", async () => {
    mockConfirm.mockReturnValue(false);
    await confirm({ title: "Delete Note" });
    expect(mockConfirm).toHaveBeenCalledWith("Delete Note");
  });
});
