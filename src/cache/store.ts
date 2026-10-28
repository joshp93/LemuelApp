import AsyncStorage from "@react-native-async-storage/async-storage";

/** Namespace and schema version for everything this module stores. */
const PREFIX = "lemuel:cache:v1:";

interface CacheEnvelope {
  storedAt: number;
  value: unknown;
}

/** Cache entries read this session, so a hit does not touch storage. */
const memory = new Map<string, CacheEnvelope>();

/** Requests already running, so a repeated key shares one response. */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Builds the storage key for a cache key.
 *
 * @param key - The logical cache key.
 * @returns The namespaced key used in AsyncStorage.
 */
function storageKey(key: string): string {
  return `${PREFIX}${key}`;
}

/**
 * Whether a stored entry is still within its lifetime.
 *
 * @param envelope - The stored entry.
 * @param ttlMs - How long the entry stays fresh.
 * @returns True when the entry may be served.
 */
function isFresh(envelope: CacheEnvelope, ttlMs: number): boolean {
  if (ttlMs === Number.POSITIVE_INFINITY) return true;
  return Date.now() - envelope.storedAt < ttlMs;
}

/**
 * Reads an entry from memory, falling back to device storage.
 *
 * @param key - The logical cache key.
 * @returns The stored entry, or undefined when there is none.
 */
async function readEnvelope(key: string): Promise<CacheEnvelope | undefined> {
  const cached = memory.get(key);
  if (cached) return cached;

  try {
    const raw = await AsyncStorage.getItem(storageKey(key));
    if (!raw) return undefined;

    const envelope = JSON.parse(raw) as CacheEnvelope;
    if (typeof envelope?.storedAt !== "number" || !("value" in envelope)) {
      return undefined;
    }

    memory.set(key, envelope);
    return envelope;
  } catch {
    return undefined;
  }
}

/**
 * Reads a value from the cache.
 *
 * @param key - The logical cache key.
 * @param ttlMs - How long the value stays fresh.
 * @returns The cached value, or undefined when absent or expired.
 */
export async function readCache<T>(
  key: string,
  ttlMs: number,
): Promise<T | undefined> {
  const envelope = await readEnvelope(key);
  if (!envelope || !isFresh(envelope, ttlMs)) return undefined;
  return envelope.value as T;
}

/**
 * Writes a value to memory and to device storage.
 *
 * @param key - The logical cache key.
 * @param value - The value to store.
 */
export async function writeCache<T>(key: string, value: T): Promise<void> {
  const envelope: CacheEnvelope = { storedAt: Date.now(), value };
  memory.set(key, envelope);

  try {
    await AsyncStorage.setItem(storageKey(key), JSON.stringify(envelope));
  } catch {
    // The in-memory copy still serves this session.
  }
}

/**
 * Removes one value from the cache.
 *
 * @param key - The logical cache key.
 */
export async function removeCache(key: string): Promise<void> {
  memory.delete(key);

  try {
    await AsyncStorage.removeItem(storageKey(key));
  } catch {
    // Nothing to do: the entry is already gone from memory.
  }
}

/**
 * Reads through the cache, fetching and storing the value on a miss.
 *
 * Concurrent callers asking for the same key share one request, so a screen
 * and a background task cannot fetch the same proverb twice.
 *
 * @param key - The logical cache key.
 * @param ttlMs - How long a stored value stays fresh. Use `Infinity` for
 *               data that never changes.
 * @param fetcher - Produces the value on a miss.
 * @returns The cached or freshly fetched value.
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await readCache<T>(key, ttlMs);
  if (cached !== undefined) return cached;

  const running = inFlight.get(key) as Promise<T> | undefined;
  if (running) return running;

  const request = (async () => {
    const value = await fetcher();
    await writeCache(key, value);
    return value;
  })();

  inFlight.set(key, request);

  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
}

/**
 * Empties the cache, in memory and on the device.
 *
 * Call it when the cached data may belong to a different reader, such as on
 * sign out.
 */
export async function clearCache(): Promise<void> {
  memory.clear();
  inFlight.clear();

  try {
    const keys = await AsyncStorage.getAllKeys();
    const cachedKeys = keys.filter((key) => key.startsWith(PREFIX));
    if (cachedKeys.length > 0) await AsyncStorage.multiRemove(cachedKeys);
  } catch {
    // A failed sweep leaves stale entries that will expire on their own.
  }
}
