import {
  createDeck,
  shuffle,
  canPlaceOnTableau,
  canPlaceOnFoundation,
  RANK_VALUE,
  SUIT_COLOR,
} from './cards';

// ─────────────────────────────────────────────
//  INITIAL STATE
// ─────────────────────────────────────────────

/**
 * Solvability heuristic: reject deals where all 4 aces are buried
 * under face-down cards in the deep columns (col 4-6).
 * This dramatically improves playability without a full solver.
 */
function isMostlySolvable(tableau) {
  let acesAccessible = 0;
  for (const col of tableau) {
    for (let i = 0; i < col.length; i++) {
      if (col[i].value === 1) {
        // Ace is accessible if it's face-up (last card or exposed)
        if (col[i].faceUp) acesAccessible++;
      }
    }
  }
  // At least 1 ace should be accessible initially
  return acesAccessible >= 1;
}

/**
 * Deal a new game
 */
export function dealGame(drawMode = 1) {
  let deck, tableau;
  let attempts = 0;

  do {
    deck = shuffle(createDeck());

    // Deal 7 tableau columns
    tableau = Array.from({ length: 7 }, () => []);
    let deckIdx = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = { ...deck[deckIdx++], faceUp: row === col };
        tableau[col].push(card);
      }
    }

    attempts++;
    if (attempts > 50) break; // Safety valve
  } while (!isMostlySolvable(tableau));

  // Remaining cards go to stock (face down)
  const stock = deck.slice(28).map(c => ({ ...c, faceUp: false }));

  return {
    tableau,
    foundations: [[], [], [], []], // One per suit (determined as cards are placed)
    stock,
    waste: [],
    drawMode,
    score: 0,
    moves: 0,
    isWon: false,
    startTime: Date.now(),
    shuffleCount: 0,
  };
}

/**
 * Deal a daily challenge game from a pre-shuffled deck
 */
export function dealDailyGame(deck, drawMode = 1) {
  const tableau = Array.from({ length: 7 }, () => []);
  let deckIdx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIdx++], faceUp: row === col };
      tableau[col].push(card);
    }
  }
  const stock = deck.slice(28).map(c => ({ ...c, faceUp: false }));
  return {
    tableau, foundations: [[], [], [], []], stock, waste: [],
    drawMode, score: 0, moves: 0, isWon: false,
    startTime: Date.now(), isDaily: true, shuffleCount: 0,
  };
}

// ─────────────────────────────────────────────
//  MOVE FUNCTIONS (all return new state)
// ─────────────────────────────────────────────

/**
 * Draw from stock to waste
 */
export function drawFromStock(state) {
  if (state.stock.length === 0) {
    // Recycle waste back to stock
    if (state.waste.length === 0) return state;
    return {
      ...state,
      stock: [...state.waste].reverse().map(c => ({ ...c, faceUp: false })),
      waste: [],
      moves: state.moves + 1,
    };
  }

  const count = Math.min(state.drawMode, state.stock.length);
  const drawn = state.stock.slice(-count).map(c => ({ ...c, faceUp: true }));
  const newStock = state.stock.slice(0, state.stock.length - count);
  const newWaste = [...state.waste, ...drawn];

  return {
    ...state,
    stock: newStock,
    waste: newWaste,
    moves: state.moves + 1,
  };
}

/**
 * Move top waste card to a tableau column
 */
export function moveWasteToTableau(state, colIndex) {
  if (state.waste.length === 0) return state;
  const card = state.waste[state.waste.length - 1];
  const col = state.tableau[colIndex];

  if (!canPlaceOnTableau(card, col)) return state;

  const newTableau = state.tableau.map((c, i) =>
    i === colIndex ? [...c, { ...card, faceUp: true }] : c
  );
  const newWaste = state.waste.slice(0, -1);

  return {
    ...state,
    tableau: newTableau,
    waste: newWaste,
    score: state.score + 5,
    moves: state.moves + 1,
  };
}

/**
 * Move top waste card to a foundation
 */
export function moveWasteToFoundation(state, foundIndex) {
  if (state.waste.length === 0) return state;
  const card = state.waste[state.waste.length - 1];
  const found = state.foundations[foundIndex];

  if (!canPlaceOnFoundation(card, found)) return state;

  const newFoundations = state.foundations.map((f, i) =>
    i === foundIndex ? [...f, card] : f
  );
  const newWaste = state.waste.slice(0, -1);
  const newState = {
    ...state,
    foundations: newFoundations,
    waste: newWaste,
    score: state.score + 10,
    moves: state.moves + 1,
  };
  return { ...newState, isWon: checkWin(newState) };
}

/**
 * Move a stack of cards from one tableau column to another
 * cardIndex = index of first card in the moving stack
 */
export function moveTableauToTableau(state, fromCol, cardIndex, toCol) {
  const srcPile = state.tableau[fromCol];
  const dstPile = state.tableau[toCol];
  const movingCards = srcPile.slice(cardIndex);

  if (!canPlaceOnTableau(movingCards[0], dstPile)) return state;

  const newSrc = srcPile.slice(0, cardIndex);
  // Flip top card of source if face-down
  if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
    newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
  }

  const newTableau = state.tableau.map((col, i) => {
    if (i === fromCol) return newSrc;
    if (i === toCol) return [...col, ...movingCards];
    return col;
  });

  const scoreGain = newSrc.length > 0 && !srcPile[newSrc.length - 1]?.faceUp ? 5 : 3;

  return {
    ...state,
    tableau: newTableau,
    score: state.score + scoreGain,
    moves: state.moves + 1,
  };
}

/**
 * Move top card from tableau to foundation
 */
export function moveTableauToFoundation(state, fromCol, foundIndex) {
  const srcPile = state.tableau[fromCol];
  if (srcPile.length === 0) return state;

  const card = srcPile[srcPile.length - 1];
  if (!card.faceUp) return state;

  const found = state.foundations[foundIndex];
  if (!canPlaceOnFoundation(card, found)) return state;

  const newSrc = srcPile.slice(0, -1);
  if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
    newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
  }

  const newFoundations = state.foundations.map((f, i) =>
    i === foundIndex ? [...f, card] : f
  );
  const newTableau = state.tableau.map((c, i) => (i === fromCol ? newSrc : c));

  const newState = {
    ...state,
    foundations: newFoundations,
    tableau: newTableau,
    score: state.score + 10,
    moves: state.moves + 1,
  };
  return { ...newState, isWon: checkWin(newState) };
}

// ─────────────────────────────────────────────
//  AUTO-MOVE: find best foundation for a card
// ─────────────────────────────────────────────
export function autoMoveToFoundation(state, card) {
  for (let i = 0; i < 4; i++) {
    if (canPlaceOnFoundation(card, state.foundations[i])) {
      return i;
    }
  }
  return -1;
}

// ─────────────────────────────────────────────
//  WIN DETECTION
// ─────────────────────────────────────────────
export function checkWin(state) {
  return state.foundations.every(f => f.length === 13);
}

// ─────────────────────────────────────────────
//  AUTO-COMPLETE CHECK
// ─────────────────────────────────────────────
/**
 * Auto-complete is available when all remaining cards are face-up
 * (stock empty, all tableau cards visible)
 */
export function canAutoComplete(state) {
  if (state.stock.length > 0) return false;
  if (state.waste.length > 0) return false;
  for (const col of state.tableau) {
    for (const card of col) {
      if (!card.faceUp) return false;
    }
  }
  return !state.isWon;
}

/**
 * Perform one step of auto-complete: move lowest-value face-up card to foundation
 */
export function autoCompleteStep(state) {
  // Find the card with the lowest value that can go to a foundation
  const candidates = [];

  for (let col = 0; col < 7; col++) {
    const pile = state.tableau[col];
    if (pile.length === 0) continue;
    const card = pile[pile.length - 1];
    if (!card.faceUp) continue;
    const fi = autoMoveToFoundation(state, card);
    if (fi !== -1) candidates.push({ type: 'tableau', col, fi, card });
  }

  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    const fi = autoMoveToFoundation(state, card);
    if (fi !== -1) candidates.push({ type: 'waste', fi, card });
  }

  if (candidates.length === 0) return null;

  // Move the lowest value first for correct sequencing
  candidates.sort((a, b) => a.card.value - b.card.value);
  const best = candidates[0];

  if (best.type === 'tableau') {
    return moveTableauToFoundation(state, best.col, best.fi);
  } else {
    return moveWasteToFoundation(state, best.fi);
  }
}

// Hint engine lives in hintEngine.js — import directly from there
