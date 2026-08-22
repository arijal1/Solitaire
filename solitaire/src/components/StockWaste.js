import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CardFace, CardBack } from './CardFace';
import { CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS, FONT } from '../utils/constants';
import { useTheme } from '../theme/ThemeContext';

const StockWaste = memo(({ stock, waste, drawMode, onDraw, onWasteTap, isWasteHinted }) => {
  const t = useTheme();
  const faceCard = waste.length > 0 ? waste[waste.length - 1] : null;
  const topWaste = drawMode === 3 ? waste.slice(-3) : waste.slice(-1);

  return (
    <View style={styles.row}>
      {/* Stock */}
      <TouchableOpacity onPress={onDraw} activeOpacity={0.78} style={styles.slot}>
        {stock.length > 0 ? (
          <View style={styles.stackWrap}>
            {stock.length > 2 && <View style={[styles.stackLayer, { top: -3, left: -2, backgroundColor: t.cardBack, borderColor: t.cardBackAccent }]} />}
            {stock.length > 1 && <View style={[styles.stackLayer, { top: -1.5, left: -1, backgroundColor: t.cardBack, borderColor: t.cardBackAccent }]} />}
            <CardBack />
          </View>
        ) : (
          <View style={[styles.emptySlot, { backgroundColor: t.emptySlot, borderColor: t.emptyBorder }]}>
            <Text style={[styles.recycleIcon, { color: t.textSecondary }]}>↺</Text>
            <Text style={[styles.recycleLabel, { color: t.textSecondary }]}>
              {waste.length > 0 ? 'Reset' : 'Empty'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Waste */}
      <TouchableOpacity
        onPress={onWasteTap}
        activeOpacity={faceCard ? 0.8 : 1}
        disabled={!faceCard}
        style={[styles.wasteWrap, { width: CARD_WIDTH + (drawMode === 3 ? 24 : 0) }]}
      >
        {drawMode === 3 && topWaste.length > 0 ? (
          <View style={styles.fanWrap}>
            {topWaste.map((card, i) => {
              const isTop = i === topWaste.length - 1;
              return (
                <View key={card.id} style={[styles.fanCard, { left: i * 12, zIndex: i + 1 }]}>
                  <CardFace card={card} isHinted={isTop && isWasteHinted} />
                </View>
              );
            })}
          </View>
        ) : faceCard ? (
          <View style={styles.slot}>
            <CardFace card={faceCard} isHinted={isWasteHinted} />
          </View>
        ) : (
          <View style={[styles.slot, styles.emptySlot, { backgroundColor: t.emptySlot, borderColor: t.emptyBorder }]} />
        )}
      </TouchableOpacity>
    </View>
  );
});

export default StockWaste;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3 },
  slot: {
    width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 3, elevation: 3,
  },
  wasteWrap: { height: CARD_HEIGHT, position: 'relative' },
  fanWrap:   { position: 'relative', width: CARD_WIDTH + 24, height: CARD_HEIGHT },
  fanCard:   {
    position: 'absolute', top: 0,
    width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 3,
  },
  stackWrap: { flex: 1, position: 'relative' },
  stackLayer: {
    position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS, borderWidth: 0.5,
  },
  emptySlot: {
    flex: 1, borderRadius: CARD_RADIUS,
    borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  recycleIcon:  { fontSize: FONT.bigSuitSize, opacity: 0.5 },
  recycleLabel: { fontSize: 8, marginTop: 1, opacity: 0.4 },
});
