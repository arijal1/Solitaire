import React, { useRef, useCallback, useState, memo, useEffect } from 'react';
import { loadJSON, saveJSON } from '../utils/persistence';
import {
  View, ScrollView, StyleSheet, StatusBar,
  SafeAreaView, PanResponder, Animated, Text, TouchableOpacity,
} from 'react-native';
import { useGameState }   from '../hooks/useGameState';
import { useTheme }       from '../theme/ThemeContext';
import Toolbar            from './Toolbar';
import StockWaste         from './StockWaste';
import WinOverlay         from './WinOverlay';
import StuckOverlay       from './StuckOverlay';
import StatsPanel         from './StatsPanel';
import SettingsPanel      from './SettingsPanel';
import { CardFace, CardBack } from './CardFace';
import {
  CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS,
  FACE_UP_OVERLAP, FACE_DOWN_OVERLAP,
} from '../utils/constants';
import { useAdManager }   from '../ads/useAdManager';
import RewardedAdModal    from '../ads/RewardedAdModal';
import RemoveAdsModal     from '../ads/RemoveAdsModal';

const GUTTER   = 3;
const SIDE_PAD = 6;

// ── Floating drag ghost ───────────────────────────────────
const FloatingDragCard = memo(({ dragState }) => {
  if (!dragState.active) return null;
  return (
    <Animated.View
      style={[styles.floatingCard, {
        transform: [{ translateX: dragState.pan.x }, { translateY: dragState.pan.y }],
        zIndex: 9999, elevation: 99,
      }]}
      pointerEvents="none"
    >
      {dragState.cards.map((card, i) => (
        <View key={card.id} style={[styles.dragLayer, { top: i * FACE_UP_OVERLAP, zIndex: i }]}>
          {card.faceUp ? <CardFace card={card} isHinted={false} /> : <CardBack />}
        </View>
      ))}
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────
export default function GameScreen() {
  const t = useTheme();
  const [drawMode, setDrawMode]   = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [adsRemoved, setAdsRemoved]     = useState(false);
  const [removeAdsModal, setRemoveAdsModal] = useState(false);
  const [isPurchasing, setIsPurchasing]     = useState(false);
  const [rewardedModal, setRewardedModal]   = useState({ visible: false, type: 'hint' });

  // Hydrate the "ads removed" purchase flag once at startup so a paying
  // user doesn't lose their purchase on every app restart.
  useEffect(() => {
    let cancelled = false;
    loadJSON('solitaire.adsRemoved.v1', false).then((saved) => {
      if (!cancelled && saved) setAdsRemoved(true);
    });
    return () => { cancelled = true; };
  }, []);

  const {
    rewardedReady, bonusHints, bonusUndos,
    setBonusHints, setBonusUndos, onGameComplete,
    showRewardedForHint, showRewardedForUndo,
  } = useAdManager({ adsRemoved });

  const {
    state, hint, canUndo, canAutoComplete, isAutoCompleting,
    stuckState, isDailyMode, shufflesRemaining, actions,
  } = useGameState(drawMode);

  // Fire interstitial 2.5 s after win (after confetti)
  const prevWonRef = useRef(false);
  useEffect(() => {
    if (state.isWon && !prevWonRef.current) {
      prevWonRef.current = true;
      setTimeout(() => onGameComplete(), 2500);
    }
    if (!state.isWon) prevWonRef.current = false;
  }, [state.isWon, onGameComplete]);

  // Hint / Undo drain bonus pool first
  const handleHint = useCallback(() => {
    if (bonusHints > 0) setBonusHints(n => Math.max(0, n - 1));
    actions.showHint();
  }, [bonusHints, setBonusHints, actions]);

  const handleUndo = useCallback(() => {
    if (bonusUndos > 0) setBonusUndos(n => Math.max(0, n - 1));
    actions.undo();
  }, [bonusUndos, setBonusUndos, actions]);

  // Rewarded ad
  const openRewardedForHint = useCallback(() => setRewardedModal({ visible: true, type: 'hint' }), []);
  const openRewardedForUndo = useCallback(() => setRewardedModal({ visible: true, type: 'undo' }), []);
  const handleWatchAd = useCallback(() => {
    const { type } = rewardedModal;
    setRewardedModal(m => ({ ...m, visible: false }));
    if (type === 'hint') showRewardedForHint(({ amount }) => setBonusHints(n => n + amount));
    else                 showRewardedForUndo(({ amount }) => setBonusUndos(n => n + amount));
  }, [rewardedModal, showRewardedForHint, showRewardedForUndo, setBonusHints, setBonusUndos]);

  // Remove Ads (stub)
  const handlePurchase = useCallback(() => {
    setIsPurchasing(true);
    setTimeout(() => {
      setIsPurchasing(false);
      setAdsRemoved(true);
      saveJSON('solitaire.adsRemoved.v1', true);
      setRemoveAdsModal(false);
    }, 1500);
  }, []);
  const handleRestore = useCallback(() => {
    setIsPurchasing(true);
    setTimeout(() => setIsPurchasing(false), 1000);
  }, []);

  const handleDrawMode = useCallback((mode) => {
    setDrawMode(mode);
    actions.newGame(mode);
  }, [actions]);

  const hintedCardId  = hint?.card?.id ?? null;
  const isWasteHinted = hint?.type === 'waste-to-foundation' || hint?.type === 'waste-to-tableau';

  // ── Drag & drop ─────────────────────────────────────────
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [dragState, setDragState] = useState({ active: false, cards: [], source: null });
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const dropZones  = useRef([]);
  const [dropHL, setDropHL] = useState(null);
  const tableauRefs = useRef(Array.from({ length: 7 }, () => React.createRef()));
  const foundRefs   = useRef(Array.from({ length: 4 }, () => React.createRef()));

  const regZone = useCallback((zone) => {
    const idx = dropZones.current.findIndex(z => z.type === zone.type && z.index === zone.index);
    if (idx >= 0) dropZones.current[idx] = zone; else dropZones.current.push(zone);
  }, []);

  const measureTab = useCallback((i, ref) => {
    if (!ref?.current) return;
    ref.current.measure((x, y, w, h, px, py) =>
      regZone({ type: 'tableau', index: i, pageX: px, pageY: py, width: w, height: Math.max(h, CARD_HEIGHT * 3) })
    );
  }, [regZone]);

  const measureFound = useCallback((i, ref) => {
    if (!ref?.current) return;
    ref.current.measure((x, y, w, h, px, py) =>
      regZone({ type: 'foundation', index: i, pageX: px, pageY: py, width: w, height: h })
    );
  }, [regZone]);

  const findZone = useCallback((px, py) =>
    dropZones.current.find(z =>
      px >= z.pageX && px <= z.pageX + z.width &&
      py >= z.pageY && py <= z.pageY + z.height
    ) || null, []);

  const pendingDrag = useRef(null);

  const onDragMove = useCallback((px, py) => {
    pan.setValue({ x: px - CARD_WIDTH / 2, y: py - CARD_HEIGHT * 0.25 });
    setDropHL(findZone(px, py));
  }, [pan, findZone]);

  const onDragEnd = useCallback((px, py) => {
    const ds = dragStateRef.current;
    const zone = findZone(px, py);
    if (zone && ds.active) {
      if (zone.type === 'tableau') {
        ds.source.type === 'tableau'
          ? actions.moveCards(ds.source.col, ds.source.cardIdx, zone.index)
          : actions.moveWasteToCol(zone.index);
      } else if (zone.type === 'foundation') {
        ds.source.type === 'tableau'
          ? actions.moveToFoundation(ds.source.col, zone.index)
          : actions.moveWasteToFound(zone.index);
      }
    }
    pan.setValue({ x: 0, y: 0 });
    setDragState(s => ({ ...s, active: false, cards: [] }));
    setDropHL(null);
    pendingDrag.current = null;
  }, [findZone, actions, pan]);

  const globalPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        !!pendingDrag.current && (Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10),
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        if (pendingDrag.current && !dragStateRef.current.active) {
          const { source, cards, ox, oy } = pendingDrag.current;
          pan.setValue({ x: ox, y: oy });
          setDragState({ active: true, cards, source });
        }
        onDragMove(pageX, pageY);
      },
      onPanResponderRelease: (evt) => onDragEnd(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderTerminate: () => {
        pendingDrag.current = null;
        pan.setValue({ x: 0, y: 0 });
        setDragState(s => ({ ...s, active: false, cards: [] }));
        setDropHL(null);
      },
    })
  ).current;

  const onTabLongPress = useCallback((ci, idx, px, py) => {
    const pile = state.tableau[ci];
    const cards = pile.slice(idx);
    if (!cards.length || !cards[0].faceUp) return;
    pendingDrag.current = { source: { type: 'tableau', col: ci, cardIdx: idx }, cards, ox: px - CARD_WIDTH / 2, oy: py - 10 };
  }, [state.tableau]);

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.felt }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor={t.toolbarBg} />

      <Toolbar
        score={state.score} moves={state.moves} startTime={state.startTime}
        drawMode={state.drawMode} canUndo={canUndo}
        canAutoComplete={canAutoComplete && !isAutoCompleting}
        isDailyMode={isDailyMode} bonusHints={bonusHints} bonusUndos={bonusUndos}
        rewardedReady={rewardedReady} adsRemoved={adsRemoved}
        onUndo={handleUndo} onHint={handleHint}
        onNewGame={() => actions.newGame(drawMode)}
        onAutoComplete={actions.startAutoComplete}
        onDrawModeChange={handleDrawMode}
        onShowStats={() => setShowStats(true)}
        onShowSettings={() => setShowSettings(true)}
        onDailyChallenge={actions.startDailyChallenge}
        onWatchAdForHint={openRewardedForHint}
        onWatchAdForUndo={openRewardedForUndo}
        onShowRemoveAds={() => setRemoveAdsModal(true)}
      />

      <View style={styles.gameArea} {...globalPan.panHandlers}>
        {/* Top row */}
        <View style={styles.topRow}>
          <StockWaste
            stock={state.stock} waste={state.waste} drawMode={state.drawMode}
            onDraw={actions.draw} onWasteTap={actions.tapWasteCard} isWasteHinted={isWasteHinted}
          />
          <View style={styles.spacer} />
          {state.foundations.map((pile, fi) => {
            const topCard  = pile.length > 0 ? pile[pile.length - 1] : null;
            const isDropHL = dropHL?.type === 'foundation' && dropHL?.index === fi;
            return (
              <View
                key={fi}
                ref={foundRefs.current[fi]}
                onLayout={() => measureFound(fi, foundRefs.current[fi])}
                style={[
                  styles.foundSlot,
                  isDropHL && { shadowColor: t.gold, shadowOpacity: 1, shadowRadius: 14, elevation: 10 },
                ]}
              >
                {topCard
                  ? <CardFace card={topCard} isHinted={false} />
                  : <View style={[styles.emptyFound, { backgroundColor: t.emptySlot, borderColor: t.emptyBorder }]}>
                      <Text style={[styles.emptyFoundTxt, { color: t.textSecondary }]}>{['♠','♣','♥','♦'][fi]}</Text>
                    </View>
                }
              </View>
            );
          })}
        </View>

        {/* Tableau */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={!dragState.active}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.tableau}>
            {state.tableau.map((cards, ci) => {
              const isDropTarget = dropHL?.type === 'tableau' && dropHL?.index === ci;
              const colH = Math.max(CARD_HEIGHT,
                cards.reduce((h, c, i) =>
                  i < cards.length - 1 ? h + (c.faceUp ? FACE_UP_OVERLAP : FACE_DOWN_OVERLAP) : h + CARD_HEIGHT, 0)
              );
              return (
                <View
                  key={ci}
                  ref={tableauRefs.current[ci]}
                  onLayout={() => measureTab(ci, tableauRefs.current[ci])}
                  style={[
                    styles.tabCol,
                    { height: colH },
                    isDropTarget && { shadowColor: t.gold, shadowOpacity: 0.9, shadowRadius: 14, elevation: 12, borderRadius: CARD_RADIUS + 2 },
                  ]}
                >
                  {cards.length === 0 && (
                    <View style={[styles.emptySlot, { backgroundColor: t.emptySlot, borderColor: t.emptyBorder }]} />
                  )}
                  {cards.map((card, idx) => {
                    const topPx = cards.slice(0, idx).reduce((h, c) =>
                      h + (c.faceUp ? FACE_UP_OVERLAP : FACE_DOWN_OVERLAP), 0);
                    const isHidden = dragState.active &&
                      dragState.source?.type === 'tableau' &&
                      dragState.source?.col === ci &&
                      idx >= dragState.source?.cardIdx;
                    return (
                      <TouchableOpacity
                        key={card.id}
                        activeOpacity={card.faceUp ? 0.8 : 1}
                        onPress={() => card.faceUp && actions.tapTableauCard(ci, idx)}
                        onLongPress={(e) => {
                          if (!card.faceUp) return;
                          onTabLongPress(ci, idx, e.nativeEvent.pageX, e.nativeEvent.pageY);
                        }}
                        delayLongPress={120}
                        style={[
                          styles.cardWrapper,
                          { top: topPx, zIndex: idx + 1, elevation: idx + 1 },
                          isHidden && styles.cardHidden,
                        ]}
                      >
                        {card.faceUp
                          ? <CardFace card={card} isHinted={card.id === hintedCardId} />
                          : <CardBack />
                        }
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <StuckOverlay
          stuckState={stuckState} canUndo={canUndo}
          shufflesRemaining={shufflesRemaining}
          onShuffle={actions.shuffleUnstuck}
          onUndo={handleUndo}
          onNewGame={() => actions.newGame(drawMode)}
        />
      </View>

      <FloatingDragCard dragState={{ ...dragState, pan }} />

      {state.isWon && (
        <WinOverlay
          score={state.score} moves={state.moves} startTime={state.startTime}
          adsRemoved={adsRemoved}
          onNewGame={() => actions.newGame(drawMode)}
          onShowRemoveAds={() => setRemoveAdsModal(true)}
        />
      )}

      <StatsPanel
        visible={showStats} onClose={() => setShowStats(false)}
        adsRemoved={adsRemoved}
        onShowRemoveAds={() => { setShowStats(false); setRemoveAdsModal(true); }}
      />

      <SettingsPanel visible={showSettings} onClose={() => setShowSettings(false)} />

      <RewardedAdModal
        visible={rewardedModal.visible} type={rewardedModal.type}
        rewardedReady={rewardedReady}
        onWatch={handleWatchAd}
        onClose={() => setRewardedModal(m => ({ ...m, visible: false }))}
      />

      <RemoveAdsModal
        visible={removeAdsModal}
        onPurchase={handlePurchase} onRestore={handleRestore}
        onClose={() => setRemoveAdsModal(false)} isPurchasing={isPurchasing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  gameArea:    { flex: 1, paddingHorizontal: SIDE_PAD, paddingTop: 8 },
  topRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  spacer:      { flex: 1 },
  foundSlot:   {
    width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: CARD_RADIUS, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 3, elevation: 3,
    marginLeft: GUTTER,
  },
  emptyFound:  {
    flex: 1, borderRadius: CARD_RADIUS, borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyFoundTxt: { fontSize: CARD_WIDTH * 0.44, opacity: 0.5 },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  tableau:       { flexDirection: 'row', justifyContent: 'space-between' },
  tabCol:        { width: CARD_WIDTH, position: 'relative' },
  cardWrapper:   {
    position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 3, elevation: 3,
  },
  cardHidden:  { opacity: 0.15 },
  emptySlot:   {
    width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: CARD_RADIUS,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  floatingCard: { position: 'absolute', top: 0, left: 0, width: CARD_WIDTH },
  dragLayer:    {
    position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 2, height: 5 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
});
