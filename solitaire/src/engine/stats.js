import { createDeck } from './cards';
import { loadJSON, saveJSON } from '../utils/persistence';

// ─────────────────────────────────────────────
//  STATISTICS & PERSISTENCE
//  Backed by AsyncStorage (see ../utils/persistence). The module-level
//  _store is an in-memory mirror hydrated once at startup via
//  hydrateStats() and written back to disk after every mutation.
// ─────────────────────────────────────────────

const STATS_KEY = 'solitaire.stats.v1';

let _store = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalTime: 0,       // seconds
  bestTime: null,     // seconds for fastest win
  bestScore: 0,
  totalMoves: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: null,
  dailyCompleted: {},  // { 'YYYY-MM-DD': { won, score, time, moves } }
};

export function getStats() {
  return { ..._store };
}

/**
 * Hydrate the in-memory store from disk. Call once at app startup
 * (before any game result can be recorded) and await it.
 */
export async function hydrateStats() {
  const saved = await loadJSON(STATS_KEY, null);
  if (saved) _store = { ..._store, ...saved };
  return getStats();
}

export function recordGameStart() {
  // nothing to store at start
}

export function recordGameResult({ won, timeSeconds, score, moves, isDaily, dailyKey }) {
  // Daily Challenge integrity: everyone plays the same seeded deck, so once
  // today's key has a recorded result, further attempts are practice only —
  // they must never be allowed to pad games-played/win-streak/best-score,
  // otherwise a player could solve it once, memorize it, and replay it
  // endlessly to farm stats.
  if (isDaily && dailyKey && isDailyCompleted(dailyKey)) {
    return;
  }

  _store.gamesPlayed += 1;
  _store.totalMoves += moves;

  if (won) {
    _store.gamesWon += 1;
    _store.totalTime += timeSeconds;
    if (_store.bestTime === null || timeSeconds < _store.bestTime) {
      _store.bestTime = timeSeconds;
    }
    if (score > _store.bestScore) _store.bestScore = score;
    _store.currentStreak += 1;
    if (_store.currentStreak > _store.bestStreak) _store.bestStreak = _store.currentStreak;
  } else {
    _store.currentStreak = 0;
  }

  if (isDaily && dailyKey) {
    _store.dailyCompleted[dailyKey] = { won, score, timeSeconds, moves };
  }

  _store.lastPlayedDate = new Date().toISOString().slice(0, 10);
  saveJSON(STATS_KEY, _store);
}

export function getWinRate() {
  if (_store.gamesPlayed === 0) return 0;
  return Math.round((_store.gamesWon / _store.gamesPlayed) * 100);
}

export function getAvgTime() {
  if (_store.gamesWon === 0) return null;
  return Math.round(_store.totalTime / _store.gamesWon);
}

export function getAvgMoves() {
  if (_store.gamesPlayed === 0) return null;
  return Math.round(_store.totalMoves / _store.gamesPlayed);
}

// ─────────────────────────────────────────────
//  DAILY CHALLENGE
// ─────────────────────────────────────────────

/**
 * Get today's date key: 'YYYY-MM-DD'
 */
export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Simple seeded PRNG (mulberry32) — deterministic from a seed integer
 */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Turn a date string 'YYYY-MM-DD' into a numeric seed
 */
function dateSeed(dateKey) {
  return dateKey.split('-').reduce((acc, part) => acc * 1000 + parseInt(part, 10), 0);
}

/**
 * Seeded Fisher-Yates shuffle — same date always produces same deck order
 */
function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get the seeded deck for today's daily challenge
 */
export function getDailyDeck(dateKey) {
  const rng = mulberry32(dateSeed(dateKey));
  return seededShuffle(createDeck(), rng);
}

/**
 * Check if today's daily challenge is already completed
 */
export function isDailyCompleted(dateKey) {
  return !!_store.dailyCompleted[dateKey];
}

export function getDailyResult(dateKey) {
  return _store.dailyCompleted[dateKey] || null;
}
