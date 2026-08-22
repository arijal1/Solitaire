// ─────────────────────────────────────────────────────────
//  SettingsPanel — Theme picker + preferences
//  Slide-up modal with animated theme preview cards
// ─────────────────────────────────────────────────────────
import React, { memo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, ScrollView, Dimensions,
} from 'react-native';
import { useTheme, useThemeContext } from '../theme/ThemeContext';
import { THEME_LIST } from '../theme/themes';

const { width: SW } = Dimensions.get('window');
const CARD_PREVIEW_W = (SW - 48 - 16) / 3;  // 3 columns with gaps

// ── Animated theme preview card ───────────────────────────
const ThemeCard = memo(({ themeData, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.96)).current;
  const glowAnim  = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const t         = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1 : 0.96,
        tension: 80, friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: isActive ? 1 : 0,
        duration: 240,
        useNativeDriver: false, // shadowOpacity not supported on native driver
      }),
    ]).start();
  }, [isActive]);

  const [bg, accent, backColor] = themeData.preview;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.cardTouchable}
    >
      <Animated.View style={[
        styles.themeCard,
        {
          transform: [{ scale: scaleAnim }],
          borderColor: isActive ? themeData.gold : 'rgba(255,255,255,0.08)',
          borderWidth: isActive ? 2 : 1,
          shadowColor: themeData.gold,
          shadowOpacity: glowAnim,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: isActive ? 8 : 2,
        },
      ]}>
        {/* Mini felt surface */}
        <View style={[styles.miniTable, { backgroundColor: bg }]}>
          {/* Mini cards */}
          <View style={[styles.miniCard, { backgroundColor: '#FAFAF8', left: 4, top: 6 }]}>
            <Text style={[styles.miniSuit, { color: '#C0392B' }]}>♥</Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: '#FAFAF8', left: 14, top: 2 }]}>
            <Text style={[styles.miniSuit, { color: '#1C1C28' }]}>♠</Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: backColor, left: 24, top: 6 }]} />
          {/* Mini foundation */}
          <View style={[styles.miniFnd, { borderColor: accent, right: 4, top: 4 }]}>
            <Text style={[styles.miniSuitSm, { color: accent }]}>A</Text>
          </View>
        </View>

        {/* Label row */}
        <View style={[styles.cardLabel, { backgroundColor: t.panelBg }]}>
          <Text style={styles.cardLabelIcon}>{themeData.icon}</Text>
          <Text style={[styles.cardLabelText, { color: t.textPrimary }]} numberOfLines={1}>
            {themeData.name}
          </Text>
          {isActive && (
            <View style={[styles.activeDot, { backgroundColor: themeData.gold }]} />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ── Main panel ─────────────────────────────────────────────
const SettingsPanel = memo(({ visible, onClose }) => {
  const t = useTheme();
  const { themeId, setTheme } = useThemeContext();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleThemeSelect = useCallback((id) => {
    setTheme(id);
  }, [setTheme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          { backgroundColor: t.panelBg, borderColor: t.panelBorder },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: t.textSecondary }]} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: t.textPrimary }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: t.textSecondary }]}>
              Tap a theme to switch instantly
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: `${t.textSecondary}22` }]}>
            <Text style={[styles.closeTxt, { color: t.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Theme picker ──────────────────────────── */}
          <SectionHeader label="TABLE THEME" t={t} />
          <View style={styles.themeGrid}>
            {THEME_LIST.map(themeData => (
              <ThemeCard
                key={themeData.id}
                themeData={themeData}
                isActive={themeId === themeData.id}
                onPress={() => handleThemeSelect(themeData.id)}
              />
            ))}
          </View>

          {/* ── Active theme info ─────────────────────── */}
          <View style={[styles.activeInfo, {
            backgroundColor: `${t.gold}0F`,
            borderColor: `${t.gold}28`,
          }]}>
            <Text style={[styles.activeInfoIcon]}>
              {THEME_LIST.find(th => th.id === themeId)?.icon}
            </Text>
            <View style={styles.activeInfoText}>
              <Text style={[styles.activeInfoName, { color: t.gold }]}>
                {THEME_LIST.find(th => th.id === themeId)?.name}
              </Text>
              <Text style={[styles.activeInfoSub, { color: t.textSecondary }]}>
                Active theme · Saved automatically
              </Text>
            </View>
          </View>

          {/* ── About ────────────────────────────────── */}
          <SectionHeader label="ABOUT" t={t} />
          <View style={[styles.aboutCard, { backgroundColor: `${t.textSecondary}0A`, borderColor: t.rowDivider }]}>
            <AboutRow icon="♠" label="Klondike Solitaire" value="v4.0" t={t} />
            <AboutRow icon="🃏" label="Draw modes" value="Draw 1 & 3" t={t} />
            <AboutRow icon="💡" label="Smart hints" value="Enabled" t={t} />
            <AboutRow icon="📅" label="Daily challenge" value="Every day" t={t} last />
          </View>

        </ScrollView>
      </Animated.View>
    </Modal>
  );
});

const SectionHeader = ({ label, t }) => (
  <Text style={[styles.sectionHeader, { color: t.textSecondary }]}>{label}</Text>
);

const AboutRow = ({ icon, label, value, t, last }) => (
  <View style={[styles.aboutRow, !last && { borderBottomWidth: 1, borderBottomColor: t.rowDivider }]}>
    <Text style={styles.aboutIcon}>{icon}</Text>
    <Text style={[styles.aboutLabel, { color: t.textSecondary }]}>{label}</Text>
    <Text style={[styles.aboutValue, { color: t.textPrimary }]}>{value}</Text>
  </View>
);

export default SettingsPanel;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
    borderWidth: 1,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 30,
  },
  handle: {
    width: 36, height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeTxt: { fontSize: 14, fontWeight: '700' },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 2,
  },

  // ── Theme grid ────────────────────────────────────────────
  themeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTouchable: {
    flex: 1,
  },
  themeCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  miniTable: {
    height: 76,
    position: 'relative',
    overflow: 'hidden',
  },
  miniCard: {
    position: 'absolute',
    width: 22,
    height: 32,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  miniSuit:   { fontSize: 10 },
  miniSuitSm: { fontSize: 8, fontWeight: '800' },
  miniFnd: {
    position: 'absolute',
    width: 18,
    height: 26,
    borderRadius: 3,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  cardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 5,
  },
  cardLabelIcon: { fontSize: 13 },
  cardLabelText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ── Active theme info ─────────────────────────────────────
  activeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    marginTop: 10,
  },
  activeInfoIcon:  { fontSize: 22 },
  activeInfoText:  { flex: 1 },
  activeInfoName:  { fontSize: 14, fontWeight: '700' },
  activeInfoSub:   { fontSize: 11, marginTop: 1 },

  // ── About ─────────────────────────────────────────────────
  aboutCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  aboutIcon:  { fontSize: 14, width: 20, textAlign: 'center' },
  aboutLabel: { flex: 1, fontSize: 13 },
  aboutValue: { fontSize: 13, fontWeight: '700' },
});
