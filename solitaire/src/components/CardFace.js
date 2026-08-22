// ─────────────────────────────────────────────────────────
//  CardFace — theme-aware card rendering
// ─────────────────────────────────────────────────────────
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS, FONT } from '../utils/constants';

// ── Card Back ─────────────────────────────────────────────
export const CardBack = memo(() => {
  const t = useTheme();
  return (
    <View style={[styles.back, { backgroundColor: t.cardBack }]}>
      <View style={[styles.backInner, { borderColor: t.cardBackAccent }]}>
        {/* Repeating diamond pattern */}
        <View style={styles.backPattern}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternDot,
                { backgroundColor: t.cardBackAccent, opacity: 0.12 + (i % 3) * 0.07 },
              ]}
            />
          ))}
        </View>
        {/* Centre diamond */}
        <View style={[styles.backDiamond, { backgroundColor: t.cardBackAccent, opacity: 0.55 }]} />
      </View>
    </View>
  );
});

// ── Card Face ─────────────────────────────────────────────
export const CardFace = memo(({ card, isHinted }) => {
  const t = useTheme();
  const color = card.color === 'red' ? t.cardRed : t.cardBlack;

  return (
    <View style={[
      styles.face,
      { backgroundColor: t.cardFace, borderColor: t.cardBorder },
      isHinted && [styles.hinted, { borderColor: t.hintGlow, shadowColor: t.hintGlow }],
    ]}>
      {/* Top-left corner */}
      <View style={styles.cornerTL}>
        <Text style={[styles.rankText, { color }]}>{card.rank}</Text>
        <Text style={[styles.suitTiny, { color }]}>{card.suit}</Text>
      </View>

      {/* Centre suit */}
      <Text style={[styles.suitBig, { color }]}>{card.suit}</Text>

      {/* Bottom-right corner (rotated) */}
      <View style={styles.cornerBR}>
        <Text style={[styles.rankText, { color, transform: [{ rotate: '180deg' }] }]}>
          {card.rank}
        </Text>
        <Text style={[styles.suitTiny, { color, transform: [{ rotate: '180deg' }] }]}>
          {card.suit}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // ── Back ─────────────────────────────────────────────────
  back: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backInner: {
    flex: 1,
    width: '100%',
    borderRadius: CARD_RADIUS - 1,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 2,
  },
  patternDot: {
    width: CARD_WIDTH * 0.14,
    height: CARD_WIDTH * 0.14,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    margin: 2,
  },
  backDiamond: {
    width:  CARD_WIDTH * 0.42,
    height: CARD_WIDTH * 0.42,
    transform: [{ rotate: '45deg' }],
  },

  // ── Face ─────────────────────────────────────────────────
  face: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: 'space-between',
    borderWidth: 0.5,
  },
  hinted: {
    borderWidth: 2.5,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  cornerTL: { alignItems: 'flex-start' },
  cornerBR: { alignItems: 'flex-end' },
  rankText: {
    fontSize:   FONT.rankSize,
    fontWeight: '900',
    lineHeight: FONT.rankSize * 1.05,
  },
  suitTiny: {
    fontSize:   FONT.suitSize,
    lineHeight: FONT.suitSize * 1.1,
  },
  suitBig: {
    fontSize:   FONT.bigSuitSize,
    textAlign:  'center',
    lineHeight: FONT.bigSuitSize * 1.15,
    alignSelf:  'center',
  },
});
