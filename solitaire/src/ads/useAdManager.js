// ─────────────────────────────────────────────────────────
//  useAdManager — central hook for all AdMob ad types
//
//  Architecture:
//   • Ads are PRE-LOADED after each show so the next one is
//     ready instantly (no loading spinner during gameplay).
//   • All ad operations are no-ops when ads are removed.
//   • Falls back gracefully if the SDK isn't installed.
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { AD_UNIT_IDS, AD_CONFIG } from './adConfig';

// ── SDK import (graceful fallback if not installed) ───────
let AdMobInterstitial = null;
let AdMobRewarded     = null;
let AdsConsent        = null;
let AdEventType       = null;
let RewardedAdEventType = null;

try {
  const mobileAds = require('react-native-google-mobile-ads');
  AdMobInterstitial   = mobileAds.InterstitialAd;
  AdMobRewarded       = mobileAds.RewardedAd;
  AdsConsent          = mobileAds.AdsConsent;
  AdEventType         = mobileAds.AdEventType;
  RewardedAdEventType = mobileAds.RewardedAdEventType;

  // Initialize the SDK once
  mobileAds.default().initialize();
} catch (_) {
  // SDK not installed — all ads will be skipped silently
  console.log('[Ads] react-native-google-mobile-ads not installed — running in no-ad mode');
}

const SDK_AVAILABLE = !!AdMobInterstitial;

// ─────────────────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────────────────
export function useAdManager({ adsRemoved = false } = {}) {
  const showAds = SDK_AVAILABLE && !adsRemoved;

  // ── Interstitial state ────────────────────────────────
  const interstitialRef       = useRef(null);
  const [interstitialReady, setInterstitialReady]   = useState(false);
  const interstitialListeners = useRef([]);

  // ── Rewarded state ─────────────────────────────────────
  const rewardedRef         = useRef(null);
  const [rewardedReady, setRewardedReady]       = useState(false);
  const rewardedListeners   = useRef([]);

  // ── Session reward counters ────────────────────────────
  const [rewardedHintsEarned, setRewardedHintsEarned]   = useState(0);
  const [rewardedUndosEarned, setRewardedUndosEarned]   = useState(0);
  const [bonusHints, setBonusHints]   = useState(0);
  const [bonusUndos, setBonusUndos]   = useState(0);

  // ── Game counter for interstitial cadence ──────────────
  const gamesCompletedRef = useRef(0);
  const nextInterstitialAt = useRef(_nextThreshold());

  function _nextThreshold() {
    const { interstitialMinGames, interstitialMaxGames } = AD_CONFIG;
    return Math.floor(
      Math.random() * (interstitialMaxGames - interstitialMinGames + 1)
    ) + interstitialMinGames;
  }

  // ─────────────────────────────────────────────────────
  //  INTERSTITIAL SETUP
  // ─────────────────────────────────────────────────────
  const loadInterstitial = useCallback(() => {
    if (!showAds) return;

    // Remove old listeners
    interstitialListeners.current.forEach(unsub => unsub?.());
    interstitialListeners.current = [];

    const ad = AdMobInterstitial.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['game', 'cards', 'solitaire', 'puzzle'],
    });

    interstitialListeners.current.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        setInterstitialReady(true);
      }),
      ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.log('[Ads] Interstitial load error:', err?.message);
        setInterstitialReady(false);
        // Retry after delay
        setTimeout(loadInterstitial, 30_000);
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setInterstitialReady(false);
        // Pre-load next one
        setTimeout(loadInterstitial, 1000);
      }),
    );

    interstitialRef.current = ad;
    ad.load();
  }, [showAds]);

  // ─────────────────────────────────────────────────────
  //  REWARDED SETUP
  // ─────────────────────────────────────────────────────
  const loadRewarded = useCallback(() => {
    if (!showAds) return;

    rewardedListeners.current.forEach(unsub => unsub?.());
    rewardedListeners.current = [];

    const ad = AdMobRewarded.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['game', 'cards', 'solitaire', 'puzzle'],
    });

    rewardedListeners.current.push(
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setRewardedReady(true);
      }),
      ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.log('[Ads] Rewarded load error:', err?.message);
        setRewardedReady(false);
        setTimeout(loadRewarded, 30_000);
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setRewardedReady(false);
        setTimeout(loadRewarded, 1000);
      }),
    );

    rewardedRef.current = ad;
    ad.load();
  }, [showAds]);

  // ── Initialize on mount ────────────────────────────────
  useEffect(() => {
    if (!showAds) return;
    loadInterstitial();
    loadRewarded();

    return () => {
      interstitialListeners.current.forEach(unsub => unsub?.());
      rewardedListeners.current.forEach(unsub => unsub?.());
    };
  }, [showAds, loadInterstitial, loadRewarded]);

  // ─────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────

  /**
   * Call when a game completes. Shows interstitial every 2-3 games.
   * Returns promise that resolves when the ad is dismissed (or skipped).
   */
  const onGameComplete = useCallback(() => {
    gamesCompletedRef.current += 1;
    if (gamesCompletedRef.current < nextInterstitialAt.current) return Promise.resolve();
    if (!interstitialReady || !showAds) return Promise.resolve();

    // Reset counter for next cycle
    gamesCompletedRef.current = 0;
    nextInterstitialAt.current = _nextThreshold();

    return new Promise((resolve) => {
      // Listen for close before showing
      const closeSub = interstitialRef.current.addAdEventListener(
        AdEventType.CLOSED,
        () => { closeSub?.(); resolve(); }
      );
      const errSub = interstitialRef.current.addAdEventListener(
        AdEventType.ERROR,
        () => { errSub?.(); resolve(); }
      );
      try {
        interstitialRef.current.show();
      } catch (_) {
        resolve();
      }
    });
  }, [interstitialReady, showAds]);

  /**
   * Show rewarded ad for bonus hints.
   * @param {function} onGranted — called with { type: 'hint', amount }
   */
  const showRewardedForHint = useCallback((onGranted) => {
    if (!showAds) {
      // No-ad mode: grant directly (dev convenience)
      onGranted?.({ type: 'hint', amount: AD_CONFIG.rewardedHintBonus });
      return;
    }
    if (!rewardedReady) {
      console.log('[Ads] Rewarded not ready yet');
      return;
    }
    if (rewardedHintsEarned >= AD_CONFIG.maxRewardedHintsPerSession) {
      console.log('[Ads] Max rewarded hints reached for this session');
      return;
    }

    // Listen for reward event
    const rewardSub = rewardedRef.current.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        rewardSub?.();
        const amount = AD_CONFIG.rewardedHintBonus;
        setRewardedHintsEarned(n => n + 1);
        setBonusHints(n => n + amount);
        onGranted?.({ type: 'hint', amount });
      }
    );

    try {
      rewardedRef.current.show();
    } catch (_) {
      rewardSub?.();
    }
  }, [showAds, rewardedReady, rewardedHintsEarned]);

  /**
   * Show rewarded ad for bonus undos.
   * @param {function} onGranted — called with { type: 'undo', amount }
   */
  const showRewardedForUndo = useCallback((onGranted) => {
    if (!showAds) {
      onGranted?.({ type: 'undo', amount: AD_CONFIG.rewardedUndoBonus });
      return;
    }
    if (!rewardedReady) {
      console.log('[Ads] Rewarded not ready yet');
      return;
    }
    if (rewardedUndosEarned >= AD_CONFIG.maxRewardedUndosPerSession) {
      console.log('[Ads] Max rewarded undos reached for this session');
      return;
    }

    const rewardSub = rewardedRef.current.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        rewardSub?.();
        const amount = AD_CONFIG.rewardedUndoBonus;
        setRewardedUndosEarned(n => n + 1);
        setBonusUndos(n => n + amount);
        onGranted?.({ type: 'undo', amount });
      }
    );

    try {
      rewardedRef.current.show();
    } catch (_) {
      rewardSub?.();
    }
  }, [showAds, rewardedReady, rewardedUndosEarned]);

  return {
    // Status
    interstitialReady,
    rewardedReady,
    sdkAvailable: SDK_AVAILABLE,
    showAds,

    // Reward state
    bonusHints,
    bonusUndos,
    setBonusHints,
    setBonusUndos,
    rewardedHintsEarned,
    rewardedUndosEarned,

    // Actions
    onGameComplete,
    showRewardedForHint,
    showRewardedForUndo,
  };
}
