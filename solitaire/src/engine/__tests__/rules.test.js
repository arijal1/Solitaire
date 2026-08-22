import { canPlaceOnTableau, canPlaceOnFoundation } from '../cards';

describe('canPlaceOnTableau', () => {
  const K = { rank: 'K', color: 'black', value: 13, faceUp: true };
  const redQ = { rank: 'Q', color: 'red', value: 12, faceUp: true };
  const blackQ = { rank: 'Q', color: 'black', value: 12, faceUp: true };

  test('alternating color, descending rank is legal', () => {
    expect(canPlaceOnTableau(redQ, [K])).toBe(true);
  });

  test('same color is illegal even if rank is right', () => {
    expect(canPlaceOnTableau(blackQ, [K])).toBe(false);
  });

  test('only a King may go on an empty column', () => {
    expect(canPlaceOnTableau(K, [])).toBe(true);
    expect(canPlaceOnTableau(redQ, [])).toBe(false);
  });

  test('cannot place on a face-down top card', () => {
    expect(canPlaceOnTableau(redQ, [{ ...K, faceUp: false }])).toBe(false);
  });
});

describe('canPlaceOnFoundation', () => {
  const AceS = { suit: '♠', value: 1 };
  const twoS = { suit: '♠', value: 2 };
  const twoH = { suit: '♥', value: 2 };

  test('only an Ace may start a foundation', () => {
    expect(canPlaceOnFoundation(AceS, [])).toBe(true);
    expect(canPlaceOnFoundation(twoS, [])).toBe(false);
  });

  test('must be same suit and exactly one rank higher', () => {
    expect(canPlaceOnFoundation(twoS, [AceS])).toBe(true);
    expect(canPlaceOnFoundation(twoH, [AceS])).toBe(false);
  });
});
