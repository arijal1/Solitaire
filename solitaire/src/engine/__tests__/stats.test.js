// Regression tests for the two stat-integrity exploits found during audit:
//  1) replaying the deterministic Daily Challenge deck to farm stats, and
//  2) losses never being recorded, which made "Win Rate" always show 100%.
import { recordGameResult, getStats, isDailyCompleted, getDailyResult } from '../stats';

const KEY = '2026-08-22';

describe('daily challenge integrity', () => {
  test('first completion is recorded and locks the day', () => {
    recordGameResult({ won: true, timeSeconds: 120, score: 500, moves: 80, isDaily: true, dailyKey: KEY });
    const s = getStats();
    expect(s.gamesPlayed).toBe(1);
    expect(s.gamesWon).toBe(1);
    expect(s.currentStreak).toBe(1);
    expect(isDailyCompleted(KEY)).toBe(true);
    expect(getDailyResult(KEY).score).toBe(500);
  });

  test('replaying the same daily deck cannot farm stats or overwrite the result', () => {
    recordGameResult({ won: true, timeSeconds: 10, score: 9999, moves: 5, isDaily: true, dailyKey: KEY });
    const s = getStats();
    expect(s.gamesPlayed).toBe(1); // unchanged
    expect(s.gamesWon).toBe(1);    // unchanged
    expect(getDailyResult(KEY).score).toBe(500); // original result preserved
  });
});

describe('win/loss recording reflects reality', () => {
  test('a loss increments gamesPlayed and resets the streak', () => {
    const before = getStats();
    recordGameResult({ won: false, timeSeconds: 30, score: 40, moves: 12, isDaily: false, dailyKey: null });
    const after = getStats();
    expect(after.gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(after.gamesWon).toBe(before.gamesWon); // unchanged
    expect(after.currentStreak).toBe(0);
  });

  test('a subsequent normal win is recorded and rebuilds the streak', () => {
    const before = getStats();
    recordGameResult({ won: true, timeSeconds: 90, score: 300, moves: 60, isDaily: false, dailyKey: null });
    const after = getStats();
    expect(after.gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(after.gamesWon).toBe(before.gamesWon + 1);
    expect(after.currentStreak).toBe(1);
  });
});
