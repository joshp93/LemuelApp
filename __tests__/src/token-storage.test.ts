import type AsyncStorageStatic from "@react-native-async-storage/async-storage";

type TokenStorage = typeof import("../../src/auth/token-storage");

interface SecureStoreMock {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
}

interface Harness {
  storage: TokenStorage;
  asyncStorage: AsyncStorageStatic;
  secureStore: SecureStoreMock;
}

const LEGACY_KEYS = [
  "cognito_id_token",
  "cognito_access_token",
  "cognito_refresh_token",
];

const TOKENS = {
  idToken: "id-token",
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

/**
 * Loads the token store with fresh module state, so the in-memory cache and
 * the one-time migration do not leak between tests.
 */
async function withFreshStorage(
  run: (harness: Harness) => Promise<void>,
): Promise<void> {
  let pending: Promise<void> = Promise.resolve();

  jest.isolateModules(() => {
    const storage = require("../../src/auth/token-storage") as TokenStorage;
    const asyncStorageModule =
      require("@react-native-async-storage/async-storage") as AsyncStorageStatic & {
        default?: AsyncStorageStatic;
      };
    const asyncStorage = asyncStorageModule.default ?? asyncStorageModule;
    const secureStore = require("expo-secure-store") as SecureStoreMock;

    pending = run({ storage, asyncStorage, secureStore });
  });

  await pending;
}

describe("token-storage", () => {
  it("saves the tokens to the secure store", async () => {
    await withFreshStorage(async ({ storage, asyncStorage, secureStore }) => {
      await storage.saveTokens(TOKENS);

      expect(secureStore.setItemAsync).toHaveBeenCalledTimes(3);
      await expect(storage.getTokens()).resolves.toEqual(TOKENS);
      await expect(asyncStorage.getItem(LEGACY_KEYS[0])).resolves.toBeNull();
    });
  });

  it("reads the tokens saved by a previous session", async () => {
    await withFreshStorage(async ({ storage, secureStore }) => {
      await secureStore.setItemAsync(LEGACY_KEYS[0], TOKENS.idToken);
      await secureStore.setItemAsync(LEGACY_KEYS[1], TOKENS.accessToken);
      await secureStore.setItemAsync(LEGACY_KEYS[2], TOKENS.refreshToken);

      await expect(storage.getTokens()).resolves.toEqual(TOKENS);
    });
  });

  it("returns null when nothing is stored", async () => {
    await withFreshStorage(async ({ storage }) => {
      await expect(storage.getTokens()).resolves.toBeNull();
    });
  });

  it("moves tokens left in AsyncStorage into the secure store", async () => {
    await withFreshStorage(async ({ storage, asyncStorage, secureStore }) => {
      await asyncStorage.multiSet([
        [LEGACY_KEYS[0], TOKENS.idToken],
        [LEGACY_KEYS[1], TOKENS.accessToken],
        [LEGACY_KEYS[2], TOKENS.refreshToken],
      ]);

      await expect(storage.getTokens()).resolves.toEqual(TOKENS);

      expect(secureStore.setItemAsync).toHaveBeenCalledWith(
        LEGACY_KEYS[0],
        TOKENS.idToken,
      );
      for (const key of LEGACY_KEYS) {
        await expect(asyncStorage.getItem(key)).resolves.toBeNull();
      }
    });
  });

  it("keeps the legacy tokens readable when the secure write fails", async () => {
    await withFreshStorage(async ({ storage, asyncStorage, secureStore }) => {
      secureStore.setItemAsync.mockRejectedValueOnce(new Error("no keystore"));

      await asyncStorage.multiSet([
        [LEGACY_KEYS[0], TOKENS.idToken],
        [LEGACY_KEYS[1], TOKENS.accessToken],
        [LEGACY_KEYS[2], TOKENS.refreshToken],
      ]);

      await expect(storage.getTokens()).resolves.toEqual(TOKENS);
      await expect(asyncStorage.getItem(LEGACY_KEYS[0])).resolves.toBe(
        TOKENS.idToken,
      );
    });
  });

  it("clears both copies on sign out", async () => {
    await withFreshStorage(async ({ storage, asyncStorage, secureStore }) => {
      await storage.saveTokens(TOKENS);
      await storage.clearTokens();

      expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
      await expect(storage.getTokens()).resolves.toBeNull();
      for (const key of LEGACY_KEYS) {
        await expect(asyncStorage.getItem(key)).resolves.toBeNull();
      }
    });
  });
});
