// ─────────────────────────────────────────────────────────
//  RewardedAdModal — UX-friendly prompt before showing a
//  rewarded ad. Explains what the player will get in return.
//  Never interrupts gameplay; always user-initiated.
// ─────────────────────────────────────────────────────────

import React, { memo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated,
} from 'react-native';
import { THEMES } from '../theme/themes';
// Static colors from classic theme for overlay modals
const COLORS = { ...THEMES.classic };
COLORS.textLight = THEMES.classic.textPrimary;
COLORS.textMuted = THEMES.classic.textSecondary;
COLORS.feltDark  = THEMES.classic.textOnGold;
import { AD_CONFIG } from './adConfig';

const RewardedAdModal = memo(({
  visible,
  type,           // 'hint' | 'undo'
  rewardedReady,  // bool — is an ad actually available?
  onWatch,        // () => void — user taps "Watch Ad"
  onClose,        // () => void — user cancels
}) => {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const isHint = type === 'hint';
  const icon   = isHint ? '💡' : '↩';
  const title  = isHint ? 'Get Extra Hints' : 'Get Extra Undos';
  const amount = isHint ? AD_CONFIG.rewardedHintBonus : AD_CONFIG.rewardedUndoBonus;
  const reward = isHint
    ? `${amount} bonus hint${amount > 1 ? 's' : ''}`
    : `${amount} extra undo${amount > 1 ? 's' : ''}`;
  const notAvailableText = 'No ad available right now. Try again in a moment.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Stop touch propagation to card */}
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{icon}</Text>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>
              Watch a short ad and receive{' '}
              <Text style={styles.reward}>{reward}</Text>
              {' '}to help you win.
            </Text>

            {!rewardedReady && (
              <View style={styles.notAvailable}>
                <Text style={styles.notAvailableText}>{notAvailableText}</Text>
              </View>
            )}

            <View style={styles.actions}>
              {rewardedReady ? (
                <TouchableOpacity
                  style={styles.watchBtn}
                  onPress={onWatch}
                  activeOpacity={0.82}
                >
                  <Text style={styles.watchIcon}>▶</Text>
                  <Text style={styles.watchText}>Watch Ad</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.watchBtn, styles.watchBtnDisabled]}>
                  <Text style={styles.watchText}>Not Available</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelText}>No Thanks</Text>
              </TouchableOpacity>
            </View>

            {/* Legal note */}
            <Text style={styles.legal}>
              Ad provided by Google AdMob · {__DEV__ ? 'Test Mode' : 'Live'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

export default RewardedAdModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#0E3A20',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  icon: { fontSize: 28 },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  reward: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  notAvailable: {
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.2)',
    marginBottom: 14,
    width: '100%',
  },
  notAvailableText: {
    fontSize: 12,
    color: '#E74C3C',
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 50,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  watchBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  watchIcon: {
    fontSize: 12,
    color: COLORS.feltDark,
    fontWeight: '900',
  },
  watchText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.feltDark,
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  legal: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
  },
});