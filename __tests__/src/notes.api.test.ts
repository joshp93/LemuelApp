import * as Auth from "../../src/api/auth";
import {
  deleteUserNote,
  getProverbNotes,
  getUserNote,
  getUserNotes,
  postReply,
  saveUserNote,
} from "../../src/api/notes";
import { remoteLog } from "../../src/api/remote-logger";

const mockGetValidIdToken = jest.spyOn(Auth, "getValidIdToken");
const mockRemoteLog = remoteLog as jest.MockedFunction<typeof remoteLog>;

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
      date: "2026-06-02",
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
      "2026-06-02",
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
    expect(init.body).toBe(
      JSON.stringify({ note: "<p>Updated note</p>", date: "2026-06-02" }),
    );
  });

  it("should throw on API failure", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "server error",
    } as Response);

    await expect(
      saveUserNote("uuid-123", "Proverbs3:5", "<p>note</p>", "2026-06-02"),
    ).rejects.toThrow(
      "Failed to save user note: 500 Internal Server Error — server error",
    );
  });

  it("should throw if not authenticated", async () => {
    mockGetValidIdToken.mockResolvedValue(null);

    await expect(
      saveUserNote("uuid-123", "Proverbs3:5", "<p>note</p>", "2026-06-02"),
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

describe("getUserNotes", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all notes for the user on 200", async () => {
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
          pk: "uuid-1",
          sk: "Proverbs4:7",
          note: "<p>Second note</p>",
          dateCreated: "2026-06-03T12:00:00.000Z",
          uuid: "uuid-1",
          ref: "Proverbs4:7",
        },
      ],
    };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await getUserNotes("uuid-1");

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(url).toContain("/notes/users/uuid-1");
    expect(init.headers).toEqual({ Authorization: "valid-token" });
  });

  it("should return empty items when user has no notes", async () => {
    const mockResponse = { items: [] };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await getUserNotes("uuid-1");
    expect(result.items).toHaveLength(0);
  });

  it("should throw on API failure", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(getUserNotes("uuid-1")).rejects.toThrow(
      "Failed to get user notes: 500 Internal Server Error",
    );
  });

  it("should throw if not authenticated", async () => {
    mockGetValidIdToken.mockResolvedValue(null);

    await expect(getUserNotes("uuid-1")).rejects.toThrow("Not authenticated");
  });
});

describe("postReply", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send the reply sort key when editing an existing reply", async () => {
    const mockResponse = {
      pk: "uuid-1",
      sk: "2026-06-02#REPLY#abc",
      content: "edited",
      date: "2026-06-02",
      authorUuid: "uuid-1",
      displayName: "Test",
    };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await postReply(
      "uuid-1",
      "Proverbs3:5",
      "2026-06-02",
      "edited",
      true,
      "reply#2026-06-02T10:00:00.000Z",
    );

    expect(result).toEqual(mockResponse);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/notes/users/uuid-1/Proverbs3:5/replies");
    expect(JSON.parse(init.body as string)).toEqual({
      content: "edited",
      date: "2026-06-02",
      isUpdate: true,
      sk: "reply#2026-06-02T10:00:00.000Z",
    });
  });

  it("should omit the reply sort key when creating a reply", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ sk: "new-reply" }),
    } as Response);

    await postReply("uuid-1", "Proverbs3:5", "2026-06-02", "hello");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ content: "hello", date: "2026-06-02" });
    expect(body).not.toHaveProperty("sk");
  });

  it("should throw on API failure", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "server error",
    } as Response);

    await expect(
      postReply("uuid-1", "Proverbs3:5", "2026-06-02", "hello"),
    ).rejects.toThrow(
      "Failed to post reply: 500 Internal Server Error — server error",
    );
  });
});

describe("device log hygiene", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not log the request URL or the note body", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ note: "<p>private thoughts</p>" }),
    } as Response);

    await saveUserNote(
      "uuid-1",
      "Proverbs3:5",
      "<p>private thoughts</p>",
      "2026-06-02",
    );

    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should report a failed save through remoteLog without the response body", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "server error",
    } as Response);

    await expect(
      saveUserNote(
        "uuid-1",
        "Proverbs3:5",
        "<p>private thoughts</p>",
        "2026-06-02",
      ),
    ).rejects.toThrow();

    expect(mockRemoteLog).toHaveBeenCalledWith(
      "error",
      "[Notes] Failed to save user note",
      { status: 500 },
    );
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should not log when deleting a note", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    await deleteUserNote("uuid-1", "Proverbs3:5", "2026-06-02");

    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
});
