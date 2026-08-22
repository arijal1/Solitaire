// ─────────────────────────────────────────────
//  CARD DEFINITIONS & UTILITIES
// ─────────────────────────────────────────────

export const SUITS = ['♠', '♣', '♥', '♦'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_COLOR = {
  '♠': 'black',
  '♣': 'black',
  '♥': 'red',
  '♦': 'red',
};

export const RANK_VALUE = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, K: 13,
};

/**
 * Create a full 52-card deck
 */
export function createDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: id++,
        suit,
        rank,
        color: SUIT_COLOR[suit],
        value: RANK_VALUE[rank],
        faceUp: false,
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Check if a card can be placed on a tableau column
 */
export function canPlaceOnTableau(card, targetPile) {
  if (!card) return false;
  if (targetPile.length === 0) {
    return card.value === 13; // Only Kings on empty
  }
  const topCard = targetPile[targetPile.length - 1];
  if (!topCard.faceUp) return false;
  return (
    card.color !== topCard.color &&
    card.value === topCard.value - 1
  );
}

/**
 * Check if a card can be placed on a foundation
 */
export function canPlaceOnFoundation(card, foundationPile) {
  if (!card) return false;
  if (foundationPile.length === 0) {
    return card.value === 1; // Only Aces start foundations
  }
  const topCard = foundationPile[foundationPile.length - 1];
  return (
    card.suit === topCard.suit &&
    card.value === topCard.value + 1
  );
}

/**
 * Check if a card is red
 */
export function isRed(card) {
  return card.color === 'red';
}
