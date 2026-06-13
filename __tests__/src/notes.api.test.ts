import * as Auth from "../../src/api/auth";
import {
  getProverbNotes,
  getUserNote,
  saveUserNote,
} from "../../src/api/notes";

const mockGetValidIdToken = jest.spyOn(Auth, "getValidIdToken");

global.fetch = jest.fn();

describe("getUserNote", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the note on 200", async () => {
    const mockData = {
      pk: "uuid-123",
      sk: "Proverbs3:5",
      note: "<p>Some note content</p>",
      dateCreated: "2026-06-02T12:00:00.000Z",
      uuid: "uuid-123",
      ref: "Proverbs3:5",
    };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await getUserNote("uuid-123", "Proverbs3:5");

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(url).toContain("/notes/users/uuid-123/Proverbs3:5");
    expect(init.headers).toEqual({ Authorization: "valid-token" });
  });

  it("should return null on 404", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await getUserNote("uuid-123", "Proverbs3:5");

    expect(result).toBeNull();
  });

  it("should throw on non-404 errors", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(getUserNote("uuid-123", "Proverbs3:5")).rejects.toThrow(
      "Failed to get user note: 500 Internal Server Error",
    );
  });

  it("should throw if not authenticated", async () => {
    mockGetValidIdToken.mockResolvedValue(null);

    await expect(getUserNote("uuid-123", "Proverbs3:5")).rejects.toThrow(
      "Not authenticated",
    );
  });
});

describe("saveUserNote", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save the note and return the entity on success", async () => {
    const mockResponse = {
      pk: "uuid-123",
      sk: "Proverbs3:5",
      note: "<p>Updated note</p>",
      dateCreated: "2026-06-02T12:05:00.000Z",
      uuid: "uuid-123",
      ref: "Proverbs3:5",
    };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await saveUserNote(
      "uuid-123",
      "Proverbs3:5",
      "<p>Updated note</p>",
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(url).toContain("/notes/users/uuid-123/Proverbs3:5");
    expect(init.headers).toEqual({
      Authorization: "valid-token",
      "Content-Type": "application/json",
    });
    expect(init.body).toBe(JSON.stringify({ note: "<p>Updated note</p>" }));
  });

  it("should throw on API failure", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(
      saveUserNote("uuid-123", "Proverbs3:5", "<p>note</p>"),
    ).rejects.toThrow("Failed to save user note: 500 Internal Server Error");
  });

  it("should throw if not authenticated", async () => {
    mockGetValidIdToken.mockResolvedValue(null);

    await expect(
      saveUserNote("uuid-123", "Proverbs3:5", "<p>note</p>"),
    ).rejects.toThrow("Not authenticated");
  });
});

describe("getProverbNotes", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return notes on 200", async () => {
    const mockResponse = {
      items: [
        {
          pk: "uuid-1",
          sk: "Proverbs3:5",
          note: "<p>First note</p>",
          dateCreated: "2026-06-02T12:00:00.000Z",
          uuid: "uuid-1",
          ref: "Proverbs3:5",
        },
        {
          pk: "uuid-2",
          sk: "Proverbs3:5",
          note: "<p>Second note</p>",
          dateCreated: "2026-06-03T12:00:00.000Z",
          uuid: "uuid-2",
          ref: "Proverbs3:5",
        },
      ],
    };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await getProverbNotes("Proverbs3:5");

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(url).toContain("/notes/proverbs/Proverbs3:5");
    expect(init.headers).toEqual({ Authorization: "valid-token" });
  });

  it("should strip spaces from ref", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [], lastKey: undefined }),
    } as Response);

    await getProverbNotes("Proverbs 3:5");

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/notes/proverbs/Proverbs3:5");
  });

  it("should return empty items list in response", async () => {
    const mockResponse = { items: [], lastKey: undefined };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await getProverbNotes("Proverbs3:5");

    expect(result).toEqual(mockResponse);
    expect(result.items).toHaveLength(0);
  });

  it("should throw on API failure", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(getProverbNotes("Proverbs3:5")).rejects.toThrow(
      "Failed to get proverb notes: 500 Internal Server Error",
    );
  });

  it("should throw if not authenticated", async () => {
    mockGetValidIdToken.mockResolvedValue(null);

    await expect(getProverbNotes("Proverbs3:5")).rejects.toThrow(
      "Not authenticated",
    );
  });
});
