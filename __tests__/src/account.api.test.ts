import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { createAccountRecord, getAccountDetails } from "../../src/api/account";
import * as Auth from "../../src/api/auth";

jest.mock("jwt-decode");

const mockGetValidIdToken = jest.spyOn(Auth, "getValidIdToken");

global.fetch = jest.fn();

describe("getAccountDetails", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return account details on 200", async () => {
    const mockData = {
      pk: "uuid-123",
      sk: "account",
      accountCreatedDate: "2025-01-15T10:00:00.000Z",
      totalMeditations: 5,
      totalNotes: 2,
    };

    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await getAccountDetails("uuid-123");

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(url).toContain("/accounts/uuid-123");
    expect(init.headers).toEqual({ Authorization: "valid-token" });
  });

  it("should return null on 404", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await getAccountDetails("uuid-123");

    expect(result).toBeNull();
  });

  it("should throw on non-404 errors", async () => {
    mockGetValidIdToken.mockResolvedValue("valid-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(getAccountDetails("uuid-123")).rejects.toThrow(
      "Failed to get account details: 500 Internal Server Error",
    );
  });

  it("should throw if not authenticated", async () => {
    mockGetValidIdToken.mockResolvedValue(null);

    await expect(getAccountDetails("uuid-123")).rejects.toThrow(
      "Not authenticated",
    );
  });
});

describe("createAccountRecord", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should skip if ACCOUNT_CREATED is already true", async () => {
    await AsyncStorage.setItem("ACCOUNT_CREATED", "true");

    const result = await createAccountRecord();

    expect(result).toBe(true);
    expect(mockGetValidIdToken).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should create account and set flag on success", async () => {
    await AsyncStorage.removeItem("ACCOUNT_CREATED");
    mockGetValidIdToken.mockResolvedValue("valid-token");
    (jwtDecode as jest.Mock).mockReturnValue({ sub: "uuid-123" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    const result = await createAccountRecord();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(url).toContain("/accounts/uuid-123/create");
    expect(init.headers).toEqual({ Authorization: "valid-token" });

    const flag = await AsyncStorage.getItem("ACCOUNT_CREATED");
    expect(flag).toBe("true");
  });

  it("should return false if no valid token", async () => {
    await AsyncStorage.removeItem("ACCOUNT_CREATED");
    mockGetValidIdToken.mockResolvedValue(null);

    const result = await createAccountRecord();

    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return false on API failure", async () => {
    await AsyncStorage.removeItem("ACCOUNT_CREATED");
    mockGetValidIdToken.mockResolvedValue("valid-token");
    (jwtDecode as jest.Mock).mockReturnValue({ sub: "uuid-123" });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await createAccountRecord();

    expect(result).toBe(false);
    const flag = await AsyncStorage.getItem("ACCOUNT_CREATED");
    expect(flag).toBeNull();
  });
});
