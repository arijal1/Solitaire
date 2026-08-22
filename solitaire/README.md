# ♠ Klondike Solitaire v5 — React Native

Casino-quality Klondike Solitaire with a full theme system, AdMob integration, smart AI hints, daily challenges, and statistics.

---

## What's New in v5 — Theme System

| Feature | Detail |
|---|---|
| **3 Themes** | Classic Green, Dark Mode (obsidian + gold), Wooden Table (walnut) |
| **Smooth crossfade** | 180ms fade-out + 260ms spring fade-in on every theme switch |
| **Theme persistence** | Selected theme saved in memory (swap for AsyncStorage for cross-session) |
| **33 design tokens** | Every colour in every component driven by the active theme |
| **Zero stale colours** | No hardcoded hex values in themed components — validated at build |
| **Settings panel** | Slide-up modal with animated mini-table previews for each theme |
| **⚙ Toolbar button** | Opens Settings directly from gameplay without leaving the game |

---

## Quick Start

```bash
cd solitaire
npm install
npx expo start          # scan QR with Expo Go
# npx expo start --android  for emulator
```

---

## Project Structure

```
solitaire/
├── App.js                              ThemeProvider + ThemedRoot + GameScreen
├── app.json                            Expo config + AdMob plugin
├── package.json
└── src/
    ├── theme/
    │   ├── themes.js                   3 theme objects (33 tokens each)
    │   ├── ThemeContext.js             React context, useTheme(), crossfade animation
    │   └── ThemedRoot.js              Animated.View wrapper (fade + scale transition)
    ├── ads/
    │   ├── adConfig.js                Test/prod unit IDs, frequency settings
    │   ├── useAdManager.js            Interstitial cadence, rewarded grants
    │   ├── BannerAdView.js            Banner (menu-only, never during gameplay)
    │   ├── RewardedAdModal.js         "Watch ad → hints/undos" UX prompt
    │   └── RemoveAdsModal.js          Premium upsell ($1.99 one-time)
    ├── engine/
    │   ├── cards.js                   Pure card definitions + placement rules
    │   ├── gameEngine.js              Immutable state reducers + daily deal
    │   ├── hintEngine.js              Scored hint AI + stuck detector
    │   └── stats.js                   In-memory stats + seeded daily deck
    ├── hooks/
    │   └── useGameState.js            All game state, undo, auto-complete, daily
    ├── components/
    │   ├── GameScreen.js              Main layout + drag/drop + all modal wiring
    │   ├── CardFace.js                Theme-aware card face + back rendering
    │   ├── Toolbar.js                 Dynamic makeStyles(theme) factory
    │   ├── StockWaste.js              Stock pile + draw-1/3 waste fan
    │   ├── Foundation.js              4 foundation piles
    │   ├── StuckOverlay.js            Bottom sheet: shuffle/undo/new-game
    │   ├── WinOverlay.js              Confetti + stats + remove-ads upsell
    │   ├── StatsPanel.js              Slide-up statistics modal
    │   └── SettingsPanel.js           Theme picker + about
    └── utils/
        └── constants.js               Card sizing + typography (no colours)
```

---

## Theme System Architecture

### Token flow
```
themes.js (3 objects, 33 tokens each)
    ↓
ThemeContext.js (React Context + animated transition)
    ↓
useTheme() hook consumed in every component
    ↓
makeStyles(theme) or inline styles — never hardcoded hex
```

### The 33 theme tokens

| Category | Tokens |
|---|---|
| Table surface | `felt`, `feltDark`, `feltHighlight` |
| Card faces | `cardFace`, `cardRed`, `cardBlack`, `cardBorder`, `cardShadow` |
| Card backs | `cardBack`, `cardBackAccent`, `cardBackInner` |
| Empty slots | `emptySlot`, `emptyBorder` |
| Accent / gold | `gold`, `goldDark`, `goldLight`, `hintGlow` |
| Text | `textPrimary`, `textSecondary`, `textOnGold` |
| UI chrome | `toolbarBg`, `toolbarBorder`, `buttonBg`, `overlayBg`, `panelBg`, `panelBorder`, `rowDivider`, `danger` |
| System | `statusBar` |

### Crossfade transition
`ThemeContext.setTheme(id)` triggers:
1. `Animated.timing(fadeAnim → 0)` + `Animated.timing(scaleAnim → 0.97)` — 180ms
2. React state update: `setThemeId(newId)` — all consumers re-render instantly
3. `Animated.timing(fadeAnim → 1)` + `Animated.spring(scaleAnim → 1)` — 260ms spring

`ThemedRoot` wraps the entire tree in a single `Animated.View` — only one animation node regardless of component count.

### Adding a new theme
```js
// In src/theme/themes.js:
const myTheme = {
  id: 'mytheme', name: 'My Theme', icon: '🌙',
  preview: ['#bg', '#accent', '#cardback'],
  felt: '...',
  // ... all 33 tokens
};
export const THEMES = { classic, dark, wood, mytheme: myTheme };
export const THEME_LIST = [classic, dark, wood, myTheme];
```
The settings panel and context pick it up automatically.

---

## Real Persistence (cross-session)

Replace the in-memory store in `ThemeContext.js`:

```js
import AsyncStorage from '@react-native-async-storage/async-storage';

// On load:
const saved = await AsyncStorage.getItem('themeId');
setThemeId(saved ?? DEFAULT_THEME_ID);

// On change:
AsyncStorage.setItem('themeId', newId);
```

Install: `npx expo install @react-native-async-storage/async-storage`

---

## AdMob Setup

```bash
npm install react-native-google-mobile-ads
npx expo prebuild
npx expo run:android
```

Replace test App IDs in `app.json` and unit IDs in `src/ads/adConfig.js` before publishing.

---

## Build for Production

```bash
npm install -g eas-cli
eas login && eas build:configure
eas build --platform android --profile preview
```
