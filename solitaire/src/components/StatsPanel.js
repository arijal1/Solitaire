import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getStats, getWinRate, getAvgTime, getAvgMoves, isDailyCompleted, getTodayKey, getDailyResult } from '../engine/stats';

function fmtTime(secs) {
  if (!secs && secs !== 0) return '—';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

const StatsPanel = memo(({ visible, onClose, adsRemoved, onShowRemoveAds }) => {
  const t = useTheme();
  if (!visible) return null;

  const stats    = getStats();
  const winRate  = getWinRate();
  const avgTime  = getAvgTime();
  const avgMoves = getAvgMoves();
  const todayKey = getTodayKey();
  const dailyDone   = isDailyCompleted(todayKey);
  const dailyResult = getDailyResult(todayKey);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: t.panelBg, borderColor: t.panelBorder }]}>
          <View style={[styles.header, { borderBottomColor: t.rowDivider }]}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Statistics</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: `${t.textSecondary}22` }]}>
              <Text style={[styles.closeTxt, { color: t.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Section label="Overview" t={t}>
              <View style={styles.bigRow}>
                <BigStat label="Win Rate" value={`${winRate}%`} gold={winRate >= 50} t={t} />
                <BigStat label="Played"   value={stats.gamesPlayed} t={t} />
                <BigStat label="Won"      value={stats.gamesWon} t={t} />
              </View>
            </Section>

            <Section label="Streaks" t={t}>
              <StatRow label="Current streak" value={`${stats.currentStreak} 🔥`} accent={stats.currentStreak > 0} t={t} />
              <StatRow label="Best streak"    value={stats.bestStreak} t={t} />
            </Section>

            <Section label="Performance" t={t}>
              <StatRow label="Best score"      value={stats.bestScore || '—'} t={t} />
              <StatRow label="Best time"       value={fmtTime(stats.bestTime)} t={t} />
              <StatRow label="Avg time (wins)" value={fmtTime(avgTime)} t={t} />
              <StatRow label="Avg moves"       value={avgMoves || '—'} t={t} />
            </Section>

            <Section label={`Daily Challenge — ${todayKey}`} t={t}>
              {dailyDone ? (
                <>
                  <View style={[styles.dailyBadge, { backgroundColor: `${t.gold}14`, borderColor: `${t.gold}30` }]}>
                    <Text style={styles.dailyIcon}>{dailyResult?.won ? '🏆' : '😞'}</Text>
                    <Text style={[styles.dailyBadgeText, { color: t.gold }]}>
                      {dailyResult?.won ? 'Completed!' : 'Not completed'}
                    </Text>
                  </View>
                  {dailyResult?.won && <>
                    <StatRow label="Score" value={dailyResult.score} t={t} />
                    <StatRow label="Moves" value={dailyResult.moves} t={t} />
                    <StatRow label="Time"  value={fmtTime(dailyResult.timeSeconds)} t={t} />
                  </>}
                </>
              ) : (
                <View style={[styles.pending, { backgroundColor: `${t.textSecondary}0A` }]}>
                  <Text style={[styles.pendingTxt, { color: t.textSecondary }]}>
                    Play today's challenge to see your result here.
                  </Text>
                </View>
              )}
            </Section>

            <Section label="Premium" t={t}>
              {adsRemoved ? (
                <View style={[styles.premiumRow, { backgroundColor: `${t.gold}0F`, borderColor: `${t.gold}28` }]}>
                  <Text style={styles.premiumIcon}>♛</Text>
                  <Text style={[styles.premiumText, { color: t.gold }]}>Ads removed — thank you!</Text>
                </View>
              ) : onShowRemoveAds ? (
                <TouchableOpacity onPress={onShowRemoveAds} activeOpacity={0.82}
                  style={[styles.premiumRow, { backgroundColor: `${t.gold}0F`, borderColor: `${t.gold}28` }]}>
                  <Text style={styles.premiumIcon}>♛</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.removeTitle, { color: t.textPrimary }]}>Remove Ads</Text>
                    <Text style={[styles.removeSub, { color: t.textSecondary }]}>One-time · No subscription</Text>
                  </View>
                  <Text style={[styles.removePrice, { color: t.gold }]}>$1.99 →</Text>
                </TouchableOpacity>
              ) : null}
            </Section>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const Section = ({ label, t, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>{label.toUpperCase()}</Text>
    {children}
  </View>
);

const BigStat = ({ label, value, gold, t }) => (
  <View style={[styles.bigStat, { backgroundColor: `${t.textSecondary}0A` }]}>
    <Text style={[styles.bigVal, { color: gold ? t.gold : t.textPrimary }]}>{value}</Text>
    <Text style={[styles.bigLbl, { color: t.textSecondary }]}>{label}</Text>
  </View>
);

const StatRow = ({ label, value, accent, t }) => (
  <View style={[styles.row, { borderBottomColor: t.rowDivider }]}>
    <Text style={[styles.rowLabel, { color: t.textSecondary }]}>{label}</Text>
    <Text style={[styles.rowValue, { color: accent ? t.gold : t.textPrimary }]}>{value}</Text>
  </View>
);

export default StatsPanel;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  panel: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: 32, maxHeight: '88%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  title:    { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeTxt: { fontSize: 14, fontWeight: '700' },
  section:  { marginTop: 20, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  bigRow:   { flexDirection: 'row', gap: 10 },
  bigStat:  { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  bigVal:   { fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  bigLbl:   { fontSize: 10, marginTop: 2, fontWeight: '600' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '700' },
  dailyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 8, borderWidth: 1,
  },
  dailyIcon:      { fontSize: 22 },
  dailyBadgeText: { fontSize: 15, fontWeight: '700' },
  pending:    { borderRadius: 10, padding: 14 },
  pendingTxt: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  premiumRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1,
  },
  premiumIcon: { fontSize: 20 },
  premiumText: { fontSize: 14, fontWeight: '600' },
  removeTitle: { fontSize: 14, fontWeight: '700' },
  removeSub:   { fontSize: 11, marginTop: 1 },
  removePrice: { fontSize: 13, fontWeight: '700' },
});
