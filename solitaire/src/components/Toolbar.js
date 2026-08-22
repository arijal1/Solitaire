import React, { memo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { isDailyCompleted, getTodayKey } from '../engine/stats';

const Toolbar = memo(({
  score, moves, startTime, drawMode,
  canUndo, canAutoComplete, isDailyMode,
  bonusHints, bonusUndos, rewardedReady, adsRemoved,
  onUndo, onHint, onNewGame, onAutoComplete,
  onDrawModeChange, onShowStats, onDailyChallenge,
  onWatchAdForHint, onWatchAdForUndo,
  onShowRemoveAds, onShowSettings,
}) => {
  const t = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const todayKey  = getTodayKey();
  const dailyDone = isDailyCompleted(todayKey);

  useEffect(() => {
    const iv = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  const m = Math.floor(elapsed / 60);
  const s = String(elapsed % 60).padStart(2, '0');
  const timeStr = elapsed >= 3600
    ? `${Math.floor(elapsed / 3600)}:${String(m % 60).padStart(2,'0')}:${s}`
    : `${m}:${s}`;

  const S = makeStyles(t);

  return (
    <View style={S.toolbar}>
      {/* ── Stats row ── */}
      <View style={S.statsRow}>
        <StatItem label="SCORE" value={score} t={t} />
        <StatItem label="MOVES" value={moves} t={t} />
        <StatItem label="TIME"  value={timeStr} t={t} />

        {isDailyMode ? (
          <View style={S.dailyBadge}>
            <Text style={S.dailyText}>📅 DAILY</Text>
          </View>
        ) : (
          <View style={S.drawToggle}>
            {[1, 3].map(mode => (
              <TouchableOpacity
                key={mode}
                style={[S.drawBtn, drawMode === mode && S.drawBtnActive]}
                onPress={() => onDrawModeChange(mode)}
              >
                <Text style={[S.drawBtnText, drawMode === mode && S.drawBtnTextActive]}>
                  D{mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── Action buttons ── */}
      <View style={S.btnsRow}>
        <ToolBtn t={t}
          label="↩" sub={bonusUndos > 0 ? `+${bonusUndos}` : 'UNDO'}
          onPress={onUndo} disabled={!canUndo}
          badge={bonusUndos > 0 ? bonusUndos : null}
        />
        <ToolBtn t={t}
          label="💡" sub={bonusHints > 0 ? `+${bonusHints}` : 'HINT'}
          onPress={onHint}
          badge={bonusHints > 0 ? bonusHints : null}
        />
        {!adsRemoved && (
          <>
            <ToolBtn t={t} label="📺" sub="HINTS" onPress={onWatchAdForHint} rewarded />
            <ToolBtn t={t} label="📺" sub="UNDOS" onPress={onWatchAdForUndo} rewarded />
          </>
        )}
        <ToolBtn t={t}
          label="📅" sub={dailyDone ? 'DONE' : 'DAILY'}
          onPress={onDailyChallenge} accent={!dailyDone} disabled={dailyDone}
        />
        <ToolBtn t={t} label="⚙" sub="THEME"  onPress={onShowSettings} />
        <ToolBtn t={t} label="📊" sub="STATS"  onPress={onShowStats} />
        {canAutoComplete
          ? <ToolBtn t={t} label="✨" sub="AUTO" onPress={onAutoComplete} gold />
          : <ToolBtn t={t} label="+"  sub="NEW"  onPress={onNewGame} />
        }
      </View>
    </View>
  );
});

const StatItem = ({ label, value, t }) => {
  const S = makeStyles(t);
  return (
    <View style={S.statItem}>
      <Text style={S.statLabel}>{label}</Text>
      <Text style={S.statValue}>{value}</Text>
    </View>
  );
};

const ToolBtn = ({ label, sub, onPress, disabled, accent, gold, rewarded, badge, t }) => {
  const S = makeStyles(t);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.72}
      style={[
        S.toolBtn,
        disabled  && S.toolBtnDisabled,
        accent    && S.toolBtnAccent,
        gold      && S.toolBtnGold,
        rewarded  && S.toolBtnRewarded,
      ]}
    >
      <Text style={S.toolBtnIcon}>{label}</Text>
      <Text style={[
        S.toolBtnText,
        disabled && S.toolBtnTextMuted,
        gold     && S.toolBtnTextGold,
        accent   && S.toolBtnTextAccent,
        rewarded && S.toolBtnTextRewarded,
      ]}>
        {sub}
      </Text>
      {badge != null && (
        <View style={S.badge}>
          <Text style={S.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Toolbar;

// ── Dynamic style factory (memoised per theme change) ─────
function makeStyles(t) {
  return StyleSheet.create({
    toolbar: {
      backgroundColor: t.toolbarBg,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: t.toolbarBorder,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    statItem:  { alignItems: 'center', minWidth: 52 },
    statLabel: {
      fontSize: 8, color: t.textSecondary,
      fontWeight: '700', letterSpacing: 1,
    },
    statValue: {
      fontSize: 15, color: t.textPrimary,
      fontWeight: '700', fontVariant: ['tabular-nums'],
    },
    drawToggle: {
      flexDirection: 'row', gap: 2,
      backgroundColor: 'rgba(0,0,0,0.28)',
      borderRadius: 6, padding: 2,
    },
    drawBtn:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    drawBtnActive:   { backgroundColor: t.gold },
    drawBtnText:     { fontSize: 10, color: t.textSecondary, fontWeight: '700' },
    drawBtnTextActive: { color: t.textOnGold },
    dailyBadge: {
      backgroundColor: `${t.gold}22`,
      borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 4,
      borderWidth: 1, borderColor: `${t.gold}44`,
    },
    dailyText: { fontSize: 10, color: t.gold, fontWeight: '800', letterSpacing: 0.5 },
    btnsRow:   { flexDirection: 'row', gap: 4, justifyContent: 'center' },
    toolBtn: {
      backgroundColor: t.buttonBg,
      borderRadius: 8,
      paddingHorizontal: 7, paddingVertical: 4,
      minWidth: 44, alignItems: 'center', gap: 1,
    },
    toolBtnDisabled:  { opacity: 0.3 },
    toolBtnAccent: {
      backgroundColor: `${t.gold}1A`,
      borderWidth: 1, borderColor: `${t.gold}44`,
    },
    toolBtnGold:    { backgroundColor: t.gold },
    toolBtnRewarded: {
      backgroundColor: 'rgba(79,195,247,0.1)',
      borderWidth: 1, borderColor: 'rgba(79,195,247,0.28)',
    },
    toolBtnIcon:      { fontSize: 13 },
    toolBtnText:      { fontSize: 8, color: t.textSecondary, fontWeight: '700', letterSpacing: 0.4 },
    toolBtnTextMuted: { color: t.textSecondary, opacity: 0.4 },
    toolBtnTextGold:  { color: t.textOnGold },
    toolBtnTextAccent:{ color: t.gold },
    toolBtnTextRewarded: { color: '#4FC3F7' },
    badge: {
      position: 'absolute', top: -3, right: -3,
      backgroundColor: t.gold,
      borderRadius: 7, minWidth: 14, height: 14,
      justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 2,
    },
    badgeText: { fontSize: 8, fontWeight: '900', color: t.textOnGold },
  });
}
