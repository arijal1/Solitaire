// ─────────────────────────────────────────────────────────
//  AD CONFIGURATION
//  Replace TEST IDs with real ones from AdMob console
//  before publishing to store.
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native';

// ── Ad Unit IDs ───────────────────────────────────────────
// Google's official test IDs — safe to use during development.
// They cycle through real ad formats without affecting real metrics.
const TEST_IDS = {
  banner:        Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/2934735716'
    : 'ca-app-pub-3940256099942544/6300978111',
  interstitial:  Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/4411468910'
    : 'ca-app-pub-3940256099942544/1033173712',
  rewarded:      Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/1712485313'
    : 'ca-app-pub-3940256099942544/5224354917',
};

// ── Production IDs (fill in after AdMob approval) ─────────
const PROD_IDS = {
  banner:       'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  rewarded:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};

// Switch to prod IDs by setting __DEV__ = false in release builds
export const AD_UNIT_IDS = __DEV__ ? TEST_IDS : PROD_IDS;

// ── Ad Frequency ─────────────────────────────────────────
export const AD_CONFIG = {
  // Show interstitial every N completed games (randomly between min/max)
  interstitialMinGames: 2,
  interstitialMaxGames: 3,

  // How many rewarded hints/undos a user can earn per session
  maxRewardedHintsPerSession:  5,
  maxRewardedUndosPerSession:  5,

  // Rewarded grant amounts
  rewardedHintBonus: 3,   // number of extra hints granted
  rewardedUndoBonus: 5,   // number of extra undos granted
};
