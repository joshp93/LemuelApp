import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useProverbForTheDay } from "../../src/hooks/useProverbForTheDay";

global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockAvailableVersions = ["niv", "kjv", "esv"];

const mockProverb = {
  ref: "Proverbs 3:5",
  proverb: "Trust in the LORD with all your heart",
};

describe("useProverbForTheDay", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("should start with loading state", () => {
    mockFetch.mockImplementation(
      () => new Promise(() => {}) as Promise<Response>,
    );

    const { result } = renderHook(() => useProverbForTheDay());

    expect(result.current.loading).toBe(true);
    expect(result.current.proverb).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should fetch available versions and default to niv", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockAvailableVersions),
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockProverb),
      } as Response);

    const { result } = renderHook(() => useProverbForTheDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.proverb).toEqual(mockProverb);
    expect(result.current.selectedVersion).toBe("niv");
    expect(result.current.availableVersions).toEqual(["niv", "kjv", "esv"]);
    expect(result.current.error).toBeNull();
  });

  it("should set error on failed proverb fetch", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockAvailableVersions),
      } as Response)
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProverbForTheDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.proverb).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.selectedVersion).toBe("niv");
    expect(result.current.availableVersions).toEqual(["niv", "kjv", "esv"]);
  });

  it("should use stored version if it is in available versions", async () => {
    await AsyncStorage.setItem("chosenVersion", "kjv");

    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockAvailableVersions),
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockProverb),
      } as Response);

    const { result } = renderHook(() => useProverbForTheDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedVersion).toBe("kjv");
    expect(result.current.proverb).toEqual(mockProverb);
  });

  it("should remove invalid stored version and fall back to niv", async () => {
    await AsyncStorage.setItem("chosenVersion", "invalid-version");

    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockAvailableVersions),
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockProverb),
      } as Response);

    const { result } = renderHook(() => useProverbForTheDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedVersion).toBe("niv");
    expect(result.current.proverb).toEqual(mockProverb);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("chosenVersion");
  });

  it("should not refetch on re-render", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockAvailableVersions),
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockProverb),
      } as Response);

    const { result, rerender } = renderHook(() => useProverbForTheDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({});

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should save version and refetch on changeVersion", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockAvailableVersions),
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockProverb),
      } as Response);

    const { result } = renderHook(() => useProverbForTheDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newProverb = {
      ref: "Proverbs 3:6",
      proverb: "In all your ways acknowledge Him",
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(newProverb),
    } as Response);

    await act(() => result.current.changeVersion("kjv"));

    expect(result.current.proverb).toEqual(newProverb);
    expect(result.current.selectedVersion).toBe("kjv");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("chosenVersion", "kjv");
  });

  it("should not throw if saving chosenVersion fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockAvailableVersions),
      } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockProverb),
      } as Response);

    const { result } = renderHook(() => useProverbForTheDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error("Storage error"),
    );

    const newProverb = {
      ref: "Proverbs 3:6",
      proverb: "In all your ways acknowledge Him",
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(newProverb),
    } as Response);

    await act(() => result.current.changeVersion("kjv"));

    expect(result.current.proverb).toEqual(newProverb);
    expect(result.current.selectedVersion).toBe("kjv");
  });

  describe("refresh", () => {
    it("should re-fetch proverb for current version", async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockAvailableVersions),
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockProverb),
        } as Response);

      const { result } = renderHook(() => useProverbForTheDay());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refreshedProverb = {
        ref: "Proverbs 3:5",
        proverb: "Trust in the LORD with all your heart (refreshed)",
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(refreshedProverb),
      } as Response);

      await act(() => result.current.refresh());

      expect(result.current.proverb).toEqual(refreshedProverb);
      expect(result.current.selectedVersion).toBe("niv");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle errors on refresh", async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockAvailableVersions),
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockProverb),
        } as Response);

      const { result } = renderHook(() => useProverbForTheDay());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFetch.mockRejectedValueOnce(new Error("Refresh error"));

      await act(() => result.current.refresh());

      expect(result.current.proverb).toBeNull();
      expect(result.current.error).toContain("Refresh error");
    });

    it("should not call fetch if no version is selected", async () => {
      mockFetch.mockImplementation(
        () => new Promise(() => {}) as Promise<Response>,
      );

      const { result } = renderHook(() => useProverbForTheDay());

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      expect(result.current.selectedVersion).toBeNull();

      const initialCallCount = mockFetch.mock.calls.length;
      await act(() => result.current.refresh());

      expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
    });
  });
});
