// ─────────────────────────────────────────────────────────
//  RemoveAdsModal — "Remove Ads" upsell / premium purchase
//  Shown from the stats panel or toolbar menu.
//  Actual IAP wired via react-native-purchases (RevenueCat)
//  or expo-in-app-purchases — placeholder UX here.
// ─────────────────────────────────────────────────────────

import React, { memo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, ScrollView,
} from 'react-native';
import { THEMES } from '../theme/themes';
// Static colors from classic theme for overlay modals
const COLORS = { ...THEMES.classic };
COLORS.textLight = THEMES.classic.textPrimary;
COLORS.textMuted = THEMES.classic.textSecondary;
COLORS.feltDark  = THEMES.classic.textOnGold;

const PERKS = [
  { icon: '🚫', label: 'No ads, ever' },
  { icon: '💡', label: 'Unlimited hints' },
  { icon: '↩',  label: 'Unlimited undos' },
  { icon: '📊', label: 'Extended statistics' },
  { icon: '🏆', label: 'Premium badge' },
];

const RemoveAdsModal = memo(({
  visible,
  onPurchase,   // () => void
  onRestore,    // () => void
  onClose,      // () => void
  isPurchasing, // bool
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.crown}>♛</Text>
            <Text style={styles.title}>Remove Ads</Text>
            <Text style={styles.subtitle}>One-time purchase, forever</Text>
          </View>

          {/* Perks list */}
          <View style={styles.perks}>
            {PERKS.map((p, i) => (
              <View key={i} style={styles.perk}>
                <Text style={styles.perkIcon}>{p.icon}</Text>
                <Text style={styles.perkLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          {/* Price */}
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>One-time purchase</Text>
            <Text style={styles.price}>$1.99</Text>
            <Text style={styles.priceNote}>No subscription · No hidden fees</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.buyBtn, isPurchasing && styles.buyBtnLoading]}
              onPress={onPurchase}
              disabled={isPurchasing}
              activeOpacity={0.82}
            >
              <Text style={styles.buyText}>
                {isPurchasing ? 'Processing…' : 'Remove Ads — $1.99'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={onRestore}
              disabled={isPurchasing}
              activeOpacity={0.75}
            >
              <Text style={styles.restoreText}>Restore Purchase</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            Payment processed by Apple / Google. By purchasing you agree to our Terms of Service.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
});

export default RemoveAdsModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#0E3A20',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    shadowColor: COLORS.gold,
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  crown: {
    fontSize: 42,
    color: COLORS.gold,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textLight,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  perks: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  perkLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  priceBox: {
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  price: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.gold,
  },
  priceNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actions: { gap: 8, marginBottom: 12 },
  buyBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buyBtnLoading: { opacity: 0.6 },
  buyText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.feltDark,
    letterSpacing: 0.3,
  },
  restoreBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  restoreText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  legal: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.18)',
    textAlign: 'center',
    lineHeight: 14,
  },
});
