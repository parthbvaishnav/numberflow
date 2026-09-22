/**
 * ZipGameScreen.jsx — High-Performance & Theme-Adaptive Puzzle Screen
 *
 * • 60-120 FPS Gesture Response: Static PanResponder with zero re-creation during drag
 * • High Contrast & Crisp Visibility: Beautiful HUD, laser barriers, glowing neon path
 * • Celebratory Level Complete & Time's Up Modals with Gold Coin Rewards
 * • Coin Shop Modal integration directly on coin pill tap
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  completeLevel, incrementMissionProgress,
} from '../utils/ProfileManager';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Dimensions, PanResponder, Animated,
  Platform, StatusBar, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Line, Polyline, G, Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateLevel, wallKey, preloadLevelBatch, levelCache } from '../utils/levelGenerator';
import { useTheme } from '../constants/theme';
import AdManager from '../ads/AdManager';
import Video from 'react-native-video';
import {
  getCoins, addCoins, getHints, addHints, spendHint, getLevelCoinReward,
} from '../utils/CoinManager';
import CoinShopModal from '../components/CoinShopModal';

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const BackArrowIcon = ({ color = '#fff' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ReloadIcon = ({ color = '#fff' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4v5h5M20 20v-5h-5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.49 9A9 9 0 005.64 5.64L4 9m16 6l-1.64 3.36A9 9 0 013.51 15"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SkipIcon = ({ color = '#fff' }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 4l10 8-10 8V4zM19 5v14"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LS = {
  LEVEL: 'zipCurrentLevel',
};

const MAX_TIME = 20;

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
  const s = useMemo(() => getStyles(theme), [theme]);
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

  // ── Coins, Hints & Shop ──
  const [coins, setCoinsState] = useState(0);
  const [hints, setHintsState] = useState(0);
  const [showShop, setShowShop] = useState(false);
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

  // ── Drag & Board layout refs ──
  const pathRef = useRef([]);
  const draggingRef = useRef(false);
  const solvedRef = useRef(false);
  const levelDataRef = useRef(null);
  const boardLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const boardViewRef = useRef(null);

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
      }, 2200);
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    setStatus('Time is up! ⏰', 'bad');
    // 🎯 Intent-Based Preload: User will likely tap "+15s Extra Time" button
    AdManager.preloadAd('rewarded');
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

  const goLevel = useCallback(async (n) => {
    await saveCurrentLevel(n);
    loadLevel(n);
  }, [loadLevel]);

  const resetLevel = useCallback(() => {
    if (levelDataRef.current) applyLevelData(levelNum, levelDataRef.current);
  }, [levelNum, applyLevelData]);

  // ─────────────────────────────────────────────
  // MOUNT
  // ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await refreshBalance();
      const params = route.params || {};
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
  }, [hintCell, hintPulse]);

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
    // 🎯 Intent-Based Preload (Golden Rules 3 & 4):
    // 1. Preload Rewarded Ad for the "2x Coins" button on Win Modal
    AdManager.preloadAd('rewarded');
    // 2. Preload Interstitial if next level is a multiple of 3
    if ((levelNum + 1) % 3 === 0) {
      AdManager.preloadAd('inter');
    }
    setTimeout(() => setShowWin(true), 400);
  }, [levelNum, timerSecs, stopTimer, refreshBalance, setStatus, showToastMsg]);

  // ─────────────────────────────────────────────
  // BOARD HELPERS & ULTRA-SMOOTH PAN RESPONDER
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

  const getCellFromPoint = useCallback((px, py) => {
    const lv = levelDataRef.current;
    if (!lv) return null;
    const { size } = lv;
    const boardW = size * CELL;
    const bw = boardLayoutRef.current.width || boardW;
    const bh = boardLayoutRef.current.height || boardW;
    const scaleX = boardW / bw;
    const scaleY = boardW / bh;
    const lx = (px - boardLayoutRef.current.x) * scaleX;
    const ly = (py - boardLayoutRef.current.y) * scaleY;
    const c = Math.floor(lx / CELL);
    const r = Math.floor(ly / CELL);
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    return { r, c };
  }, [CELL]);

  // Keep references fresh so PanResponder NEVER needs to be recreated
  const canMoveRef = useRef(canMove);
  canMoveRef.current = canMove;
  const nextNodeNumRef = useRef(nextNodeNum);
  nextNodeNumRef.current = nextNodeNum;
  const checkWinRef = useRef(checkWin);
  checkWinRef.current = checkWin;
  const setStatusRef = useRef(setStatus);
  setStatusRef.current = setStatus;
  const ensureTimerRunningRef = useRef(ensureTimerRunning);
  ensureTimerRunningRef.current = ensureTimerRunning;
  const getCellFromPointRef = useRef(getCellFromPoint);
  getCellFromPointRef.current = getCellFromPoint;

  // Single static PanResponder with stepped interpolation for 120 FPS buttery-smooth drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        if (solvedRef.current) return;
        const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
        const lv = levelDataRef.current;
        if (!lv) return;
        const boardW = lv.size * CELL;

        // Auto-calibrate board layout instantly from touch origin
        if (typeof locationX === 'number' && typeof locationY === 'number') {
          boardLayoutRef.current = {
            x: pageX - locationX,
            y: pageY - locationY,
            width: boardW,
            height: boardW,
          };
        }

        const cell = getCellFromPointRef.current(pageX, pageY);
        if (!cell) return;
        const { nodes } = lv;
        const key = `${cell.r},${cell.c}`;
        const start = `${nodes[0][0]},${nodes[0][1]}`;
        setHintCell(null);
        ensureTimerRunningRef.current();

        if (key === start) {
          const np = [key];
          pathRef.current = np;
          setPath(np);
          draggingRef.current = true;
          return;
        }
        if (pathRef.current.length === 0) {
          setStatusRef.current('Tap node 1 to start!', 'bad');
          return;
        }
        if (key === pathRef.current[pathRef.current.length - 1]) {
          draggingRef.current = true;
          return;
        }
        const ei = pathRef.current.indexOf(key);
        if (ei !== -1) {
          const np = pathRef.current.slice(0, ei + 1);
          pathRef.current = np;
          setPath(np);
          draggingRef.current = true;
          return;
        }
        draggingRef.current = true;
      },

      onPanResponderMove: (evt) => {
        if (!draggingRef.current || solvedRef.current || pathRef.current.length === 0) return;
        const { pageX, pageY } = evt.nativeEvent;
        const cell = getCellFromPointRef.current(pageX, pageY);
        if (!cell) return;
        const lv = levelDataRef.current;
        if (!lv) return;
        const { nodes } = lv;
        const key = `${cell.r},${cell.c}`;
        const last = pathRef.current[pathRef.current.length - 1];
        if (key === last) return;

        // Instant backtrack on re-touching any visited cell
        const ei = pathRef.current.indexOf(key);
        if (ei !== -1) {
          const np = pathRef.current.slice(0, ei + 1);
          pathRef.current = np;
          setPath(np);
          return;
        }

        // Stepped interpolation: when swiping fast, touch frames skip cells.
        // Step cell-by-cell towards the target point so lines NEVER get dropped or stuck!
        const [lastR, lastC] = last.split(',').map(Number);
        let curR = lastR;
        let curC = lastC;
        let currentPath = [...pathRef.current];
        let didAdvance = false;

        for (let step = 0; step < 12; step++) {
          if (curR === cell.r && curC === cell.c) break;

          const dr = cell.r - curR;
          const dc = cell.c - curC;
          const stepR = dr === 0 ? 0 : (dr > 0 ? 1 : -1);
          const stepC = dc === 0 ? 0 : (dc > 0 ? 1 : -1);

          // Prioritize axis with larger remaining distance
          const tryVerticalFirst = Math.abs(dr) >= Math.abs(dc);
          const candidates = tryVerticalFirst
            ? [
                { r: curR + stepR, c: curC },
                { r: curR, c: curC + stepC },
              ]
            : [
                { r: curR, c: curC + stepC },
                { r: curR + stepR, c: curC },
              ];

          let stepSuccess = false;
          for (const cand of candidates) {
            if (cand.r === curR && cand.c === curC) continue;
            if (!canMoveRef.current(curR, curC, cand.r, cand.c)) continue;

            const nextKey = `${cand.r},${cand.c}`;
            const backIdx = currentPath.indexOf(nextKey);
            if (backIdx !== -1) {
              if (backIdx === currentPath.length - 2) {
                currentPath.pop();
                curR = cand.r;
                curC = cand.c;
                stepSuccess = true;
                didAdvance = true;
                break;
              }
              continue;
            }

            const ni = nodes.findIndex(([r, c]) => r === cand.r && c === cand.c);
            if (ni !== -1) {
              const expected = nextNodeNumRef.current(currentPath, nodes) - 1;
              if (ni !== expected) {
                setStatusRef.current(`Reach node ${expected + 1} before node ${ni + 1}!`, 'bad');
                step = 12;
                break;
              }
            }

            currentPath.push(nextKey);
            curR = cand.r;
            curC = cand.c;
            stepSuccess = true;
            didAdvance = true;
            break;
          }

          if (!stepSuccess) break;
        }

        if (didAdvance) {
          pathRef.current = currentPath;
          setPath(currentPath);
          checkWinRef.current(currentPath, lv);
        }
      },

      onPanResponderRelease: () => { draggingRef.current = false; },
      onPanResponderTerminate: () => { draggingRef.current = false; },
    })
  ).current;

  // ─────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────
  const pathSet = useMemo(() => new Set(path), [path]);

  const currentNextNode = useMemo(() => {
    if (!levelData) return 1;
    return nextNodeNum(path, levelData.nodes);
  }, [path, levelData, nextNodeNum]);

  const statusDisplay = useMemo(() => {
    if (!levelData) return '';
    const { size, nodes } = levelData;
    const total = size * size;
    if (solved) return statusMsg;
    if (path.length === 0) return `Connect 1 ➔ 2 ➔ 3 • Fill all ${total} cells`;
    const nxt = nextNodeNum(path, nodes);
    if (nxt <= nodes.length) return `Next: Node ${nxt} • ${total - path.length} cells remaining`;
    return `All nodes reached! Fill remaining ${total - path.length} cells`;
  }, [path, solved, levelData, statusMsg, nextNodeNum]);

  // ─────────────────────────────────────────────
  // HINT
  // ─────────────────────────────────────────────
  const useHintAction = useCallback(async () => {
    if (hintBtnLocked.current || solvedRef.current) return;

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

      // 🎯 Preload Rewarded Ad if player runs out of hints
      if (hints - 1 <= 0) {
        AdManager.preloadAd('rewarded');
      }
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

  const handle2xCoins = useCallback(async () => {
    setAdLoading(true);
    const rewarded = await AdManager.showAd('rewarded', async () => {
      await addCoins(levelCoinReward);
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
    const rewarded = await AdManager.showAd('rewarded', async () => {
      setExtraTime(prev => prev + 15);
      showToastMsg('⏱ +15 seconds added!');
      resumeTimer();
    });
    setAdLoading(false);
    if (!rewarded) {
      showToastMsg('Ad not available.');
      setShowTimeUp(true);
    }
  }, [resumeTimer, showToastMsg]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (!levelData) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={{ color: '#ffffff', marginTop: 8, textAlign: 'center', fontWeight: '700' }}>
          Preparing Level…
        </Text>
      </SafeAreaView>
    );
  }

  const { size, nodes, wallSet } = levelData;
  const BOARD_W = size * CELL;
  const totalCells = size * size;
  const filledCells = path.length;
  const fillPercentage = Math.min(100, Math.round((filledCells / totalCells) * 100));

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
      const cc = Math.max(c1, c2); x1 = x2 = cc * CELL; y1 = r1 * CELL + 3; y2 = (r1 + 1) * CELL - 3;
    } else {
      const rr = Math.max(r1, r2); y1 = y2 = rr * CELL; x1 = c1 * CELL + 3; x2 = (c1 + 1) * CELL - 3;
    }
    wallSegments.push({ x1, y1, x2, y2, key: wk });
  });

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* ── Ad Loading Overlay ── */}
      {adLoading && (
        <View style={s.adOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={s.adOverlayText}>Loading Ad…</Text>
        </View>
      )}

      {/* ── Top HUD Bar ── */}
      <View style={s.topbar}>
        {/* Back Button */}
        <TouchableOpacity
          style={s.hudCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackArrowIcon color={theme.text} />
        </TouchableOpacity>

        {/* Center: Hero Level Badge & Progress */}
        <View style={s.hudLevelCapsule}>
          <View style={s.levelRow}>
            <View style={[s.levelDot, { backgroundColor: theme.primary }]} />
            <Text style={s.levelTitle}>LEVEL {levelNum}</Text>
          </View>
          {/* Micro Progress Track */}
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${fillPercentage}%` },
              ]}
            />
          </View>
        </View>

        {/* Right: Coins Pill + Help */}
        <View style={s.hudRightGroup}>
          <TouchableOpacity
            style={s.hudCoinPill}
            onPress={() => setShowShop(true)}
            activeOpacity={0.75}
          >
            <Text style={s.hudCoinIcon}>🪙</Text>
            <Text style={s.hudCoinText}>{coins}</Text>
            <Text style={s.hudCoinPlus}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.hudCircleBtn}
            onPress={() => setShowModal(true)}
            activeOpacity={0.7}
          >
            <Text style={s.helpIconText}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sub-bar: Timer & Mission Objective ── */}
      <View style={s.subbar}>
        <View style={s.timerPill}>
          <Text style={s.timerIcon}>⏱</Text>
          <Text style={s.timerText}>{fmtTime(timerSecs)}</Text>
        </View>

        <View
          style={[
            s.objectivePill,
            statusType === 'bad' && s.objectivePillBad,
            statusType === 'good' && s.objectivePillGood,
          ]}
        >
          <Text
            style={[
              s.objectiveText,
              statusType === 'bad' && s.objectiveTextBad,
              statusType === 'good' && s.objectiveTextGood,
            ]}
            numberOfLines={1}
          >
            {statusType === 'bad'
              ? `⚠️ ${statusMsg}`
              : statusType === 'good'
              ? `✨ ${statusMsg}`
              : `🎯 ${statusDisplay}`}
          </Text>
        </View>
      </View>

      {/* ── Board Area ── */}
      <View style={s.boardArea}>
        <View style={[s.boardOuter, { width: BOARD_W + 24, padding: 12 }]}>
          <View
            ref={boardViewRef}
            style={{ width: BOARD_W, height: BOARD_W, position: 'relative' }}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              boardViewRef.current?.measure((fx, fy, w, h, px, py) => {
                boardLayoutRef.current = {
                  x: px !== undefined && px > 0 ? px : boardLayoutRef.current.x,
                  y: py !== undefined && py > 0 ? py : boardLayoutRef.current.y,
                  width: w || width || BOARD_W,
                  height: h || height || BOARD_W,
                };
              });
            }}
            {...panResponder.panHandlers}
          >
            {/* Visited Path Highlights (Rendered directly, zero 2D loop overhead) */}
            {path.map((key) => {
              const [r, c] = key.split(',').map(Number);
              return (
                <View
                  key={`visited-${key}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: c * CELL + 2,
                    top: r * CELL + 2,
                    width: CELL - 4,
                    height: CELL - 4,
                    borderRadius: 8,
                    backgroundColor: theme.accentGlow || 'rgba(56, 189, 248, 0.22)',
                  }}
                />
              );
            })}

            {/* SVG: Grid Lines, Laser Barriers, and Neon Flow Path */}
            <Svg width={BOARD_W} height={BOARD_W} style={StyleSheet.absoluteFill} pointerEvents="none">
              {/* Clean Grid Lines */}
              {Array.from({ length: size + 1 }, (_, i) => (
                <G key={`grid-${i}`}>
                  <Line
                    x1={0}
                    y1={i * CELL}
                    x2={BOARD_W}
                    y2={i * CELL}
                    stroke={theme.border || 'rgba(255,255,255,0.09)'}
                    strokeWidth={1}
                  />
                  <Line
                    x1={i * CELL}
                    y1={0}
                    x2={i * CELL}
                    y2={BOARD_W}
                    stroke={theme.border || 'rgba(255,255,255,0.09)'}
                    strokeWidth={1}
                  />
                </G>
              ))}

              {/* Laser Barrier Walls */}
              {wallSegments.map((w) => (
                <G key={w.key}>
                  {/* Outer laser aura */}
                  <Line
                    x1={w.x1}
                    y1={w.y1}
                    x2={w.x2}
                    y2={w.y2}
                    stroke={bad}
                    strokeWidth={6}
                    strokeLinecap="round"
                    opacity={0.35}
                  />
                  {/* Core laser beam */}
                  <Line
                    x1={w.x1}
                    y1={w.y1}
                    x2={w.x2}
                    y2={w.y2}
                    stroke={bad}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  {/* Laser barrier endpoints */}
                  <Circle cx={w.x1} cy={w.y1} r={2.5} fill={bad} />
                  <Circle cx={w.x2} cy={w.y2} r={2.5} fill={bad} />
                </G>
              ))}

              {/* Smooth Dual-Layer Neon Flow Line */}
              {path.length >= 2 && (
                <>
                  {/* Glow Aura */}
                  <Polyline
                    points={pathPoints}
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth={CELL * 0.28}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.4}
                  />
                  {/* Bright Core Line */}
                  <Polyline
                    points={pathPoints}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={CELL * 0.12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </Svg>

            {/* Hint pulsing tile */}
            {hintCell && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: hintCell.c * CELL + 3,
                  top: hintCell.r * CELL + 3,
                  width: CELL - 6,
                  height: CELL - 6,
                  borderRadius: 8,
                  backgroundColor: 'rgba(251,191,36,0.22)',
                  borderWidth: 2,
                  borderColor: warn,
                  opacity: hintPulse,
                  transform: [{ scale: hintPulse }],
                }}
              />
            )}

            {/* Numbered Power Nodes (1, 2, 3 ...) */}
            {nodes.map(([r, c], i) => {
              const nodeNum = i + 1;
              const reached = pathSet.has(`${r},${c}`);
              const isNext = !reached && nodeNum === currentNextNode;
              const cx = c * CELL + CELL / 2;
              const cy = r * CELL + CELL / 2;
              const nodeRadius = 18;

              return (
                <View
                  key={`node-${i}`}
                  pointerEvents="none"
                  style={[
                    s.nodeOrb,
                    {
                      left: cx - nodeRadius,
                      top: cy - nodeRadius,
                      width: nodeRadius * 2,
                      height: nodeRadius * 2,
                      borderRadius: nodeRadius,
                    },
                    reached && s.nodeOrbReached,
                    isNext && s.nodeOrbNext,
                  ]}
                >
                  <Text
                    style={[
                      s.nodeText,
                      reached && s.nodeTextReached,
                      isNext && s.nodeTextNext,
                    ]}
                  >
                    {nodeNum}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Bottom Gaming Control Deck ── */}
      <View style={s.bottomDeck}>
        {/* Restart Button */}
        <TouchableOpacity
          style={s.controlCircleBtn}
          onPress={handleRetry}
          activeOpacity={0.75}
        >
          <ReloadIcon color={theme.text} />
        </TouchableOpacity>

        {/* Hero Hint Button */}
        <TouchableOpacity
          style={[s.hintHeroBtn, adLoading && s.btnDisabled]}
          onPress={useHintAction}
          disabled={adLoading}
          activeOpacity={0.85}
        >
          <Text style={s.hintHeroIcon}>💡</Text>
          <Text style={s.hintHeroText}>HINT</Text>
          <View style={s.hintCountBadge}>
            <Text style={s.hintCountText}>
              {hints > 0 ? (hints > 999 ? '999+' : hints) : '+1 📺'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={[s.skipBtn, adLoading && s.btnDisabled]}
          onPress={triggerSkip}
          disabled={adLoading}
          activeOpacity={0.75}
        >
          <SkipIcon color={theme.text} />
          <Text style={s.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ══ WIN CELEBRATION MODAL ══ */}
      <Modal visible={showWin} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            {/* Header Laurel & Crest */}
            <View style={s.victoryCrest}>
              <Text style={s.victoryCrestEmoji}>🏆</Text>
            </View>

            <Text style={s.modalTitle}>LEVEL COMPLETE!</Text>
            <Text style={s.modalSub}>All cells connected flawlessly</Text>

            {/* Performance Stat Cards */}
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statBoxLabel}>TIME</Text>
                <Text style={s.statBoxValue}>⏱ {winTime}</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statBoxLabel}>COMPLETION</Text>
                <Text style={s.statBoxValue}>✨ 100%</Text>
              </View>
            </View>

            {/* Rewards Section */}
            <View style={s.rewardGroup}>
              <View style={s.coinRewardBadge}>
                <Text style={s.coinRewardText}>🪙 +{levelCoinReward} Coins Earned</Text>
              </View>

              {(() => {
                const remaining = 5 - ((levelNum + 1) % 5 || 5);
                const isReward = (levelNum + 1) % 5 === 0;
                return (
                  <View style={s.hintRewardTag}>
                    <Text style={s.hintRewardText}>
                      {isReward
                        ? '💡 +1 Bonus Hint Unlocked!'
                        : `💡 ${remaining} more level${remaining > 1 ? 's' : ''} to bonus hint`}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* 2x Coins Highlight Rewarded CTA */}
            <TouchableOpacity
              style={s.mbtn2xHero}
              onPress={handle2xCoins}
              disabled={adLoading}
              activeOpacity={0.85}
            >
              <Text style={s.mbtn2xSparkle}>🌟</Text>
              <View style={s.mbtn2xHeroTextWrap}>
                <Text style={s.mbtn2xHeroTitle}>DOUBLE COINS</Text>
                <Text style={s.mbtn2xHeroSub}>Watch quick ad · Get 🪙 +{levelCoinReward * 2}</Text>
              </View>
              <View style={s.mbtn2xHeroBadgeWrap}>
                <Text style={s.mbtn2xHeroBadge}>2X</Text>
              </View>
            </TouchableOpacity>

            {/* Modal Actions */}
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.mbtn, s.mbtnGhost]} onPress={handleRetry} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ReloadIcon color={theme.text || '#ffffff'} />
                  <Text style={s.mbtnTextLight}>Retry</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mbtn, s.mbtnAccent]} onPress={handleNext} activeOpacity={0.85}>
                <Text style={s.mbtnTextAccent}>NEXT LEVEL ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ TIME UP MODAL ══ */}
      <Modal visible={showTimeUp} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <View style={s.timeUpCrest}>
              <Text style={s.timeUpCrestEmoji}>⏰</Text>
            </View>
            <Text style={s.modalTitle}>TIME'S UP!</Text>
            <Text style={s.modalSub}>Don't let the clock stop your run! Add time and keep solving.</Text>

            {/* Extra Time Hero CTA */}
            <TouchableOpacity
              style={s.extraTimeHeroBtn}
              onPress={handleWatchForTime}
              disabled={adLoading}
              activeOpacity={0.85}
            >
              <Text style={s.extraTimeHeroIcon}>📺</Text>
              <View style={{ alignItems: 'center' }}>
                <Text style={s.extraTimeHeroTitle}>ADD +15 SECONDS</Text>
                <Text style={s.extraTimeHeroSub}>Watch short ad & continue playing</Text>
              </View>
            </TouchableOpacity>

            {/* Try Again Button */}
            <TouchableOpacity
              style={s.timeUpRetryBtn}
              onPress={handleTimeUpRetry}
              activeOpacity={0.8}
            >
              <ReloadIcon color={theme.text || '#ffffff'} />
              <Text style={s.timeUpRetryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ SKIP COUNTDOWN MODAL ══ */}
      <Modal visible={showSkip} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>⏭️</Text>
            <Text style={s.modalTitle}>Skipping Level</Text>
            <Text style={s.modalSub}>Preparing next puzzle…</Text>
            <View style={s.skipCountWrap}>
              <Text style={s.skipNum}>{skipCount}</Text>
            </View>
            <Text style={s.modalSub}>Continuing automatically…</Text>
            <TouchableOpacity
              style={[
                s.timeUpRetryBtn,
                { marginTop: 16 },
              ]}
              onPress={cancelSkip}
              activeOpacity={0.8}
            >
              <Text style={s.timeUpRetryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ HOW TO PLAY MODAL ══ */}
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
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowModal(false)} activeOpacity={0.85}>
              <Text style={{ color: '#000000', fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ COIN SHOP MODAL ══ */}
      <CoinShopModal
        visible={showShop}
        onClose={() => setShowShop(false)}
        onUpdate={refreshBalance}
      />

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
  const primary = theme.primary || '#38bdf8';
  const isDark = theme.dark !== false;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    adOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    adOverlayText: { color: '#ffffff', marginTop: 10, fontSize: 14, fontWeight: '700' },

    // ── HUD Top Bar ──
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    hudCircleBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpIconText: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    hudLevelCapsule: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 5,
      alignItems: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 2,
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 3,
    },
    levelDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    levelTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 1,
    },
    progressTrack: {
      width: 72,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.1)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: primary,
      borderRadius: 2,
    },
    hudRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    hudCoinPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 4,
    },
    hudCoinIcon: {
      fontSize: 13,
    },
    hudCoinText: {
      fontSize: 12,
      fontWeight: '800',
      color: warn,
    },
    hudCoinPlus: {
      fontSize: 13,
      fontWeight: '900',
      color: primary,
      marginLeft: 2,
    },

    // ── Sub-bar: Timer & Objective ──
    subbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 6,
      gap: 8,
    },
    timerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 4,
    },
    timerIcon: {
      fontSize: 12,
    },
    timerText: {
      fontSize: 12,
      fontWeight: '800',
      color: warn,
      fontVariant: ['tabular-nums'],
    },
    objectivePill: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      justifyContent: 'center',
    },
    objectivePillBad: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
      borderColor: bad,
    },
    objectivePillGood: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
      borderColor: good,
    },
    objectiveText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.text,
    },
    objectiveTextBad: {
      color: bad,
    },
    objectiveTextGood: {
      color: good,
    },

    // ── Board Area ──
    boardArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    boardOuter: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      borderRadius: 24,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 8,
    },

    // ── Number Power Nodes ──
    nodeOrb: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
      elevation: 4,
    },
    nodeOrbReached: {
      backgroundColor: primary,
      borderColor: '#ffffff',
      borderWidth: 2.5,
      shadowColor: primary,
      shadowOpacity: 0.8,
      shadowRadius: 8,
      elevation: 6,
    },
    nodeOrbNext: {
      backgroundColor: isDark ? 'rgba(251,191,36,0.2)' : 'rgba(217,119,6,0.2)',
      borderColor: warn,
      borderWidth: 2.5,
      shadowColor: warn,
      shadowOpacity: 0.8,
      shadowRadius: 8,
      elevation: 6,
    },
    nodeText: {
      color: theme.text,
      fontWeight: '800',
      fontSize: 13,
    },
    nodeTextReached: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 14,
    },
    nodeTextNext: {
      color: warn,
      fontWeight: '900',
      fontSize: 14,
    },

    // ── Bottom Gaming Control Deck ──
    bottomDeck: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border || 'rgba(255,255,255,0.08)',
      backgroundColor: theme.background,
      gap: 12,
    },
    controlCircleBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    hintHeroBtn: {
      flex: 1,
      maxWidth: 190,
      height: 48,
      borderRadius: 24,
      backgroundColor: primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 5,
    },
    hintHeroIcon: {
      fontSize: 16,
    },
    hintHeroText: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 13,
      letterSpacing: 0.5,
    },
    hintCountBadge: {
      backgroundColor: 'rgba(0,0,0,0.22)',
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    hintCountText: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 11,
    },
    skipBtn: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 24,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    skipBtnText: {
      color: theme.text,
      fontWeight: '800',
      fontSize: 12,
    },
    btnDisabled: {
      opacity: 0.45,
    },

    // ── Modals & Overlays ──
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.88)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    modalCard: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.15)',
      borderRadius: 24,
      padding: 22,
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
    },
    victoryCrest: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderWidth: 2,
      borderColor: warn,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    victoryCrestEmoji: { fontSize: 32 },
    timeUpCrest: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(248,113,113,0.15)',
      borderWidth: 2,
      borderColor: bad,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    timeUpCrestEmoji: { fontSize: 32 },
    modalTitle: {
      fontWeight: '900',
      fontSize: 22,
      color: theme.text,
      textAlign: 'center',
      marginBottom: 4,
      letterSpacing: 1,
    },
    modalSub: {
      color: theme.textSecondary || theme.muted || '#94A3B8',
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 14,
      paddingHorizontal: 8,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginBottom: 12,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255,255,255,0.1)',
      borderRadius: 14,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statBoxLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: theme.muted || '#94A3B8',
      marginBottom: 3,
    },
    statBoxValue: {
      fontSize: 15,
      fontWeight: '900',
      color: theme.text,
    },
    rewardGroup: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    coinRewardBadge: {
      alignSelf: 'center',
      backgroundColor: 'rgba(251,191,36,0.18)',
      borderWidth: 1.5,
      borderColor: warn,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 4,
    },
    coinRewardText: { color: warn, fontWeight: '900', fontSize: 14 },
    hintRewardTag: {
      alignSelf: 'center',
      backgroundColor: 'rgba(52,211,153,0.15)',
      borderWidth: 1.5,
      borderColor: good,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginTop: 4,
    },
    hintRewardText: { color: good, fontWeight: '800', fontSize: 12 },
    mbtn2xHero: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderWidth: 1.5,
      borderColor: warn,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 14,
      gap: 10,
    },
    mbtn2xSparkle: { fontSize: 24 },
    mbtn2xHeroTextWrap: { flex: 1 },
    mbtn2xHeroTitle: {
      color: warn,
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    mbtn2xHeroSub: {
      color: theme.textSecondary || theme.muted || '#94A3B8',
      fontSize: 11,
      fontWeight: '600',
    },
    mbtn2xHeroBadgeWrap: {
      backgroundColor: warn,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    mbtn2xHeroBadge: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 12,
    },
    extraTimeHeroBtn: {
      width: '100%',
      backgroundColor: primary,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 12,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    extraTimeHeroIcon: { fontSize: 22 },
    extraTimeHeroTitle: {
      color: '#000000',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    extraTimeHeroSub: {
      color: 'rgba(0,0,0,0.7)',
      fontSize: 10,
      fontWeight: '700',
    },
    modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
    mbtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mbtnGhost: {
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.12)',
    },
    mbtnAccent: {
      backgroundColor: primary,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    mbtnTextLight: { fontSize: 14, fontWeight: '700', color: theme.text },
    mbtnTextAccent: { fontSize: 14, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },
    timeUpRetryBtn: {
      width: '100%',
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.surfaceRaised || theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.15)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 10,
    },
    timeUpRetryText: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text || '#ffffff',
    },

    skipCountWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 3.5,
      borderColor: warn,
      backgroundColor: 'rgba(251,191,36,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginVertical: 16,
    },
    skipNum: {
      fontSize: 28,
      fontWeight: '900',
      color: warn,
    },
    htpOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    htpBox: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255,255,255,0.1)',
      padding: 16,
    },
    video: { width: '100%', height: 220, borderRadius: 14, overflow: 'hidden', marginVertical: 10 },
    closeBtn: {
      marginTop: 6,
      backgroundColor: primary,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 14,
    },
    toast: {
      position: 'absolute',
      bottom: 80,
      alignSelf: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 40,
      paddingHorizontal: 22,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    toastText: { color: theme.text, fontSize: 13, fontWeight: '600' },
  });
};