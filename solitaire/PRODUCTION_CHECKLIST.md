# Play Store Launch Checklist

Status of the gameplay/engine work is tracked in commit history. This file
tracks what's left before this app can actually be submitted to Google Play —
mostly things that need *your* accounts, credentials, or creative decisions,
which can't be generated automatically.

## ✅ Done in this pass
- Extracted the app from the zip into real, version-controlled source.
- Fuzz-tested the core engine (rules, invariants, win detection) — no card
  duplication/loss or illegal-move bugs found across hundreds of simulated
  games.
- Closed the "reshuffle when stuck" exploit: it used a biased shuffle and,
  once your score hit 0, became a **free, unlimited** way to dodge a
  genuinely unsolvable deal. Now capped at 3 uses/game with a proper
  Fisher-Yates shuffle.
- Closed a Daily Challenge stat-farming exploit: the daily deck is
  deterministic (same seed for everyone), but nothing stopped replaying it
  after solving it once to pad games-played/win-streak/best-score. The
  toolbar button now locks once today's challenge is completed, and
  `recordGameResult` refuses to double-record a daily result server-side
  logic (defense in depth).
- Fixed a stats bug where **losses were never recorded** — only wins ever
  called `recordGameResult`, so "Win Rate" was hard-coded to display 100%
  and the loss-streak-reset logic was dead code. Abandoning a game (New Game
  / Daily Challenge with moves already made) now correctly records a loss.
- Wired real persistence (`AsyncStorage`, with an in-memory fallback if the
  package isn't installed) for statistics, the selected theme, and the
  "Remove Ads" purchase flag. Previously **all of this reset to zero every
  time the app was closed** — including a paying user's purchase — which
  would have been a guaranteed source of 1-star reviews.
- Removed two dead/unused component files (`Foundation.js`,
  `TableauColumn.js`) that `GameScreen.js` doesn't actually import — it
  inlines that rendering itself for drag-and-drop support. Editing those
  files would silently do nothing, which is a trap for future changes.
- Confirmed the app still bundles cleanly for Android via
  `expo export --platform android` after all changes (684 modules resolve,
  no syntax/import errors).

## ⚠️ Not done — needs your input before this can ship

### App identity & branding
- [ ] Decide the real Android **package name** (currently the placeholder
      `com.yourname.solitaire` in `app.json` — this is permanent once
      published, so pick carefully) and iOS bundle identifier if you'll
      ship there too.
- [ ] App icon (1024×1024), adaptive icon foreground, and splash image —
      `app.json` currently has no `icon`/`splash.image` at all, only a
      background color. Expo/EAS build will fail without these.
- [ ] Decide the public app name / store listing name.

### Build & submission
- [ ] No `eas.json` exists yet — needed to define build profiles
      (`development`/`preview`/`production`) before `eas build` will work.
- [ ] No EAS project ID (`expo.extra.eas.projectId`) — created by running
      `eas init` under your own Expo account.
- [ ] Generate/attach an Android signing keystore (EAS can manage this for
      you).
- [ ] Bump `android.versionCode` for every release; Play Console requires
      it strictly increasing.
- [ ] Verify the RN/Expo SDK version still meets Play Store's **target API
      level** policy at submission time — check the current requirement on
      the Play Console before building, since this shifts periodically.

### Monetization
- [ ] Replace the Google **test** AdMob app ID/unit IDs in `app.json` and
      `src/ads/adConfig.js` with your real ones from the AdMob console.
      Shipping test IDs means you earn nothing (and Google will flag real
      traffic hitting test ad units).
- [ ] `handlePurchase` in `GameScreen.js` is still a fake `setTimeout` that
      grants "Remove Ads" without collecting any payment. This must be
      replaced with real IAP (e.g. `react-native-purchases`/RevenueCat or
      `expo-in-app-purchases`) wired to a real Play Console in-app product,
      or you will be giving the paid feature away for free.

### Legal / store requirements
- [ ] Write and host a **privacy policy** (required by Play Console for any
      app using ads/advertising ID) and add its URL to the store listing.
- [ ] Add a Terms of Service if you want the "By purchasing you agree to
      our Terms of Service" line in `RemoveAdsModal.js` to mean anything.
- [ ] Fill out Play Console's Data Safety section (ads SDK + purchase data).

### Testing
- [ ] This session could bundle the JS and fuzz-test the pure game engine,
      but could not launch an emulator/device — you should manually run
      through every screen (Settings/theme switching, Stats panel, Win
      overlay, Stuck overlay, rewarded-ad prompts, Remove Ads modal, Daily
      Challenge) on a real device or emulator before submitting.
- [ ] Consider adding a `eas.json` internal-testing / Play internal track
      pass before a public release.

### Nice-to-have (not blocking, but worth knowing about)
- In-progress game state isn't persisted — if Android kills the app in the
  background mid-game, the current deal is lost (stats/settings/purchases
  now survive restarts, but the live board doesn't). Worth a follow-up if
  you want players to always resume exactly where they left off.
