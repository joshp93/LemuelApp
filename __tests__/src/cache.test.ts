import {
  clearCache,
  readCache,
  removeCache,
  withCache,
  writeCache,
} from "../../src/cache/store";

describe("cache store", () => {
  it("serves a second read from the cache", async () => {
    const fetcher = jest.fn().mockResolvedValue("value");

    await expect(withCache("test:value", 1000, fetcher)).resolves.toBe("value");
    await expect(withCache("test:value", 1000, fetcher)).resolves.toBe("value");

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("shares one request between concurrent readers", async () => {
    const fetcher = jest.fn().mockResolvedValue("value");

    const [first, second] = await Promise.all([
      withCache("test:concurrent", 1000, fetcher),
      withCache("test:concurrent", 1000, fetcher),
    ]);

    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("fetches again once the value has expired", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    await expect(withCache("test:ttl", 0, fetcher)).resolves.toBe("first");
    await expect(withCache("test:ttl", 0, fetcher)).resolves.toBe("second");
  });

  it("does not cache a failed fetch", async () => {
    const fetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("value");

    await expect(withCache("test:error", 1000, fetcher)).rejects.toThrow(
      "offline",
    );
    await expect(withCache("test:error", 1000, fetcher)).resolves.toBe("value");
  });

  it("removes one entry", async () => {
    await writeCache("test:remove", "value");
    await removeCache("test:remove");

    await expect(readCache("test:remove", 1000)).resolves.toBeUndefined();
  });

  it("empties every entry", async () => {
    await writeCache("test:empty", "value");
    await clearCache();

    await expect(readCache("test:empty", 1000)).resolves.toBeUndefined();
  });
});
