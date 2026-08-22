// ─────────────────────────────────────────────────────────
//  THEME DEFINITIONS
//  Each theme is a complete token set. Components only ever
//  reference theme tokens — never hard-coded colours.
// ─────────────────────────────────────────────────────────

export const THEME_IDS = {
  CLASSIC: 'classic',
  DARK:    'dark',
  WOOD:    'wood',
};

// ── Helper ────────────────────────────────────────────────
const rgba = (hex, a) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// ─────────────────────────────────────────────────────────
//  1. CLASSIC GREEN  — traditional casino felt
// ─────────────────────────────────────────────────────────
const classic = {
  id:   THEME_IDS.CLASSIC,
  name: 'Classic Green',
  icon: '🃏',
  preview: ['#1A5C35', '#D4AF37', '#1A3A8A'],

  // Table surface
  felt:          '#1A5C35',
  feltDark:      '#144d2c',
  feltHighlight: '#1f6e3f',

  // Card faces
  cardFace:      '#FAFAF8',
  cardRed:       '#C0392B',
  cardBlack:     '#1C1C28',
  cardBorder:    'rgba(0,0,0,0.15)',
  cardShadow:    'rgba(0,0,0,0.32)',

  // Card backs
  cardBack:      '#1A3A8A',
  cardBackAccent:'#2251C5',
  cardBackInner: '#1030A0',

  // Empty slot
  emptySlot:     'rgba(0,0,0,0.18)',
  emptyBorder:   'rgba(255,255,255,0.2)',

  // Accent / gold
  gold:          '#D4AF37',
  goldDark:      '#B8942A',
  goldLight:     '#F0D060',
  hintGlow:      '#F0D060',

  // Text
  textPrimary:   '#F0EDE8',
  textSecondary: 'rgba(240,237,232,0.58)',
  textOnGold:    '#0D2E18',

  // UI chrome
  toolbarBg:     '#0E3E22',
  toolbarBorder: 'rgba(255,255,255,0.06)',
  buttonBg:      '#2A7A4A',
  overlayBg:     'rgba(8,28,14,0.94)',
  panelBg:       '#0E3A20',
  panelBorder:   'rgba(255,255,255,0.08)',
  rowDivider:    'rgba(255,255,255,0.05)',
  danger:        '#E74C3C',

  // Status bar
  statusBar:     'light-content',
};

// ─────────────────────────────────────────────────────────
//  2. DARK MODE  — obsidian & champagne gold
// ─────────────────────────────────────────────────────────
const dark = {
  id:   THEME_IDS.DARK,
  name: 'Dark Mode',
  icon: '✦',
  preview: ['#0A0A12', '#D4AF37', '#1A1830'],

  felt:          '#0A0A12',
  feltDark:      '#06060D',
  feltHighlight: '#12122A',

  cardFace:      '#F5F5F0',
  cardRed:       '#D63031',
  cardBlack:     '#1A1A28',
  cardBorder:    'rgba(255,255,255,0.08)',
  cardShadow:    'rgba(0,0,0,0.55)',

  cardBack:      '#1A1830',
  cardBackAccent:'#D4AF37',
  cardBackInner: '#141228',

  emptySlot:     'rgba(255,255,255,0.04)',
  emptyBorder:   'rgba(212,175,55,0.22)',

  gold:          '#D4AF37',
  goldDark:      '#B8942A',
  goldLight:     '#EED060',
  hintGlow:      '#EED060',

  textPrimary:   '#EAE8E0',
  textSecondary: 'rgba(234,232,224,0.52)',
  textOnGold:    '#0A0A12',

  toolbarBg:     '#050508',
  toolbarBorder: 'rgba(212,175,55,0.1)',
  buttonBg:      '#1A1830',
  overlayBg:     'rgba(2,2,8,0.96)',
  panelBg:       '#0D0D1C',
  panelBorder:   'rgba(212,175,55,0.12)',
  rowDivider:    'rgba(255,255,255,0.04)',
  danger:        '#E74C3C',

  statusBar:     'light-content',
};

// ─────────────────────────────────────────────────────────
//  3. WOODEN TABLE  — rich walnut & antique gold
// ─────────────────────────────────────────────────────────
const wood = {
  id:   THEME_IDS.WOOD,
  name: 'Wooden Table',
  icon: '🪵',
  preview: ['#5C3317', '#CD853F', '#8B4513'],

  felt:          '#5C3317',
  feltDark:      '#3D2010',
  feltHighlight: '#704020',

  cardFace:      '#FFFDF5',
  cardRed:       '#B03020',
  cardBlack:     '#1C1410',
  cardBorder:    'rgba(92,51,23,0.18)',
  cardShadow:    'rgba(50,25,5,0.4)',

  cardBack:      '#6B2D0F',
  cardBackAccent:'#CD853F',
  cardBackInner: '#7B3010',

  emptySlot:     'rgba(0,0,0,0.2)',
  emptyBorder:   'rgba(205,133,63,0.28)',

  gold:          '#CD853F',
  goldDark:      '#A0622A',
  goldLight:     '#E8A85A',
  hintGlow:      '#E8A85A',

  textPrimary:   '#FAF0DC',
  textSecondary: 'rgba(250,240,220,0.58)',
  textOnGold:    '#2A1005',

  toolbarBg:     '#2A1005',
  toolbarBorder: 'rgba(205,133,63,0.15)',
  buttonBg:      '#6B3A18',
  overlayBg:     'rgba(20,8,2,0.94)',
  panelBg:       '#2E1408',
  panelBorder:   'rgba(205,133,63,0.15)',
  rowDivider:    'rgba(250,240,220,0.06)',
  danger:        '#C0392B',

  statusBar:     'light-content',
};

export const THEMES = {
  [THEME_IDS.CLASSIC]: classic,
  [THEME_IDS.DARK]:    dark,
  [THEME_IDS.WOOD]:    wood,
};

export const THEME_LIST = [classic, dark, wood];
export const DEFAULT_THEME_ID = THEME_IDS.CLASSIC;
