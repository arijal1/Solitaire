import { useState, useCallback, useRef, useEffect } from 'react';
import {
  dealGame,
  dealDailyGame,
  drawFromStock,
  moveWasteToTableau,
  moveWasteToFoundation,
  moveTableauToTableau,
  moveTableauToFoundation,
  autoCompleteStep,
  canAutoComplete,
  autoMoveToFoundation,
} from '../engine/gameEngine';
import { shuffle } from '../engine/cards';
import { getSmartHint, detectStuck, isGenuinelyStuck } from '../engine/hintEngine';
import { getDailyDeck, getTodayKey, isDailyCompleted, recordGameResult } from '../engine/stats';

const MAX_HISTORY = 100;
const STUCK_CHECK_DELAY = 3000; // ms after last move before checking stuck
export const MAX_SHUFFLES_PER_GAME = 3; // caps the "stuck? reshuffle" escape hatch

// Record an abandoned (not won, at least one move made) game as a loss so
// win-rate / streak stats reflect reality instead of only ever seeing wins.
function recordAbandonedIfNeeded(s, isDailyMode, dailyKey, gameRecordedRef) {
  if (!s.isWon && s.moves > 0 && !gameRecordedRef.current) {
    gameRecordedRef.current = true;
    const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
    recordGameResult({
      won: false,
      timeSeconds: elapsed,
      score: s.score,
      moves: s.moves,
      isDaily: isDailyMode,
      dailyKey,
    });
  }
}

export function useGameState(initialDrawMode = 1) {
  const [state, setState] = useState(() => dealGame(initialDrawMode));
  const historyRef     = useRef([]);
  const [hint, setHint]                     = useState(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [stuckState, setStuckState]         = useState('ok'); // 'ok'|'stuck'|'no-moves'
  const [isDailyMode, setIsDailyMode]       = useState(false);
  const [dailyKey, setDailyKey]             = useState(null);
  const autoCompleteTimer = useRef(null);
  const stuckTimer        = useRef(null);
  const gameRecordedRef   = useRef(false);

  // ── Record win/loss once ────────────────────────────────
  useEffect(() => {
    if (state.isWon && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      recordGameResult({
        won: true,
        timeSeconds: elapsed,
        score: state.score,
        moves: state.moves,
        isDaily: isDailyMode,
        dailyKey,
      });
    }
  }, [state.isWon, isDailyMode, dailyKey]);

  // ── Stuck detector ──────────────────────────────────────
  const scheduleStuckCheck = useCallback((newState) => {
    if (stuckTimer.current) clearTimeout(stuckTimer.current);
    if (newState.isWon) return;
    stuckTimer.current = setTimeout(() => {
      const status = detectStuck(newState);
      if (status !== 'ok') {
        // Do deeper check
        const genuinelyStuck = isGenuinelyStuck(newState);
        setStuckState(genuinelyStuck ? status : 'ok');
      } else {
        setStuckState('ok');
      }
    }, STUCK_CHECK_DELAY);
  }, []);

  const pushHistory = useCallback((s) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), s];
  }, []);

  const apply = useCallback((reducer) => {
    setState(current => {
      const next = reducer(current);
      if (next === current) return current;
      pushHistory(current);
      setHint(null);
      setStuckState('ok');
      scheduleStuckCheck(next);
      return next;
    });
  }, [pushHistory, scheduleStuckCheck]);

  // ── Game actions ────────────────────────────────────────
  const draw = useCallback(() => apply(drawFromStock), [apply]);

  const tapWasteCard = useCallback(() => {
    apply(current => {
      if (!current.waste.length) return current;
      const card = current.waste[current.waste.length - 1];
      const fi = autoMoveToFoundation(current, card);
      if (fi !== -1) return moveWasteToFoundation(current, fi);
      for (let col = 0; col < 7; col++) {
        const next = moveWasteToTableau(current, col);
        if (next !== current) return next;
      }
      return current;
    });
  }, [apply]);

  const moveWasteToCol  = useCallback((c) => apply(s => moveWasteToTableau(s, c)), [apply]);
  const moveWasteToFound = useCallback((fi) => apply(s => moveWasteToFoundation(s, fi)), [apply]);
  const moveCards       = useCallback((f, ci, t) => apply(s => moveTableauToTableau(s, f, ci, t)), [apply]);
  const moveToFoundation = useCallback((f, fi) => apply(s => moveTableauToFoundation(s, f, fi)), [apply]);

  const tapTableauCard = useCallback((col, cardIndex) => {
    apply(current => {
      const pile = current.tableau[col];
      if (cardIndex < 0 || cardIndex >= pile.length) return current;
      const card = pile[cardIndex];
      if (!card.faceUp) return current;
      if (cardIndex === pile.length - 1) {
        const fi = autoMoveToFoundation(current, card);
        if (fi !== -1) return moveTableauToFoundation(current, col, fi);
      }
      for (let toCol = 0; toCol < 7; toCol++) {
        if (toCol === col) continue;
        const next = moveTableauToTableau(current, col, cardIndex, toCol);
        if (next !== current) return next;
      }
      return current;
    });
  }, [apply]);

  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setState(prev);
    setHint(null);
    setStuckState('ok');
  }, []);

  // ── Smart hint ──────────────────────────────────────────
  const showHint = useCallback(() => {
    setState(current => {
      const h = getSmartHint(current);
      setHint(h);
      return current;
    });
  }, []);

  const dismissHint = useCallback(() => setHint(null), []);

  // ── Auto-complete ───────────────────────────────────────
  const startAutoComplete = useCallback(() => {
    setIsAutoCompleting(true);
    const step = () => {
      setState(current => {
        if (!canAutoComplete(current)) { setIsAutoCompleting(false); return current; }
        const next = autoCompleteStep(current);
        if (!next || next === current) { setIsAutoCompleting(false); return current; }
        if (!next.isWon) autoCompleteTimer.current = setTimeout(step, 160);
        else setIsAutoCompleting(false);
        return next;
      });
    };
    autoCompleteTimer.current = setTimeout(step, 160);
  }, []);

  // ── Shuffle (unstuck) ───────────────────────────────────
  // A limited escape hatch for a genuinely dead deal — capped per game so it
  // can't be used as a free, infinite "keep reshuffling until it's winnable"
  // exploit (previously: once score hit 0 the -20 penalty became a no-op,
  // making it free forever).
  const shuffleUnstuck = useCallback(() => {
    setState(current => {
      if (current.shuffleCount >= MAX_SHUFFLES_PER_GAME) return current;

      // Collect all remaining face-up tableau cards + waste + stock, re-shuffle
      const allCards = [];
      for (const col of current.tableau) allCards.push(...col.filter(c => c.faceUp));
      allCards.push(...current.waste);
      allCards.push(...current.stock);

      const shuffled = shuffle(allCards); // proper Fisher-Yates, not a biased sort
      const newStock = shuffled.map(c => ({ ...c, faceUp: false }));

      const newTableau = current.tableau.map(col => col.filter(c => !c.faceUp));

      return {
        ...current,
        tableau: newTableau,
        stock: newStock,
        waste: [],
        moves: current.moves + 1,
        score: Math.max(0, current.score - 20),
        shuffleCount: current.shuffleCount + 1,
      };
    });
    setStuckState('ok');
    setHint(null);
  }, []);

  // ── New game ────────────────────────────────────────────
  const newGame = useCallback((drawMode = 1) => {
    if (autoCompleteTimer.current) clearTimeout(autoCompleteTimer.current);
    if (stuckTimer.current) clearTimeout(stuckTimer.current);
    setState(current => {
      recordAbandonedIfNeeded(current, isDailyMode, dailyKey, gameRecordedRef);
      return current;
    });
    historyRef.current = [];
    gameRecordedRef.current = false;
    setState(dealGame(drawMode));
    setHint(null);
    setStuckState('ok');
    setIsAutoCompleting(false);
    setIsDailyMode(false);
    setDailyKey(null);
  }, [isDailyMode, dailyKey]);

  // ── Daily challenge ─────────────────────────────────────
  const startDailyChallenge = useCallback((drawMode = 1) => {
    const key = getTodayKey();
    if (isDailyCompleted(key)) return; // today's challenge is locked once completed

    if (autoCompleteTimer.current) clearTimeout(autoCompleteTimer.current);
    if (stuckTimer.current) clearTimeout(stuckTimer.current);
    setState(current => {
      recordAbandonedIfNeeded(current, isDailyMode, dailyKey, gameRecordedRef);
      return current;
    });
    historyRef.current = [];
    gameRecordedRef.current = false;
    const deck = getDailyDeck(key);
    setState(dealDailyGame(deck, drawMode));
    setHint(null);
    setStuckState('ok');
    setIsAutoCompleting(false);
    setIsDailyMode(true);
    setDailyKey(key);
  }, [isDailyMode, dailyKey]);

  return {
    state,
    hint,
    canUndo: historyRef.current.length > 0,
    isAutoCompleting,
    canAutoComplete: canAutoComplete(state),
    stuckState,
    isDailyMode,
    dailyKey,
    shufflesRemaining: Math.max(0, MAX_SHUFFLES_PER_GAME - state.shuffleCount),
    actions: {
      draw, tapWasteCard, moveWasteToCol, moveWasteToFound,
      moveCards, moveToFoundation, tapTableauCard,
      undo, showHint, dismissHint,
      startAutoComplete, shuffleUnstuck, newGame, startDailyChallenge,
    },
  };
}
