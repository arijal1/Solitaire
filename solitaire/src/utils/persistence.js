// ─────────────────────────────────────────────────────────
//  PERSISTENCE — thin AsyncStorage wrapper
//  Falls back to an in-memory Map if the native module isn't
//  installed/linked, so Expo Go / web smoke-testing still works
//  without crashing (same graceful-degradation pattern used by
//  the ads module).
// ─────────────────────────────────────────────────────────

let AsyncStorage = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (_) {
  console.log('[Persistence] AsyncStorage not installed — using in-memory storage (data will not survive app restarts)');
}

const memoryStore = new Map();

export async function loadJSON(key, fallback) {
  try {
    const raw = AsyncStorage ? await AsyncStorage.getItem(key) : (memoryStore.get(key) ?? null);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.log(`[Persistence] Failed to load "${key}":`, err?.message);
    return fallback;
  }
}

export function saveJSON(key, value) {
  const raw = JSON.stringify(value);
  if (AsyncStorage) {
    AsyncStorage.setItem(key, raw).catch(err =>
      console.log(`[Persistence] Failed to save "${key}":`, err?.message)
    );
  } else {
    memoryStore.set(key, raw);
  }
}
