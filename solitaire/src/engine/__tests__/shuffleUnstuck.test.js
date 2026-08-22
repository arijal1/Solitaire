// Regression test for the "reshuffle when stuck" exploit: it used to use a
// biased Array#sort shuffle and, once score hit 0, the -20 penalty became a
// no-op — making it a free, unlimited way to dodge a genuinely unsolvable
// deal. shuffleUnstuck is now a capped, pure, directly-testable function.
import { dealGame, shuffleUnstuck, MAX_SHUFFLES_PER_GAME } from '../gameEngine';

function forceStuckState(drawMode = 1) {
  // Doesn't need to be a *real* stuck position — shuffleUnstuck only cares
  // about shuffleCount and the cards currently in play.
  return dealGame(drawMode);
}

test('shuffleUnstuck deducts score, tracks usage, and preserves all 52 cards', () => {
  let state = forceStuckState();
  const startingScore = state.score;

  state = shuffleUnstuck(state);
  expect(state.shuffleCount).toBe(1);
  expect(state.score).toBe(Math.max(0, startingScore - 20));

  const total = state.tableau.reduce((a, c) => a + c.length, 0)
    + state.stock.length + state.waste.length
    + state.foundations.reduce((a, f) => a + f.length, 0);
  expect(total).toBe(52);
});

test('shuffleUnstuck is capped at MAX_SHUFFLES_PER_GAME even at 0 score', () => {
  let state = forceStuckState();
  state = { ...state, score: 0 }; // simulate a broke player

  for (let i = 0; i < MAX_SHUFFLES_PER_GAME; i++) {
    state = shuffleUnstuck(state);
  }
  expect(state.shuffleCount).toBe(MAX_SHUFFLES_PER_GAME);

  // One more attempt beyond the cap must be a true no-op (same reference),
  // i.e. NOT a free extra reshuffle now that score is already floored at 0.
  const beyondCap = shuffleUnstuck(state);
  expect(beyondCap).toBe(state);
  expect(beyondCap.shuffleCount).toBe(MAX_SHUFFLES_PER_GAME);
});
