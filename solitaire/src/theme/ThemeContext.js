// ─────────────────────────────────────────────────────────
//  THEME CONTEXT
//  Provides the active theme + switcher to the entire tree.
//  Smooth crossfade animation on every theme change.
// ─────────────────────────────────────────────────────────

import React, {
  createContext, useContext, useState, useRef,
  useCallback, useEffect, useMemo,
} from 'react';
import { Animated } from 'react-native';
import { THEMES, DEFAULT_THEME_ID, THEME_IDS } from './themes';
import { loadJSON, saveJSON } from '../utils/persistence';

const THEME_KEY = 'solitaire.theme.v1';

// ─────────────────────────────────────────────────────────
//  CONTEXT
// ─────────────────────────────────────────────────────────
const ThemeContext = createContext({
  theme:       THEMES[DEFAULT_THEME_ID],
  themeId:     DEFAULT_THEME_ID,
  setTheme:    () => {},
  fadeAnim:    null,
  isChanging:  false,
});

// ─────────────────────────────────────────────────────────
//  PROVIDER
// ─────────────────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [themeId, setThemeId]     = useState(DEFAULT_THEME_ID);
  const [isChanging, setIsChanging] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Hydrate the persisted theme choice once on mount (async — falls back
  // to the default instantly so first paint is never blocked on disk I/O).
  useEffect(() => {
    let cancelled = false;
    loadJSON(THEME_KEY, DEFAULT_THEME_ID).then((saved) => {
      if (!cancelled && saved && THEMES[saved] && saved !== DEFAULT_THEME_ID) {
        setThemeId(saved);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const theme = useMemo(() => THEMES[themeId] ?? THEMES[DEFAULT_THEME_ID], [themeId]);

  const setTheme = useCallback((newId) => {
    if (newId === themeId) return;
    setIsChanging(true);

    // Fade + micro-scale out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Swap theme while invisible
      setThemeId(newId);
      saveJSON(THEME_KEY, newId);

      // Fade + scale back in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start(() => setIsChanging(false));
    });
  }, [themeId, fadeAnim, scaleAnim]);

  const value = useMemo(() => ({
    theme, themeId, setTheme, fadeAnim, scaleAnim, isChanging,
  }), [theme, themeId, setTheme, fadeAnim, scaleAnim, isChanging]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────
//  HOOKS
// ─────────────────────────────────────────────────────────

/** Get the full active theme object */
export function useTheme() {
  return useContext(ThemeContext).theme;
}

/** Get everything: theme, themeId, setTheme, animation values */
export function useThemeContext() {
  return useContext(ThemeContext);
}

/** Utility: create a memoized style factory that re-runs when theme changes */
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
