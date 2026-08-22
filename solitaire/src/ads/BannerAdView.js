// ─────────────────────────────────────────────────────────
//  BannerAd — renders a Google AdMob banner
//  Shown only on the menu/home screen, never during gameplay.
//  Falls back to an invisible placeholder if SDK not installed.
// ─────────────────────────────────────────────────────────

import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AD_UNIT_IDS } from './adConfig';

// Graceful SDK import
let BannerAdComponent   = null;
let BannerAdSize        = null;

try {
  const mobileAds  = require('react-native-google-mobile-ads');
  BannerAdComponent = mobileAds.BannerAd;
  BannerAdSize      = mobileAds.BannerAdSize;
} catch (_) {}

const SDK_AVAILABLE = !!BannerAdComponent;

/**
 * props:
 *   adsRemoved {bool}   — hide banner if user bought "Remove Ads"
 *   style      {object} — optional container style override
 */
const BannerAdView = memo(({ adsRemoved = false, style }) => {
  // Never render if ads removed or SDK missing
  if (adsRemoved || !SDK_AVAILABLE) return null;

  return (
    <View style={[styles.container, style]}>
      <BannerAdComponent
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          keywords: ['game', 'cards', 'solitaire', 'puzzle'],
        }}
        onAdFailedToLoad={(err) => {
          console.log('[Ads] Banner failed:', err?.message);
        }}
      />
    </View>
  );
});

export default BannerAdView;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    // Background matches the menu screen felt color
    backgroundColor: 'transparent',
  },
});
