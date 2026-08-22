import React, { memo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const StuckOverlay = memo(({ stuckState, onShuffle, onUndo, onNewGame, canUndo, shufflesRemaining = 0 }) => {
  const t = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: stuckState !== 'ok' ? 1 : 0,
      duration: 300, useNativeDriver: true,
    }).start();
  }, [stuckState]);

  if (stuckState === 'ok') return null;
  const isNoMoves = stuckState === 'no-moves';

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
      <View style={[styles.card, { backgroundColor: t.panelBg, borderColor: t.panelBorder }]}>
        <Text style={styles.icon}>{isNoMoves ? '🚫' : '🔀'}</Text>
        <Text style={[styles.title, { color: t.textPrimary }]}>
          {isNoMoves ? 'No Moves Left' : 'Stuck?'}
        </Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          {isNoMoves
            ? 'There are no more legal moves available.'
            : 'No useful moves found after cycling through the deck.'}
        </Text>
        <View style={styles.actions}>
          {!isNoMoves && shufflesRemaining > 0 && (
            <ActionBtn icon="🔀" label="Shuffle Cards" sublabel={`-20 pts · ${shufflesRemaining} left`}
              onPress={onShuffle} t={t} primary />
          )}
          {canUndo && (
            <ActionBtn icon="↩" label="Undo Moves" sublabel="Go back"
              onPress={onUndo} t={t} />
          )}
          <ActionBtn icon="+" label="New Game" sublabel="Start fresh"
            onPress={onNewGame} t={t} />
        </View>
      </View>
    </Animated.View>
  );
});

const ActionBtn = ({ icon, label, sublabel, onPress, t, primary }) => (
  <TouchableOpacity
    onPress={onPress} activeOpacity={0.78}
    style={[
      styles.actionBtn,
      primary
        ? { backgroundColor: t.gold, borderColor: t.goldDark }
        : { backgroundColor: `${t.textSecondary}12`, borderColor: t.rowDivider },
    ]}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <View>
      <Text style={[styles.actionLabel, { color: primary ? t.textOnGold : t.textPrimary }]}>{label}</Text>
      <Text style={[styles.actionSub, { color: primary ? `${t.textOnGold}99` : t.textSecondary }]}>{sublabel}</Text>
    </View>
  </TouchableOpacity>
);

export default StuckOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', bottom: 16, left: 12, right: 12,
    zIndex: 500, elevation: 50,
  },
  card: {
    borderRadius: 18, padding: 18, alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 20,
  },
  icon:     { fontSize: 32, marginBottom: 6 },
  title:    { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 14, maxWidth: 260 },
  actions:  { width: '100%', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1,
  },
  actionIcon:  { fontSize: 18, width: 24, textAlign: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  actionSub:   { fontSize: 10, marginTop: 1 },
});
