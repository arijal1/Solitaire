import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Card sizing ───────────────────────────────────────────
// Fit 7 cards + gutters in the screen width
const GUTTER = 3;
const SIDE_PAD = 6;
export const CARD_WIDTH = Math.floor((SCREEN_WIDTH - SIDE_PAD * 2 - GUTTER * 6) / 7);
export const CARD_HEIGHT = Math.floor(CARD_WIDTH * 1.4);
export const CARD_RADIUS = 6;

export const SCREEN_W = SCREEN_WIDTH;
export const SCREEN_H = SCREEN_HEIGHT;

// Overlap offsets
export const FACE_DOWN_OVERLAP = Math.floor(CARD_HEIGHT * 0.2);
export const FACE_UP_OVERLAP   = Math.floor(CARD_HEIGHT * 0.28);

// ── Colors ────────────────────────────────────────────────
export const COLORS = {
  felt:          '#1A5C35',   // Deep casino green
  feltDark:      '#144d2c',
  feltHighlight: '#1f6e3f',
  cardWhite:     '#FAFAF8',
  cardRed:       '#C0392B',
  cardBlack:     '#1C1C28',
  cardBorder:    'rgba(0,0,0,0.18)',
  cardShadow:    'rgba(0,0,0,0.35)',
  cardBack:      '#1A3A8A',
  cardBackAccent:'#2251C5',
  emptySlot:     'rgba(255,255,255,0.08)',
  emptyBorder:   'rgba(255,255,255,0.18)',
  gold:          '#D4AF37',
  goldDark:      '#B8942A',
  hintGlow:      '#F0D060',
  textLight:     '#F0EDE8',
  textMuted:     'rgba(240,237,232,0.6)',
  overlayBg:     'rgba(10,30,15,0.92)',
  buttonBg:      '#2A7A4A',
  buttonPress:   '#1f6040',
  danger:        '#E74C3C',
  white:         '#FFFFFF',
};

// ── Typography ────────────────────────────────────────────
export const FONT = {
  rankSize:      Math.max(10, CARD_WIDTH * 0.28),
  suitSize:      Math.max(8,  CARD_WIDTH * 0.22),
  bigSuitSize:   Math.max(16, CARD_WIDTH * 0.5),
};
