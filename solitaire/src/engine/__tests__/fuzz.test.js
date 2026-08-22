// Fuzz-tests the engine with uniformly-random legal moves, mirroring how a
// real (if undirected) player would interact with it, and asserts the core
// invariants hold after every single move:
//   - every tableau face-up run stays a legal alternating/descending sequence
//   - no card is ever duplicated or lost (always exactly 52 in play)
//   - foundations always build strictly A→K
// This is the harness used while auditing the engine for exploits; kept as a
// permanent regression test rather than a throwaway script.
import {
  dealGame, drawFromStock, moveWasteToTableau, moveWasteToFoundation,
  moveTableauToTableau, moveTableauToFoundation, autoCompleteStep, canAutoComplete,
} from '../gameEngine';
import { canPlaceOnTableau, canPlaceOnFoundation } from '../cards';
import { detectStuck, isGenuinelyStuck } from '../hintEngine';

// Returns a list of human-readable violation strings (empty = all invariants
// hold). Deliberately avoids calling expect() per-check: with thousands of
// steps per game, per-check assertions made this suite take minutes in Jest
// (vs. seconds for the equivalent plain-Node fuzz script) purely from
// expect() bookkeeping overhead — collecting violations and asserting once
// per game keeps the same coverage at a fraction of the cost.
function findInvariantViolations(state) {
  const violations = [];
  for (let c = 0; c < 7; c++) {
    const pile = state.tableau[c];
    let seenFaceUp = false;
    for (let i = 0; i < pile.length; i++) {
      const card = pile[i];
      if (card.faceUp) seenFaceUp = true;
      else if (seenFaceUp) violations.push(`col ${c}: face-down card after a face-up card`);
      if (card.faceUp && i > 0 && pile[i - 1].faceUp) {
        const prev = pile[i - 1];
        if (!(card.color !== prev.color && card.value === prev.value - 1)) {
          violations.push(`col ${c} idx ${i}: broken run ${prev.rank}${prev.suit} -> ${card.rank}${card.suit}`);
        }
      }
    }
  }

  const total = state.tableau.reduce((a, c) => a + c.length, 0)
    + state.stock.length + state.waste.length
    + state.foundations.reduce((a, f) => a + f.length, 0);
  if (total !== 52) violations.push(`total cards ${total} !== 52`);

  const ids = new Set();
  for (const c of [...state.tableau.flat(), ...state.stock, ...state.waste, ...state.foundations.flat()]) {
    if (ids.has(c.id)) violations.push(`duplicate card id ${c.id}`);
    ids.add(c.id);
  }

  for (let fi = 0; fi < 4; fi++) {
    const f = state.foundations[fi];
    for (let i = 0; i < f.length; i++) {
      if (f[i].value !== i + 1) violations.push(`foundation ${fi} idx ${i}: expected value ${i + 1}, got ${f[i].value}`);
    }
  }
  return violations;
}

function enumerateMoves(state) {
  const moves = [];
  if (state.stock.length > 0 || state.waste.length > 0) moves.push({ type: 'draw' });
  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    for (let fi = 0; fi < 4; fi++) if (canPlaceOnFoundation(card, state.foundations[fi])) moves.push({ type: 'wf', fi });
    for (let c = 0; c < 7; c++) if (canPlaceOnTableau(card, state.tableau[c])) moves.push({ type: 'wt', c });
  }
  for (let from = 0; from < 7; from++) {
    const pile = state.tableau[from];
    if (!pile.length) continue;
    const top = pile[pile.length - 1];
    if (top.faceUp) for (let fi = 0; fi < 4; fi++) if (canPlaceOnFoundation(top, state.foundations[fi])) moves.push({ type: 'tf', from, fi });
    const firstFaceUp = pile.findIndex(c => c.faceUp);
    if (firstFaceUp === -1) continue;
    for (let to = 0; to < 7; to++) {
      if (to === from) continue;
      if (canPlaceOnTableau(pile[firstFaceUp], state.tableau[to])) moves.push({ type: 'tt', from, idx: firstFaceUp, to });
    }
  }
  return moves;
}

function applyMove(state, m) {
  switch (m.type) {
    case 'draw': return drawFromStock(state);
    case 'wf':   return moveWasteToFoundation(state, m.fi);
    case 'wt':   return moveWasteToTableau(state, m.c);
    case 'tf':   return moveTableauToFoundation(state, m.from, m.fi);
    case 'tt':   return moveTableauToTableau(state, m.from, m.idx, m.to);
    default:     throw new Error(`unknown move type ${m.type}`);
  }
}

// Fuzz one game and return every violation found across every step (each
// tagged with the step number), plus a flag for illegal moves the engine
// silently rejected even though they were enumerated as legal.
function fuzz(drawMode, maxSteps) {
  const violations = [];
  let state = dealGame(drawMode);
  violations.push(...findInvariantViolations(state).map(v => `deal: ${v}`));

  let steps = 0;
  while (!state.isWon && steps < maxSteps) {
    if (canAutoComplete(state)) {
      const n = autoCompleteStep(state);
      if (n && n !== state) {
        state = n;
        violations.push(...findInvariantViolations(state).map(v => `step ${steps} (auto): ${v}`));
        continue;
      }
    }
    const moves = enumerateMoves(state);
    if (moves.length === 0) break;
    if (detectStuck(state) !== 'ok' && isGenuinelyStuck(state)) break;

    const m = moves[Math.floor(Math.random() * moves.length)];
    const next = applyMove(state, m);
    if (next === state) violations.push(`step ${steps}: enumerated move rejected as illegal — ${JSON.stringify(m)}`);
    state = next;
    steps++;
    violations.push(...findInvariantViolations(state).map(v => `step ${steps}: ${v}`));
  }
  return violations;
}

describe('engine invariants under randomized play', () => {
  test.each([1, 3])('draw-%i mode never violates core rules over many games', (drawMode) => {
    const allViolations = [];
    for (let i = 0; i < 8; i++) {
      allViolations.push(...fuzz(drawMode, 500).map(v => `game ${i} ${v}`));
    }
    expect(allViolations).toEqual([]);
  });
});
