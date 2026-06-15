import { LEMUEL_API_BASE_URL } from "../../src/api/constants";
import { getProverbForTheDay } from "../../src/api/proverbs";

global.fetch = jest.fn();

describe("getProverbForTheDay", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and parse a valid proverb response", async () => {
    const mockProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD with all your heart",
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockProverb),
    } as Response);

    const result = await getProverbForTheDay("niv");

    expect(result).toEqual(mockProverb);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(`${LEMUEL_API_BASE_URL}/niv`, {
      method: "GET",
    });
  });

  it("should throw an error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(getProverbForTheDay("niv")).rejects.toThrow("Network error");
  });

  it("should throw an error on invalid response data", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ invalid: "data" }),
    } as Response);

    await expect(getProverbForTheDay("niv")).rejects.toThrow();
  });

  it("should use the correct API endpoint", async () => {
    const mockProverb = {
      ref: "Proverbs 3:5",
      proverb: "Trust in the LORD",
    };

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockProverb),
    } as Response);

    await getProverbForTheDay("niv");

    expect(mockFetch).toHaveBeenCalledWith(`${LEMUEL_API_BASE_URL}/niv`, {
      method: "GET",
    });
  });
});
