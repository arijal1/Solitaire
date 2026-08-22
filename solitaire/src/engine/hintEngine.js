import { canPlaceOnTableau, canPlaceOnFoundation } from './cards';

// Local copy of drawFromStock to avoid circular dependency with gameEngine
function _drawFromStock(state) {
  if (state.stock.length === 0) {
    if (state.waste.length === 0) return state;
    return {
      ...state,
      stock: [...state.waste].reverse().map(c => ({ ...c, faceUp: false })),
      waste: [],
    };
  }
  const count  = Math.min(state.drawMode, state.stock.length);
  const drawn  = state.stock.slice(-count).map(c => ({ ...c, faceUp: true }));
  return {
    ...state,
    stock: state.stock.slice(0, state.stock.length - count),
    waste: [...state.waste, ...drawn],
  };
}

// ─────────────────────────────────────────────
//  SMART HINT ENGINE  (v2 — scored, not random)
// ─────────────────────────────────────────────

/**
 * Score a tableau→tableau move.
 * Higher = better move.
 *
 * Factors:
 *  +30  reveals a hidden card
 *  +20  moves to non-empty column (keeps structure tight)
 *  +10  moves a King to an empty column (opens a column)
 *  -5   moves from empty column to empty column (pointless)
 *  +2   the card being exposed has a useful value (can accept the next rank)
 */
function scoreTableauMove(state, fromCol, cardIndex, toCol) {
  const srcPile = state.tableau[fromCol];
  const dstPile = state.tableau[toCol];
  const movingCard = srcPile[cardIndex];
  let score = 0;

  const revealsHidden = cardIndex > 0 && !srcPile[cardIndex - 1].faceUp;
  const srcIsEmpty   = cardIndex === 0; // moving entire column
  const dstIsEmpty   = dstPile.length === 0;

  if (revealsHidden) score += 30;
  if (!dstIsEmpty)   score += 20;
  if (dstIsEmpty && movingCard.value === 13) score += 10; // King to empty
  if (srcIsEmpty && dstIsEmpty) score -= 5; // shuffling empties

  // Bonus: the card that gets revealed can be useful
  if (revealsHidden && cardIndex > 0) {
    const revealed = srcPile[cardIndex - 1];
    // If revealed card's value - 1 exists anywhere face-up → useful
    if (revealed && revealed.value > 1) score += 3;
  }

  return score;
}

/**
 * Full smart hint: returns the single best move, with a `description` string.
 */
export function getSmartHint(state) {
  const candidates = [];

  // ── 1. Tableau → Foundation ───────────────────────────────
  for (let col = 0; col < 7; col++) {
    const pile = state.tableau[col];
    if (!pile.length) continue;
    const card = pile[pile.length - 1];
    if (!card.faceUp) continue;
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(card, state.foundations[fi])) {
        candidates.push({
          score: 100,
          type: 'tableau-to-foundation',
          fromCol: col,
          foundIndex: fi,
          card,
          description: `Move ${card.rank}${card.suit} to foundation`,
        });
      }
    }
  }

  // ── 2. Waste → Foundation ─────────────────────────────────
  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(card, state.foundations[fi])) {
        candidates.push({
          score: 95,
          type: 'waste-to-foundation',
          foundIndex: fi,
          card,
          description: `Move ${card.rank}${card.suit} from waste to foundation`,
        });
      }
    }
  }

  // ── 3. Tableau → Tableau (scored) ────────────────────────
  for (let fromCol = 0; fromCol < 7; fromCol++) {
    const srcPile = state.tableau[fromCol];
    const firstFaceUp = srcPile.findIndex(c => c.faceUp);
    if (firstFaceUp === -1) continue;

    for (let toCol = 0; toCol < 7; toCol++) {
      if (toCol === fromCol) continue;
      const movingCard = srcPile[firstFaceUp];
      if (!canPlaceOnTableau(movingCard, state.tableau[toCol])) continue;

      const moveScore = 50 + scoreTableauMove(state, fromCol, firstFaceUp, toCol);
      candidates.push({
        score: moveScore,
        type: 'tableau-to-tableau',
        fromCol,
        toCol,
        cardIndex: firstFaceUp,
        card: movingCard,
        description: `Move ${movingCard.rank}${movingCard.suit} stack to column ${toCol + 1}`,
      });
    }
  }

  // ── 4. Waste → Tableau ───────────────────────────────────
  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    for (let toCol = 0; toCol < 7; toCol++) {
      if (canPlaceOnTableau(card, state.tableau[toCol])) {
        const dstEmpty = state.tableau[toCol].length === 0;
        candidates.push({
          score: dstEmpty ? 30 : 40,
          type: 'waste-to-tableau',
          toCol,
          card,
          description: `Move ${card.rank}${card.suit} from waste to column ${toCol + 1}`,
        });
      }
    }
  }

  // ── 5. Draw ───────────────────────────────────────────────
  if (state.stock.length > 0 || state.waste.length > 0) {
    candidates.push({
      score: 10,
      type: 'draw',
      card: null,
      description: state.stock.length > 0 ? 'Draw from stock' : 'Reset stock',
    });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// ─────────────────────────────────────────────
//  STUCK DETECTION
// ─────────────────────────────────────────────

/**
 * Enumerate ALL legal moves available right now.
 * Returns an array; length === 0 means truly stuck.
 */
function getAllLegalMoves(state) {
  const moves = [];

  // Stock / waste cycling always counts as a move (but not if both empty)
  if (state.stock.length > 0 || state.waste.length > 0) {
    moves.push({ type: 'draw' });
  }

  // Waste top → foundation or tableau
  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(card, state.foundations[fi])) moves.push({ type: 'wf', fi });
    }
    for (let col = 0; col < 7; col++) {
      if (canPlaceOnTableau(card, state.tableau[col])) moves.push({ type: 'wt', col });
    }
  }

  // Tableau cards → foundation or another column
  for (let fromCol = 0; fromCol < 7; fromCol++) {
    const pile = state.tableau[fromCol];
    const firstFaceUp = pile.findIndex(c => c.faceUp);
    if (firstFaceUp === -1) continue;

    const topCard = pile[pile.length - 1];
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(topCard, state.foundations[fi])) moves.push({ type: 'tf', fromCol, fi });
    }

    for (let toCol = 0; toCol < 7; toCol++) {
      if (toCol === fromCol) continue;
      if (canPlaceOnTableau(pile[firstFaceUp], state.tableau[toCol])) {
        moves.push({ type: 'tt', fromCol, toCol });
      }
    }
  }

  return moves;
}

/**
 * Check if the game is stuck (no useful progress possible).
 *
 * "Stuck" = no legal moves exist that aren't just stock cycling,
 * AND there are still hidden cards with stock empty.
 *
 * Returns: 'ok' | 'stuck' | 'no-moves'
 *  - 'ok'       → moves available
 *  - 'stuck'    → only draw available but stock is exhausted
 *  - 'no-moves' → absolutely no moves
 */
export function detectStuck(state) {
  if (state.isWon) return 'ok';

  const moves = getAllLegalMoves(state);
  const nonDrawMoves = moves.filter(m => m.type !== 'draw');

  if (nonDrawMoves.length > 0) return 'ok';
  if (moves.length === 0) return 'no-moves';

  // Only draw remains — check if stock is truly exhausted
  if (state.stock.length === 0 && state.waste.length <= 1) {
    return 'stuck';
  }

  return 'ok'; // Can still draw
}

/**
 * Deeper stuck check: simulate drawing through the whole stock
 * and see if anything useful appears. Returns true if genuinely stuck.
 */
export function isGenuinelyStuck(state) {
  const initial = detectStuck(state);
  if (initial === 'ok') return false;
  if (initial === 'no-moves') return true;

  // Simulate flipping through stock until we cycle back
  let sim = { ...state };
  const maxCycles = (state.stock.length + state.waste.length) + 2;

  for (let i = 0; i < maxCycles; i++) {
    sim = _drawFromStock(sim);
    const nonDraw = getAllLegalMoves(sim).filter(m => m.type !== 'draw');
    if (nonDraw.length > 0) return false; // found a useful move
    // Detect if we've cycled the whole waste back
    if (sim.waste.length === 0 && sim.stock.length === state.stock.length + state.waste.length) break;
  }

  return true;
}
