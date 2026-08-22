import React, { useEffect, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');
const NUM_PARTICLES = 32;
const COLORS_LIST = ['#D4AF37','#E74C3C','#3498DB','#2ECC71','#9B59B6','#F39C12','#1ABC9C','#ECF0F1'];

const Particle = memo(({ delay }) => {
  const x    = useRef(Math.random() * W).current;
  const dur  = useRef(1800 + Math.random() * 1200).current;
  const col  = useRef(COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)]).current;
  const size = useRef(6 + Math.random() * 8).current;
  const anim = useRef(new Animated.Value(0)).current;
  const rot  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: dur, delay, useNativeDriver: true }),
      Animated.timing(rot,  { toValue: 1, duration: dur, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: -10,
      width: size, height: size,
      backgroundColor: col, borderRadius: size * 0.2,
      opacity: anim.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, H + 20] }) },
        { rotate:     rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${400 + Math.random() * 360}deg`] }) },
      ],
    }} />
  );
});

const WinOverlay = memo(({ score, moves, startTime, onNewGame, onShowRemoveAds, adsRemoved }) => {
  const t = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.72)).current;
  const elapsed   = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: t.overlayBg, opacity: fadeAnim }]}>
      {Array.from({ length: NUM_PARTICLES }, (_, i) => <Particle key={i} delay={i * 70} />)}

      <Animated.View style={[
        styles.card,
        {
          backgroundColor: t.panelBg,
          borderColor: t.gold,
          shadowColor: t.gold,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={[styles.title, { color: t.gold }]}>You Won!</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Congratulations!</Text>

        <View style={[styles.statsRow, { backgroundColor: 'rgba(0,0,0,0.22)' }]}>
          <WinStat label="Score" value={score} t={t} />
          <WinStat label="Moves" value={moves} t={t} />
          <WinStat label="Time"  value={`${mins}:${secs}`} t={t} />
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: t.gold }]} onPress={onNewGame} activeOpacity={0.82}>
          <Text style={[styles.btnText, { color: t.textOnGold }]}>Play Again</Text>
        </TouchableOpacity>

        {!adsRemoved && onShowRemoveAds && (
          <TouchableOpacity style={styles.removeBtn} onPress={onShowRemoveAds} activeOpacity={0.75}>
            <Text style={[styles.removeTxt, { color: `${t.gold}99` }]}>♛ Remove Ads — $1.99</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
});

const WinStat = ({ label, value, t }) => (
  <View style={styles.winStat}>
    <Text style={[styles.winVal, { color: t.textPrimary }]}>{value}</Text>
    <Text style={[styles.winLbl, { color: t.textSecondary }]}>{label}</Text>
  </View>
);

export default WinOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, elevation: 100,
  },
  card: {
    borderRadius: 22, padding: 28, alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 0 },
    elevation: 22,
  },
  trophy:   { fontSize: 54, marginBottom: 8 },
  title:    { fontSize: 30, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 14, marginBottom: 20, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', gap: 20, marginBottom: 22,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
  },
  winStat: { alignItems: 'center' },
  winVal:  { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  winLbl:  { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  btn: {
    borderRadius: 50, paddingVertical: 13, paddingHorizontal: 40, marginBottom: 10,
  },
  btnText:   { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  removeBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  removeTxt: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
