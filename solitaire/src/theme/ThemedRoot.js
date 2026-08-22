// ─────────────────────────────────────────────────────────
//  ThemedRoot — wraps the entire app in an Animated.View
//  that drives the crossfade + scale transition whenever
//  the theme changes. Place this just inside ThemeProvider.
// ─────────────────────────────────────────────────────────

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useThemeContext } from './ThemeContext';

export default function ThemedRoot({ children }) {
  const { fadeAnim, scaleAnim, theme } = useThemeContext();

  return (
    <Animated.View
      style={[
        styles.root,
        { backgroundColor: theme.felt },
        {
          opacity:   fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
