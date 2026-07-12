/**
 * ZipGameScreen.jsx  —  Coin-system integrated version
 *
 * New features:
 *  • Coins earned on level complete (random 50–89)
 *  • Win modal has 3 options: Retry / Next / 2x Coins (rewarded ad)
 *  • Hint button uses CoinManager for hint state
 *  • Coins & hints synced via CoinManager
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  completeLevel, incrementMissionProgress,
} from '../utils/ProfileManager';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Dimensions, PanResponder, Animated,
  Platform, StatusBar, SafeAreaView, InteractionManager,
  ActivityIndicator,
} from 'react-native';
import Svg, { Line, Polyline, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateLevel, wallKey, preloadLevelBatch, levelCache } from '../utils/levelGenerator';
import { useTheme } from '../constants/theme';
import AdManager from '../ads/AdManager';
import Video from 'react-native-video';
import {
  getCoins, addCoins, getHints, addHints, spendHint, getLevelCoinReward,
} from '../utils/CoinManager';

// ─────────────────────────────────────────────
// CONSTANTS & THEME
// ─────────────────────────────────────────────


const LS = {
  LEVEL: 'zipCurrentLevel',
};

const MAX_TIME = 20;

// ─────────────────────────────────────────────
// ASYNC STORAGE HELPERS
// ─────────────────────────────────────────────
async function getSavedLevel() {
  try { return Math.max(1, parseInt((await AsyncStorage.getItem(LS.LEVEL)) || '1', 10)); }
  catch { return 1; }
}
async function saveCurrentLevel(n) {
  try { await AsyncStorage.setItem(LS.LEVEL, String(n)); } catch { }
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ZipGameScreen() {
  const { theme } = useTheme();
  const s = getStyles(theme);
  const good = theme.good || '#34d399';
  const warn = theme.warn || '#fbbf24';
  const bad = theme.bad || '#f87171';
  const screenWidth = Dimensions.get('window').width;
  const CELL = Math.floor((screenWidth - 48) / 6);
  const navigation = useNavigation();
  const route = useRoute();
  const usedHintThisLevel = useRef(false);

  // ── Game state ──
  const [levelNum, setLevelNum] = useState(1);
  const [levelData, setLevelData] = useState(null);
  const [path, setPath] = useState([]);
  const [solved, setSolved] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('');

  // ── Coins & Hints ──
  const [coins, setCoinsState] = useState(0);
  const [hints, setHintsState] = useState(0);
  const hintBtnLocked = useRef(false);

  // ── Win coin reward ──
  const [levelCoinReward, setLevelCoinReward] = useState(0);

  // ── Hint cell ──
  const [hintCell, setHintCell] = useState(null);
  const hintPulse = useRef(new Animated.Value(1)).current;

  // ── Timer ──
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef(null);
  const timerStarted = useRef(false);
  const extraTimeRef = useRef(0);
  const [extraTime, setExtraTime] = useState(0);
  useEffect(() => { extraTimeRef.current = extraTime; }, [extraTime]);

  // ── Ad loading state ──
  const [adLoading, setAdLoading] = useState(false);

  // ── Modals ──
  const [showWin, setShowWin] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paused, setPaused] = useState(false);

  // ── Win modal info ──
  const [winTime, setWinTime] = useState('0:00');
  const [winSub, setWinSub] = useState('');

  // ── Skip countdown ──
  const [skipCount, setSkipCount] = useState(5);
  const skipTimersRef = useRef([]);

  // ── Toast ──
  const [toast, setToast] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  // ── Drag state (refs so PanResponder has fresh values) ──
  const pathRef = useRef([]);
  const draggingRef = useRef(false);
  const solvedRef = useRef(false);
  const levelDataRef = useRef(null);

  useEffect(() => { pathRef.current = path; }, [path]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { levelDataRef.current = levelData; }, [levelData]);

  // ─────────────────────────────────────────────
  // REFRESH COINS & HINTS
  // ─────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    setCoinsState(await getCoins());
    setHintsState(await getHints());
  }, []);

  // ─────────────────────────────────────────────
  // TOAST
  // ─────────────────────────────────────────────
  const showToastMsg = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [toastOpacity]);

  // ─────────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────────
  const handleTimeUpRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        const maxAllowed = MAX_TIME + extraTimeRef.current;
        if (prev + 1 >= maxAllowed) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleTimeUpRef.current?.();
          return maxAllowed;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const ensureTimerRunning = useCallback(() => {
    if (timerStarted.current) return;
    timerStarted.current = true;
    startTimer();
  }, [startTimer]);

  const resumeTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        const maxAllowed = MAX_TIME + extraTimeRef.current;
        if (prev + 1 >= maxAllowed) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleTimeUpRef.current?.();
          return maxAllowed;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ─────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────
  const statusTimerRef = useRef(null);
  const setStatus = useCallback((msg, type = '') => {
    setStatusMsg(msg);
    setStatusType(type);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    if (type === 'bad') {
      statusTimerRef.current = setTimeout(() => {
        if (!solvedRef.current && levelDataRef.current) {
          const { size } = levelDataRef.current;
          setStatusMsg(`Start from 1 · fill all ${size * size} cells`);
          setStatusType('');
        }
      }, 2000);
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    setStatus('Time is up! ⏰', 'bad');
    setShowTimeUp(true);
  }, [setStatus]);
  useEffect(() => { handleTimeUpRef.current = handleTimeUp; }, [handleTimeUp]);

  // ─────────────────────────────────────────────
  // APPLY / LOAD LEVEL
  // ─────────────────────────────────────────────
  const applyLevelData = useCallback((n, lv) => {
    stopTimer();
    setLevelNum(n);
    setLevelData(lv);
    levelDataRef.current = lv;
    setPath([]); pathRef.current = [];
    setSolved(false); solvedRef.current = false;
    usedHintThisLevel.current = false;
    setHintCell(null); hintBtnLocked.current = false;
    setShowWin(false); setShowTimeUp(false);
    setExtraTime(0); extraTimeRef.current = 0;
    timerStarted.current = false;
    setTimerSecs(0);
    usedHintThisLevel.current = false;
    setStatus(`Start from 1 · fill all ${lv.size * lv.size} cells`);
    if (n % 10 === 0) preloadLevelBatch(n + 1);
  }, [stopTimer, setStatus]);

  const loadLevel = useCallback((n) => {
    if (levelCache.has(n)) { applyLevelData(n, levelCache.get(n)); }
    else { const lv = generateLevel(n); levelCache.set(n, lv); applyLevelData(n, lv); }
  }, [applyLevelData]);

  const resetLevel = useCallback(() => {
    stopTimer();
    timerStarted.current = false;
    setTimerSecs(0); setExtraTime(0); extraTimeRef.current = 0;
    setPath([]); pathRef.current = [];
    setSolved(false); solvedRef.current = false;
    setHintCell(null); hintBtnLocked.current = false;
    setShowWin(false); setShowTimeUp(false);
    if (levelDataRef.current) {
      setStatus(`Start from 1 · fill all ${levelDataRef.current.size * levelDataRef.current.size} cells`);
    }
  }, [stopTimer, setStatus]);

  const goLevel = useCallback(async (n) => {
    if (n < 1) return;
    const saved = await getSavedLevel();
    if (n > saved) await saveCurrentLevel(n);
    loadLevel(n);
  }, [loadLevel]);

  // ─────────────────────────────────────────────
  // LOAD ON MOUNT
  // ─────────────────────────────────────────────
  useEffect(() => {
    const params = route.params || {};
    (async () => {
      await refreshBalance();
      checkFirstTimeUser();

      if (params.pregenLevelNum && params.pregenLevelData) {
        applyLevelData(params.pregenLevelNum, params.pregenLevelData);
      } else {
        loadLevel(await getSavedLevel());
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hint pulse animation
  useEffect(() => {
    if (hintCell) {
      Animated.loop(Animated.sequence([
        Animated.timing(hintPulse, { toValue: 0.5, duration: 450, useNativeDriver: true }),
        Animated.timing(hintPulse, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])).start();
      const t = setTimeout(() => setHintCell(null), 3500);
      return () => { clearTimeout(t); hintPulse.stopAnimation(); };
    }
  }, [hintCell]);

  const checkFirstTimeUser = async () => {
    try {
      const alreadySeen = await AsyncStorage.getItem('HOW_TO_PLAY_SHOWN');
      if (!alreadySeen) {
        setShowModal(true);
        await AsyncStorage.setItem('HOW_TO_PLAY_SHOWN', 'true');
      }
    } catch (e) { }
  };

  // ─────────────────────────────────────────────
  // WIN DETECTION
  // ─────────────────────────────────────────────
  const checkWin = useCallback((currentPath, lv) => {
    const { size, nodes } = lv;
    const total = size * size;
    if (currentPath.length !== total) return;
    const node1key = `${nodes[0][0]},${nodes[0][1]}`;
    const lastNodeKey = `${nodes[nodes.length - 1][0]},${nodes[nodes.length - 1][1]}`;
    if (currentPath[0] !== node1key || currentPath[total - 1] !== lastNodeKey) return;
    let prev = -1;
    for (const [r, c] of nodes) {
      const idx = currentPath.indexOf(`${r},${c}`);
      if (idx < 0 || idx <= prev) return;
      prev = idx;
    }

    setSolved(true); solvedRef.current = true;
    stopTimer(); setHintCell(null);

    const coinReward = getLevelCoinReward();
    setLevelCoinReward(coinReward);

    (async () => {
      const saved = await getSavedLevel();
      if (levelNum >= saved) await saveCurrentLevel(levelNum + 1);
      // Hint bonus every 5 levels
      if ((levelNum + 1) % 5 === 0) await addHints(1);
      // Award coins
      await addCoins(coinReward);
      try {
        const difficulty = levelNum <= 4 ? 'Easy' : 'Medium';
        const res = await completeLevel(levelNum, timerSecs, usedHintThisLevel.current, difficulty);
        if (res && res.promoted) {
          showToastMsg(res.promotionMsg);
        }
      } catch (e) {
        console.warn('Failed to complete level in profile:', e);
      }
      usedHintThisLevel.current = false;
      await refreshBalance();
    })();

    setTimerSecs(prev => {
      setWinTime(fmtTime(prev));
      return prev;
    });
    const isReward = (levelNum + 1) % 5 === 0;
    setWinSub(
      isReward
        ? `All ${total} cells filled · ${nodes.length} nodes\n💡 Bonus: +1 Hint!`
        : `All ${total} cells filled · ${nodes.length} nodes`,
    );
    setStatus('Level complete! 🎉', 'good');
    setTimeout(() => setShowWin(true), 450);
  }, [levelNum, stopTimer, refreshBalance, setStatus]);

  // ─────────────────────────────────────────────
  // BOARD HELPERS / PAN RESPONDER
  // ─────────────────────────────────────────────
  const canMove = useCallback((r1, c1, r2, c2) => {
    const lv = levelDataRef.current;
    if (!lv) return false;
    const dr = Math.abs(r1 - r2), dc = Math.abs(c1 - c2);
    return dr + dc === 1 && !lv.wallSet.has(wallKey(r1, c1, r2, c2));
  }, []);

  const nextNodeNum = useCallback((currentPath, nodes) => {
    const ps = new Set(currentPath);
    for (let i = 0; i < nodes.length; i++) {
      if (!ps.has(`${nodes[i][0]},${nodes[i][1]}`)) return i + 1;
    }
    return nodes.length + 1;
  }, []);

  const boardLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const getCellFromPoint = useCallback((px, py) => {
    const lv = levelDataRef.current;
    if (!lv) return null;
    const { size } = lv;
    const boardW = size * CELL;
    const scaleX = boardW / boardLayoutRef.current.width;
    const scaleY = boardW / boardLayoutRef.current.height;
    const lx = (px - boardLayoutRef.current.x) * scaleX;
    const ly = (py - boardLayoutRef.current.y) * scaleY;
    const c = Math.floor(lx / CELL), r = Math.floor(ly / CELL);
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    return { r, c };
  }, [CELL]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      if (solvedRef.current) return;
      const { pageX, pageY } = evt.nativeEvent;
      const cell = getCellFromPoint(pageX, pageY);
      if (!cell) return;
      const lv = levelDataRef.current;
      if (!lv) return;
      const { nodes } = lv;
      const key = `${cell.r},${cell.c}`;
      const start = `${nodes[0][0]},${nodes[0][1]}`;
      setHintCell(null);
      ensureTimerRunning();

      if (key === start) {
        const np = [key]; pathRef.current = np; setPath([...np]); draggingRef.current = true; return;
      }
      if (pathRef.current.length === 0) { setStatus('Tap node 1 to start!', 'bad'); return; }
      if (key === pathRef.current[pathRef.current.length - 1]) { draggingRef.current = true; return; }
      const ei = pathRef.current.indexOf(key);
      if (ei !== -1) {
        const np = pathRef.current.slice(0, ei + 1); pathRef.current = np; setPath([...np]); draggingRef.current = true; return;
      }
      draggingRef.current = true;
    },

    onPanResponderMove: (evt) => {
      if (!draggingRef.current || solvedRef.current || pathRef.current.length === 0) return;
      const { pageX, pageY } = evt.nativeEvent;
      const cell = getCellFromPoint(pageX, pageY);
      if (!cell) return;
      const lv = levelDataRef.current;
      if (!lv) return;
      const { nodes } = lv;
      const key = `${cell.r},${cell.c}`;
      const last = pathRef.current[pathRef.current.length - 1];
      if (key === last) return;

      if (pathRef.current.length >= 2 && key === pathRef.current[pathRef.current.length - 2]) {
        const np = pathRef.current.slice(0, -1); pathRef.current = np; setPath([...np]); return;
      }
      const ei = pathRef.current.indexOf(key);
      if (ei !== -1) {
        const np = pathRef.current.slice(0, ei + 1); pathRef.current = np; setPath([...np]); return;
      }
      const [lr, lc] = last.split(',').map(Number);
      if (!canMove(lr, lc, cell.r, cell.c)) return;
      const ni = nodes.findIndex(([r, c]) => r === cell.r && c === cell.c);
      if (ni !== -1) {
        const expected = nextNodeNum(pathRef.current, nodes) - 1;
        if (ni !== expected) { setStatus(`Reach node ${expected + 1} before node ${ni + 1}!`, 'bad'); return; }
      }
      const np = [...pathRef.current, key]; pathRef.current = np; setPath([...np]);
      checkWin(np, lv);
    },

    onPanResponderRelease: () => { draggingRef.current = false; },
  }), [getCellFromPoint, canMove, nextNodeNum, checkWin, setStatus, ensureTimerRunning]);

  // ─────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────
  const pathSet = useMemo(() => new Set(path), [path]);

  const statusDisplay = useMemo(() => {
    if (!levelData) return '';
    const { size, nodes } = levelData;
    const total = size * size;
    if (solved) return statusMsg;
    if (path.length === 0) return `Start from 1 · fill all ${total} cells`;
    const nxt = nextNodeNum(path, nodes);
    if (nxt <= nodes.length) return `Next: node ${nxt} · ${path.length}/${total} cells filled`;
    return `All nodes done! Keep filling — ${path.length}/${total}`;
  }, [path, solved, levelData, statusMsg, nextNodeNum]);

  // ─────────────────────────────────────────────
  // HINT
  // ─────────────────────────────────────────────
  const useHintAction = useCallback(async () => {
    if (hintBtnLocked.current || solvedRef.current) return;

    // If out of hints, show a rewarded ad to earn one
    if (hints <= 0) {
      setAdLoading(true);
      hintBtnLocked.current = true;
      const rewarded = await AdManager.showAd('rewarded', async () => {
        await addHints(1);
        await refreshBalance();
        showToastMsg('💡 +1 Hint earned!');
      });
      setAdLoading(false);
      hintBtnLocked.current = false;
      if (!rewarded) showToastMsg('Ad not available — try again later.');
      return;
    }

    hintBtnLocked.current = true;
    setHintCell(null);
    const lv = levelDataRef.current;
    if (!lv) return;
    const { solution } = lv;

    if (pathRef.current.length === 0) {
      const [r, c] = solution[0].split(',').map(Number);
      const ok = await spendHint();
      if (ok) {
        await refreshBalance();
        setHintCell({ r, c });
        setStatus('Hint used · start at node 1');
      }
      setTimeout(() => { hintBtnLocked.current = false; }, 200);
      return;
    }

    const lastCell = pathRef.current[pathRef.current.length - 1];
    let solIdx = -1;
    for (let i = 0; i < solution.length; i++) {
      if (solution[i] !== lastCell) continue;
      let match = true;
      const checkLen = Math.min(pathRef.current.length, i + 1);
      for (let j = 0; j < checkLen; j++) {
        if (pathRef.current[pathRef.current.length - checkLen + j] !== solution[i - checkLen + 1 + j]) {
          match = false; break;
        }
      }
      if (match) { solIdx = i; break; }
    }
    if (solIdx === -1) solIdx = solution.lastIndexOf(lastCell);

    if (solIdx === -1) {
      setStatus('Path diverged — Reset then use Hint.', 'bad');
      hintBtnLocked.current = false;
      return;
    }
    if (solIdx >= solution.length - 1) {
      setStatus("You're at the last cell!", 'good');
      hintBtnLocked.current = false;
      return;
    }

    const nextKey = solution[solIdx + 1];
    const [r, c] = nextKey.split(',').map(Number);
    const ok = await spendHint();
    if (ok) {
      usedHintThisLevel.current = true;
      try { await incrementMissionProgress('hints', 1); } catch (e) { }
      await refreshBalance();
      setHintCell({ r, c });
      setStatus(`Hint used · row ${r + 1}, col ${c + 1}`);
    }
    setTimeout(() => { hintBtnLocked.current = false; }, 200);
  }, [hints, refreshBalance, setStatus, showToastMsg]);

  // ─────────────────────────────────────────────
  // SKIP  →  Rewarded Interstitial
  // ─────────────────────────────────────────────
  const triggerSkip = useCallback(async () => {
    setAdLoading(true);
    const rewarded = await AdManager.showAd('interReward', async () => {
      await goLevel(levelNum + 1);
      showToastMsg('Level skipped!');
    });
    setAdLoading(false);

    if (!rewarded) {
      skipTimersRef.current.forEach(clearTimeout);
      skipTimersRef.current = [];
      setSkipCount(5);
      setShowSkip(true);
      let count = 5;
      function tick() {
        count--;
        if (count > 0) {
          setSkipCount(count);
          skipTimersRef.current.push(setTimeout(tick, 1000));
        } else {
          setShowSkip(false);
          goLevel(levelNum + 1);
        }
      }
      skipTimersRef.current.push(setTimeout(tick, 1000));
    }
  }, [levelNum, goLevel, showToastMsg]);

  const cancelSkip = useCallback(() => {
    skipTimersRef.current.forEach(clearTimeout);
    setShowSkip(false);
  }, []);

  // ─────────────────────────────────────────────
  // UNDO
  // ─────────────────────────────────────────────
  const undoStep = useCallback(() => {
    if (pathRef.current.length === 0) return;
    setHintCell(null);
    const np = pathRef.current.slice(0, -1);
    pathRef.current = np; setPath([...np]);
  }, []);

  // ─────────────────────────────────────────────
  // WIN MODAL BUTTONS
  // ─────────────────────────────────────────────
  const handleRetry = useCallback(async () => {
    setShowWin(false);
    resetLevel();
  }, [resetLevel]);

  const handleNext = useCallback(async () => {
    setShowWin(false);
    const nextLevel = levelNum + 1;
    if (nextLevel % 3 === 0) {
      setAdLoading(true);
      await AdManager.showAd('inter');
      setAdLoading(false);
    }
    goLevel(nextLevel);
  }, [levelNum, goLevel]);

  // 2x Coins — rewarded ad
  const handle2xCoins = useCallback(async () => {
    setAdLoading(true);
    const rewarded = await AdManager.showAd('rewarded', async () => {
      await addCoins(levelCoinReward); // add the same amount again = 2x total
      await refreshBalance();
      showToastMsg(`🪙 ×2 Coins! +${levelCoinReward} extra!`);
    });
    setAdLoading(false);
    if (!rewarded) {
      showToastMsg('Ad not available — try again later.');
    }
    setShowWin(false);
    goLevel(levelNum + 1);
  }, [levelNum, levelCoinReward, goLevel, refreshBalance, showToastMsg]);

  // ─────────────────────────────────────────────
  // TIME UP MODAL BUTTONS
  // ─────────────────────────────────────────────
  const handleTimeUpRetry = useCallback(async () => {
    setShowTimeUp(false);
    resetLevel();
  }, [resetLevel]);

  const handleWatchForTime = useCallback(async () => {
    setShowTimeUp(false);
    setAdLoading(true);
    const rewarded = await AdManager.showAd('rewarded', () => {
      setExtraTime(prev => {
        const next = prev + 15;
        extraTimeRef.current = next;
        return next;
      });
      resumeTimer();
      showToastMsg('⏱ +15 seconds added!');
    });
    setAdLoading(false);

    if (!rewarded) {
      showToastMsg('Ad not available — try again later.');
      setShowTimeUp(true);
    }
  }, [resumeTimer, showToastMsg]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (!levelData) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.muted} size="large" />
        <Text style={{ color: theme.muted, marginTop: 5, textAlign: 'center' }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const { size, nodes, wallSet } = levelData;
  const BOARD_W = size * CELL;

  const pathPoints = path.map(k => {
    const [r, c] = k.split(',').map(Number);
    return `${c * CELL + CELL / 2},${r * CELL + CELL / 2}`;
  }).join(' ');

  const wallSegments = [];
  wallSet.forEach(wk => {
    const [a, b] = wk.split('|');
    const [r1, c1] = a.split(',').map(Number);
    const [r2, c2] = b.split(',').map(Number);
    let x1, y1, x2, y2;
    if (r1 === r2) {
      const cc = Math.max(c1, c2); x1 = x2 = cc * CELL; y1 = r1 * CELL + 4; y2 = (r1 + 1) * CELL - 4;
    } else {
      const rr = Math.max(r1, r2); y1 = y2 = rr * CELL; x1 = c1 * CELL + 4; x2 = (c1 + 1) * CELL - 4;
    }
    wallSegments.push({ x1, y1, x2, y2, key: wk });
  });

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* ── Ad loading overlay ── */}
      {adLoading && (
        <View style={s.adOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={s.adOverlayText}>Loading Ad…</Text>
        </View>
      )}

      {/* ── Top bar ── */}
      <View style={s.topbar}>
        <TouchableOpacity style={s.navBtn} onPress={() =>
          navigation.goBack()
        }>
          <Text style={s.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.timer}>⏱ {fmtTime(timerSecs)}</Text>
        <View style={s.levelBadge}>
          <Text style={s.levelBadgeText}>Level {levelNum}</Text>
        </View>
        {/* Balance chips */}
        <View style={s.balChip}>
          <Text style={s.balChipText}>🪙{coins}</Text>
        </View>
        {/* <View style={s.balChip}>
          <Text style={s.balChipText}>💡{hints}</Text>
        </View> */}
        {/* <TouchableOpacity style={s.navBtn} onPress={handleRetry}>
          <Text style={s.navBtnText}>↺</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={s.navBtn} onPress={() => setShowModal(true)}>
          <Text style={s.navBtnText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* ── Board area ── */}
      <View style={s.boardArea}>
        <View style={[s.boardOuter, { width: BOARD_W + 28, padding: 14 }]}>
          <View
            style={{ width: BOARD_W, height: BOARD_W, position: 'relative' }}
            onLayout={(e) => {
              e.target.measure((fx, fy, w, h, px, py) => {
                boardLayoutRef.current = { x: px, y: py, width: w, height: h };
              });
            }}
            {...panResponder.panHandlers}
          >
            <Svg width={BOARD_W} height={BOARD_W} style={StyleSheet.absoluteFill} pointerEvents="none">
              {Array.from({ length: size + 1 }, (_, i) => (
                <G key={`grid-${i}`}>
                  <Line x1={0} y1={i * CELL} x2={BOARD_W} y2={i * CELL} stroke={theme.border} strokeWidth={1} />
                  <Line x1={i * CELL} y1={0} x2={i * CELL} y2={BOARD_W} stroke={theme.border} strokeWidth={1} />
                </G>
              ))}
              {wallSegments.map(w => (
                <Line key={w.key} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                  stroke={theme.text} strokeWidth={5} strokeLinecap="round" />
              ))}
              {path.length >= 2 && (
                <>
                  <Polyline points={pathPoints} fill="none"
                    stroke={theme.primaryLight} strokeWidth={CELL * 0.28}
                    strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
                  <Polyline points={pathPoints} fill="none"
                    stroke={theme.primary} strokeWidth={CELL * 0.13}
                    strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
            </Svg>

            {Array.from({ length: size }, (_, r) =>
              Array.from({ length: size }, (_, c) => (
                <View key={`cell-${r}-${c}`} pointerEvents="none" style={{
                  position: 'absolute', left: c * CELL + 1, top: r * CELL + 1,
                  width: CELL - 2, height: CELL - 2, borderRadius: 4,
                  backgroundColor: pathSet.has(`${r},${c}`) ? theme.accentGlow : 'transparent',
                }} />
              ))
            )}

            {hintCell && (
              <Animated.View pointerEvents="none" style={{
                position: 'absolute',
                left: hintCell.c * CELL + 4, top: hintCell.r * CELL + 4,
                width: CELL - 8, height: CELL - 8, borderRadius: 6,
                backgroundColor: 'rgba(251,191,36,0.25)',
                borderWidth: 2.5, borderColor: warn,
                opacity: hintPulse, transform: [{ scale: hintPulse }],
              }} />
            )}

            {nodes.map(([r, c], i) => {
              const reached = pathSet.has(`${r},${c}`);
              const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
              return (
                <View key={`node-${i}`} pointerEvents="none" style={{
                  position: 'absolute', left: cx - 17, top: cy - 17,
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: reached ? theme.primary : theme.surfaceRaised,
                  borderWidth: 2, borderColor: reached ? theme.primary : theme.border,
                  alignItems: 'center', justifyContent: 'center', zIndex: 10,
                  transform: [{ scale: reached ? 1.07 : 1 }],
                  shadowColor: reached ? theme.primary : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: reached ? 0.5 : 0.3,
                  shadowRadius: 4, elevation: 5,
                }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{i + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <Text style={[s.status, statusType === 'bad' && s.statusBad, statusType === 'good' && s.statusGood]}>
          {statusDisplay}
        </Text>
      </View>

      {/* ── Bottom bar ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.actionBtn]}
          onPress={handleRetry}>
          <Text style={s.navBtnText}>↺</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={s.navBtn} onPress={handleRetry}>
          <Text style={s.navBtnText}>↺</Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity
          style={[s.actionBtn, path.length === 0 && s.actionBtnDisabled]}
          onPress={undoStep} disabled={path.length === 0}>
          <Text style={s.actionBtnText}>Undo</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[s.actionBtn, s.actionBtnPrimary, adLoading && s.actionBtnDisabled]}
          onPress={useHintAction} disabled={adLoading}>
          <Text style={s.actionBtnTextPrimary}>Hint </Text>
          <View style={[s.hintBadge, hints === 0 && s.hintBadgeEmpty]}>
            <Text style={s.hintBadgeText}>{hints > 999 ? '999+' : hints}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, s.skipBtn, adLoading && s.actionBtnDisabled]}
          onPress={triggerSkip} disabled={adLoading}>
          <Text style={[s.actionBtnText, { color: theme.muted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ══ WIN MODAL ══ */}
      <Modal visible={showWin} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>🎉</Text>
            <Text style={s.modalTitle}>Level Complete!</Text>
            <Text style={s.modalSub}>{winSub}</Text>
            <Text style={s.winTime}>{winTime}</Text>

            {/* Coin reward earned */}
            <View style={s.coinRewardBadge}>
              <Text style={s.coinRewardText}>🪙 +{levelCoinReward} Coins Earned!</Text>
            </View>

            {(() => {
              const remaining = 5 - ((levelNum + 1) % 5 || 5);
              const isReward = (levelNum + 1) % 5 === 0;
              return (
                <View style={s.hintRewardTag}>
                  <Text style={s.hintRewardText}>
                    {isReward
                      ? '💡 +1 Hint earned!'
                      : `${remaining} more level${remaining > 1 ? 's' : ''} for a hint`}
                  </Text>
                </View>
              );
            })()}

            <View style={s.modalActions}>
              {/* Retry → Interstitial */}
              <TouchableOpacity style={[s.mbtn, s.mbtnGhost]} onPress={handleRetry}>
                <Text style={s.mbtnTextLight}>↺ Retry</Text>
              </TouchableOpacity>
              {/* Next → Interstitial */}
              <TouchableOpacity style={[s.mbtn, s.mbtnAccent]} onPress={handleNext}>
                <Text style={s.mbtnTextLight}>Next →</Text>
              </TouchableOpacity>
            </View>

            {/* 2x Coins rewarded ad */}
            <TouchableOpacity
              style={[s.mbtn, s.mbtn2x, { marginTop: 8, marginBottom: 25 }]}
              onPress={handle2xCoins}
              disabled={adLoading}
              activeOpacity={0.85}
            >
              <Text
                style={s.mbtn2xText}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                📺 Watch Ad · 2× Coins (+{levelCoinReward})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ TIME UP MODAL ══ */}
      <Modal visible={showTimeUp} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>⏰</Text>
            <Text style={s.modalTitle}>Time's Up!</Text>
            <Text style={s.modalSub}>Your time has run out</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.mbtn, s.mbtnGhost, { width: 70 }]} onPress={handleTimeUpRetry}>
                <Text style={s.mbtnTextLight}>↺ Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mbtn, s.mbtnAccent]} onPress={handleWatchForTime}>
                <Text style={s.mbtnTextLight}>📺 Watch Ad +15s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ SKIP COUNTDOWN MODAL ══ */}
      <Modal visible={showSkip} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>⏭️</Text>
            <Text style={s.modalTitle}>Skipping Level</Text>
            <Text style={s.modalSub}>Skipping this level</Text>
            <View style={s.skipCountWrap}>
              <Text style={s.skipNum}>{skipCount}</Text>
            </View>
            <Text style={s.modalSub}>Continuing automatically…</Text>
            <TouchableOpacity style={[s.mbtn, s.mbtnGhost, { marginTop: 16 }]} onPress={cancelSkip}>
              <Text style={s.mbtnTextLight}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ How To Play Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={s.htpOverlay}>
          <View style={s.htpBox}>
            <Text style={s.modalTitle}>How to Play</Text>
            <Video
              source={require('../assets/howitwork.mp4')}
              style={s.video}
              muted={true}
              controls={false}
              resizeMode="contain"
              repeat={true}
              paused={paused}
            />
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowModal(false)}>
              <Text style={{ color: '#000', fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Toast ── */}
      <Animated.View style={[s.toast, { opacity: toastOpacity }]}>
        <Text style={s.toastText}>{toast}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const getStyles = (theme) => {
  const good = theme.good || '#34d399';
  const warn = theme.warn || '#fbbf24';
  const bad = theme.bad || '#f87171';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    adOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10,18,26,0.75)',
      alignItems: 'center', justifyContent: 'center', zIndex: 999,
    },
    adOverlayText: { color: theme.muted, marginTop: 12, fontSize: 14 },
    topbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 10,
      gap: 8, justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    timer: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 13, color: theme.muted,
    },
    levelBadge: {
      borderWidth: 1.5, borderColor: theme.border, borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4, backgroundColor: theme.surfaceRaised,
    },
    levelBadgeText: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 11, color: theme.text, fontWeight: '600',
    },
    balChip: {
      backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border,
      borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4,
    },
    balChipText: { fontSize: 11, fontWeight: '700', color: theme.text },
    navBtn: {
      width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
      borderColor: theme.border, backgroundColor: theme.surfaceRaised,
      alignItems: 'center', justifyContent: 'center',
    },
    navBtnText: { fontSize: 16, color: theme.text, lineHeight: 20 },
    boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    boardOuter: {
      backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border,
      borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    status: {
      marginTop: 12, fontSize: 12, color: theme.muted,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      textAlign: 'center', paddingHorizontal: 16,
    },
    statusBad: { color: bad },
    statusGood: { color: good },
    bottomBar: {
      flexDirection: 'row', gap: 10, paddingVertical: 14, paddingHorizontal: 16,
      borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background,
    },
    actionBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 40, borderWidth: 1.5,
      borderColor: theme.border, backgroundColor: theme.surfaceRaised,
      alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    },
    actionBtnDisabled: { opacity: 0.35 },
    actionBtnPrimary: { backgroundColor: theme.primary, borderColor: theme.primary },
    skipBtn: { flex: 0.7 },
    actionBtnText: { fontSize: 14, fontWeight: '500', color: theme.text },
    actionBtnTextPrimary: { fontSize: 14, fontWeight: '500', color: theme.background },
    hintBadge: {
      backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10,
      paddingHorizontal: 5, paddingVertical: 1, minWidth: 22, alignItems: 'center',
    },
    hintBadgeEmpty: { opacity: 0.6 },
    hintBadgeText: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 12, color: theme.background, fontWeight: '600',
    },
    overlay: {
      flex: 1, backgroundColor: theme.overlay || 'rgba(10,18,26,0.88)',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    },
    modalCard: {
      backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border,
      borderRadius: 24, padding: 24, width: '100%', maxWidth: 380,
      shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
    },
    modalEmoji: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
    modalTitle: { fontWeight: '700', fontSize: 20, color: theme.text, textAlign: 'center', marginBottom: 4 },
    modalSub: { color: theme.muted, fontSize: 13, textAlign: 'center' },
    winTime: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 16, color: theme.primary, textAlign: 'center', marginVertical: 6,
    },
    coinRewardBadge: {
      alignSelf: 'center', backgroundColor: 'rgba(251,191,36,0.15)',
      borderWidth: 1.5, borderColor: warn, borderRadius: 20,
      paddingHorizontal: 16, paddingVertical: 6, marginTop: 6, marginBottom: 4,
    },
    coinRewardText: { color: warn, fontWeight: '800', fontSize: 15 },
    hintRewardTag: {
      alignSelf: 'center', backgroundColor: 'rgba(52,211,153,0.12)',
      borderWidth: 1.5, borderColor: good, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 4, marginTop: 6, marginBottom: 14,
    },
    hintRewardText: { color: good, fontWeight: '700', fontSize: 12 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    mbtn: {
      flex: 1, paddingVertical: 13, borderRadius: 40,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: theme.border,
    },
    mbtnGhost: { backgroundColor: theme.surfaceRaised },
    mbtnAccent: { backgroundColor: theme.primary, borderColor: theme.primary },
    mbtn2x: {
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderColor: warn,
      borderWidth: 1.5,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },

    mbtn2xText: {
      color: warn,
      fontWeight: '800',
      fontSize: 14,
      textAlign: 'center',
      flexShrink: 1,
    },
    mbtnTextLight: { fontSize: 14, fontWeight: '600', color: theme.text },
    skipCountWrap: {
      width: 72, height: 72, borderRadius: 36,
      borderWidth: 3.5, borderColor: '#f97316',
      backgroundColor: 'rgba(249,115,22,0.1)',
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center', marginVertical: 16,
    },
    skipNum: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 28, fontWeight: '500', color: '#fb923c',
    },
    htpOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center', alignItems: 'center',
    },
    htpBox: {
      width: '90%', backgroundColor: theme.surface,
      borderRadius: 10, padding: 10,
    },
    video: { width: '100%', height: 200, borderRadius: 15, overflow: 'hidden' },
    closeBtn: {
      marginTop: 10, backgroundColor: theme.primary,
      padding: 10, alignItems: 'center', borderRadius: 5,
    },
    toast: {
      position: 'absolute', bottom: 80, alignSelf: 'center',
      backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border,
      borderRadius: 40, paddingHorizontal: 22, paddingVertical: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
    },
    toastText: { color: theme.text, fontSize: 13, fontWeight: '500' },
  });
};