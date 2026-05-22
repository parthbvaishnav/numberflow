/**
 * ZipGameScreen.jsx
 *
 * PERFORMANCE FIX: Accepts pre-generated level data via navigation params
 * (pregenLevelNum, pregenLevelData, pregenNextLevelData) from HomeScreen.
 * When params are present, generateLevel() is NOT called on mount — the screen
 * renders instantly. Falls back to on-demand generation if params are absent.
 *
 * TIMER FIX: Timer starts only on first player interaction (tap/drag),
 * not on page load. Timer never resets mid-game.
 *
 * Dependencies:
 *   npx expo install react-native-svg @react-native-async-storage/async-storage
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
  StatusBar,
  SafeAreaView,
  InteractionManager,
} from 'react-native';
import Svg, { Line, Polyline, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateLevel, wallKey } from '../utils/levelGenerator';

// ─────────────────────────────────────────────
// CONSTANTS & THEME
// ─────────────────────────────────────────────
const COLORS = {
  bg:            '#0f1923',
  surface:       '#16212b',
  surfaceRaised: '#1c2d3a',
  border:        '#2a3a4a',
  borderStrong:  '#3a4f63',
  text:          '#f0f6ff',
  textSub:       '#c8dcea',
  muted:         '#6a8fa8',
  accent:        '#4da9ff',
  accentLight:   '#8ecbff',
  accentFill:    'rgba(77,169,255,0.18)',
  good:          '#34d399',
  bad:           '#f87171',
  warn:          '#fbbf24',
  overlay:       'rgba(10,18,26,0.88)',
};

const LS = {
  LEVEL: 'zipCurrentLevel',
  HINTS: 'zipHintsV2',
  BOUGHT: 'zipBoughtV2',
  AD: 'zipAdStateV2',
};

const AD_MAX_PER_DAY = 5;
const AD_COOLDOWN_MS = 60 * 1000;
const AD_DURATION_S = 30;
const MAX_TIME = 30;

// ─────────────────────────────────────────────
// ASYNC STORAGE HELPERS
// ─────────────────────────────────────────────
async function getSavedLevel() {
  try {
    const v = await AsyncStorage.getItem(LS.LEVEL);
    return Math.max(1, parseInt(v || '1', 10));
  } catch { return 1; }
}
async function saveCurrentLevel(n) {
  try { await AsyncStorage.setItem(LS.LEVEL, String(n)); } catch {}
}
async function getHintsStored() {
  try {
    const v = await AsyncStorage.getItem(LS.HINTS);
    return Math.max(0, parseInt(v || '0', 10));
  } catch { return 0; }
}
async function setHintsStored(n) {
  try { await AsyncStorage.setItem(LS.HINTS, String(Math.max(0, n))); } catch {}
}
async function hasEverBought() {
  try { return (await AsyncStorage.getItem(LS.BOUGHT)) === '1'; } catch { return false; }
}
async function markBought() {
  try { await AsyncStorage.setItem(LS.BOUGHT, '1'); } catch {}
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
async function getAdState() {
  try {
    const raw = await AsyncStorage.getItem(LS.AD);
    if (!raw) return { count: 0, lastTime: 0, dayKey: todayKey() };
    const s = JSON.parse(raw);
    if (s.dayKey !== todayKey()) return { count: 0, lastTime: 0, dayKey: todayKey() };
    return s;
  } catch { return { count: 0, lastTime: 0, dayKey: todayKey() }; }
}
async function saveAdState(s) {
  try {
    s.dayKey = todayKey();
    await AsyncStorage.setItem(LS.AD, JSON.stringify(s));
  } catch {}
}

// Cache for pre-generated next levels
const levelCache = new Map();

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ZipGameScreen() {
  const screenWidth = Dimensions.get('window').width;
  const CELL = Math.floor((screenWidth - 48) / 6);
  const navigation = useNavigation();
  const route = useRoute();

  // ── Game state ──
  const [levelNum, setLevelNum] = useState(1);
  const [levelData, setLevelData] = useState(null);
  const [path, setPath] = useState([]);
  const [solved, setSolved] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('');

  // ── Hints ──
  const [hints, setHintsState] = useState(0);
  const [hintCell, setHintCell] = useState(null);
  const hintPulse = useRef(new Animated.Value(1)).current;
  const hintBtnLocked = useRef(false);

  // ── Timer ──
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef(null);
  // Tracks whether the player has touched the board yet this level.
  // Timer only starts on first touch — never auto-starts on load.
  const timerStarted = useRef(false);

  // ── Modals ──
  const [showWin, setShowWin] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [showAd, setShowAd] = useState(false);

  // ── Win modal info ──
  const [winTime, setWinTime] = useState('0:00');
  const [winSub, setWinSub] = useState('');

  // ── Time Modal ──
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [extraTime, setExtraTime] = useState(0);
  // Keep extraTime accessible inside interval callback without stale closure
  const extraTimeRef = useRef(0);
  useEffect(() => { extraTimeRef.current = extraTime; }, [extraTime]);

  // ── Store ──
  const [everBought, setEverBought] = useState(false);
  const [adState, setAdState] = useState({ count: 0, lastTime: 0 });
  const [adCooldownLeft, setAdCooldownLeft] = useState(0);
  const adCooldownRef = useRef(null);

  // ── Ad mock ──
  const [adProgress, setAdProgress] = useState(0);
  const [adTimeLeft, setAdTimeLeft] = useState(AD_DURATION_S);
  const [adCanClose, setAdCanClose] = useState(false);
  const adIntervalRef = useRef(null);

  // ── Skip countdown ──
  const [skipCount, setSkipCount] = useState(5);
  const skipTimersRef = useRef([]);

  // ── Toast ──
  const [toast, setToast] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  // ── Pending time-bonus callback (set when Time Up ad is triggered) ──
  const pendingTimeBonusRef = useRef(null);

  // ── Drag state (refs so PanResponder has fresh values) ──
  const pathRef = useRef([]);
  const draggingRef = useRef(false);
  const solvedRef = useRef(false);
  const levelDataRef = useRef(null);

  useEffect(() => { pathRef.current = path; }, [path]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { levelDataRef.current = levelData; }, [levelData]);

  // ─── Load state on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const params = route.params || {};

    (async () => {
      const savedHints = await getHintsStored();
      const bought = await hasEverBought();
      const ad = await getAdState();
      setHintsState(savedHints);
      setEverBought(bought);
      setAdState(ad);

      if (params.pregenLevelNum && params.pregenLevelData) {
        const n = params.pregenLevelNum;
        const data = params.pregenLevelData;

        if (params.pregenNextLevelData) {
          levelCache.set(n + 1, params.pregenNextLevelData);
        }

        applyLevelData(n, data);
      } else {
        const savedLvl = await getSavedLevel();
        loadLevel(savedLvl);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Hint pulse animation ───
  useEffect(() => {
    if (hintCell) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulse, { toValue: 0.5, duration: 450, useNativeDriver: true }),
          Animated.timing(hintPulse, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]),
      ).start();
      const t = setTimeout(() => setHintCell(null), 3500);
      return () => { clearTimeout(t); hintPulse.stopAnimation(); };
    }
  }, [hintCell]);

  // ─────────────────────────────────────────────
  // HINTS helpers
  // ─────────────────────────────────────────────
  const updateHints = useCallback(async (n) => {
    const safe = Math.max(0, n);
    setHintsState(safe);
    await setHintsStored(safe);
  }, []);

  const addHints = useCallback((n) => {
    setHintsState(prev => {
      const next = prev + n;
      setHintsStored(next);
      return next;
    });
  }, []);

  const spendHintFn = useCallback(() => {
    let spent = false;
    setHintsState(prev => {
      if (prev <= 0) return prev;
      spent = true;
      const next = prev - 1;
      setHintsStored(next);
      return next;
    });
    return spent;
  }, []);

  // ─────────────────────────────────────────────
  // TIMER
  //
  // startTimer()         — starts interval from 0, used only by ensureTimerRunning()
  // stopTimer()          — clears interval (called on win / level change)
  // ensureTimerRunning() — called on first board touch; does nothing if already running
  // startTimerFromCurrent() — resumes from current value after ad bonus (no reset)
  // ─────────────────────────────────────────────

  const handleTimeUp = useCallback(() => {
    setStatus('Time is up! ⏰', 'bad');
    setShowTimeUp(true);
  }, []); // setStatus defined below — forward ref pattern via useRef

  // Keep a stable ref to handleTimeUp so the interval callback never goes stale
  const handleTimeUpRef = useRef(handleTimeUp);
  useEffect(() => { handleTimeUpRef.current = handleTimeUp; }, [handleTimeUp]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Do NOT reset timerSecs here — startTimer is only ever called when
    // timerSecs is already 0 (new level) or when resuming after an ad bonus.
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        const maxAllowed = MAX_TIME + extraTimeRef.current;
        if (prev + 1 >= maxAllowed) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleTimeUpRef.current();
          return maxAllowed;
        }
        return prev + 1;
      });
    }, 1000);
  }, []); // no deps — reads refs, not state

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Called on the very first board touch of a level.
  // Idempotent — safe to call multiple times.
  const ensureTimerRunning = useCallback(() => {
    if (timerStarted.current) return; // already running, do nothing
    timerStarted.current = true;
    startTimer();
  }, [startTimer]);

  // Resume the running interval without resetting the counter.
  // Used after watching an ad to earn +15 seconds.
  const startTimerFromCurrent = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current); // clear old interval
    // timerSecs state is untouched — we just restart the tick
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        const maxAllowed = MAX_TIME + extraTimeRef.current;
        if (prev + 1 >= maxAllowed) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleTimeUpRef.current();
          return maxAllowed;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const finishAdWithTimeBonus = useCallback(async (callback) => {
    clearInterval(adIntervalRef.current);
    setShowAd(false);

    const newState = { ...adState, count: adState.count + 1, lastTime: Date.now() };
    setAdState(newState);
    await saveAdState(newState);

    callback?.(); // caller sets extraTime + calls startTimerFromCurrent
    showToastMsg('⏱ +15 seconds added!');
  }, [adState]); // showToastMsg added below

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

  // Patch handleTimeUp to use the real setStatus (avoids circular dep)
  const handleTimeUpStable = useCallback(() => {
    setStatus('Time is up! ⏰', 'bad');
    setShowTimeUp(true);
  }, [setStatus]);
  useEffect(() => { handleTimeUpRef.current = handleTimeUpStable; }, [handleTimeUpStable]);

  // ─────────────────────────────────────────────
  // APPLY LEVEL DATA
  // NOTE: does NOT call startTimer — timer starts on first board touch
  // ─────────────────────────────────────────────
  const applyLevelData = useCallback((n, lv) => {
    // Stop any running timer from the previous level
    stopTimer();

    setLevelNum(n);
    setLevelData(lv);
    levelDataRef.current = lv;
    setPath([]);
    pathRef.current = [];
    setSolved(false);
    solvedRef.current = false;
    setHintCell(null);
    hintBtnLocked.current = false;
    setShowWin(false);
    setShowTimeUp(false);
    setExtraTime(0);
    extraTimeRef.current = 0;

    // Reset the "timer started" gate — timer will not run until first touch
    timerStarted.current = false;
    setTimerSecs(0);

    setStatus(`Start from 1 · fill all ${lv.size * lv.size} cells`);

    // Pre-generate next level in the background
    const nextN = n + 1;
    if (!levelCache.has(nextN)) {
      InteractionManager.runAfterInteractions(() => {
        levelCache.set(nextN, generateLevel(nextN));
      });
    }
  }, [stopTimer, setStatus]);

  // ─────────────────────────────────────────────
  // LOAD LEVEL
  // ─────────────────────────────────────────────
  const loadLevel = useCallback((n) => {
    if (levelCache.has(n)) {
      applyLevelData(n, levelCache.get(n));
    } else {
      const lv = generateLevel(n);
      levelCache.set(n, lv);
      applyLevelData(n, lv);
    }
  }, [applyLevelData]);

  const resetLevel = useCallback(() => {
    // Stop timer and fully reset it — player must touch to start again
    stopTimer();
    timerStarted.current = false;
    setTimerSecs(0);
    setExtraTime(0);
    extraTimeRef.current = 0;

    setPath([]);
    pathRef.current = [];
    setSolved(false);
    solvedRef.current = false;
    setHintCell(null);
    hintBtnLocked.current = false;
    setShowWin(false);
    setShowTimeUp(false);
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
  // WIN DETECTION
  // ─────────────────────────────────────────────
  const checkWin = useCallback((currentPath, lv) => {
    const { size, nodes } = lv;
    const total = size * size;
    if (currentPath.length !== total) return;

    const node1key = `${nodes[0][0]},${nodes[0][1]}`;
    const lastNodeKey = `${nodes[nodes.length - 1][0]},${nodes[nodes.length - 1][1]}`;
    if (currentPath[0] !== node1key) return;
    if (currentPath[total - 1] !== lastNodeKey) return;

    let prev = -1;
    for (const [r, c] of nodes) {
      const idx = currentPath.indexOf(`${r},${c}`);
      if (idx < 0 || idx <= prev) return;
      prev = idx;
    }

    // WIN
    setSolved(true);
    solvedRef.current = true;
    stopTimer();
    setHintCell(null);

    (async () => {
      const saved = await getSavedLevel();
      if (levelNum >= saved) await saveCurrentLevel(levelNum + 1);

      // Give hint only every 5 levels
      if ((levelNum + 1) % 5 === 0) {
        addHints(1);
      }
    })();

    setTimerSecs(prev => {
      const t = prev;
      setWinTime(fmtTime(t));
      return t;
    });
    const isReward = (levelNum + 1) % 5 === 0;

    setWinSub(
      isReward
        ? `All ${total} cells filled · ${nodes.length} nodes in order\n💡 Bonus: +1 Hint!`
        : `All ${total} cells filled · ${nodes.length} nodes in order`
    );
    setStatus('Level complete! 🎉', 'good');
    setTimeout(() => setShowWin(true), 450);
  }, [levelNum, stopTimer, addHints, setStatus]);

  // ─────────────────────────────────────────────
  // HELPERS for DRAG INPUT
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
    const c = Math.floor(lx / CELL);
    const r = Math.floor(ly / CELL);
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    return { r, c };
  }, [CELL]);

  // ─────────────────────────────────────────────
  // PAN RESPONDER
  // Timer starts on the very first touch — never before, never resets after.
  // ─────────────────────────────────────────────
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

      // ── Start timer on first interaction ──────────────────────────────────
      // ensureTimerRunning is idempotent: it checks timerStarted.current
      // and returns immediately if the timer is already running.
      ensureTimerRunning();
      // ──────────────────────────────────────────────────────────────────────

      if (key === start) {
        const newPath = [key];
        pathRef.current = newPath;
        setPath([...newPath]);
        draggingRef.current = true;
        return;
      }

      if (pathRef.current.length === 0) {
        setStatus('Tap node 1 to start!', 'bad');
        return;
      }

      if (key === pathRef.current[pathRef.current.length - 1]) {
        draggingRef.current = true;
        return;
      }

      const ei = pathRef.current.indexOf(key);
      if (ei !== -1) {
        const newPath = pathRef.current.slice(0, ei + 1);
        pathRef.current = newPath;
        setPath([...newPath]);
        draggingRef.current = true;
        return;
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
        const newPath = pathRef.current.slice(0, -1);
        pathRef.current = newPath;
        setPath([...newPath]);
        return;
      }

      const ei = pathRef.current.indexOf(key);
      if (ei !== -1) {
        const newPath = pathRef.current.slice(0, ei + 1);
        pathRef.current = newPath;
        setPath([...newPath]);
        return;
      }

      const [lr, lc] = last.split(',').map(Number);
      if (!canMove(lr, lc, cell.r, cell.c)) return;

      const ni = nodes.findIndex(([r, c]) => r === cell.r && c === cell.c);
      if (ni !== -1) {
        const expected = nextNodeNum(pathRef.current, nodes) - 1;
        if (ni !== expected) {
          setStatus(`Reach node ${expected + 1} before node ${ni + 1}!`, 'bad');
          return;
        }
      }

      const newPath = [...pathRef.current, key];
      pathRef.current = newPath;
      setPath([...newPath]);
      checkWin(newPath, lv);
    },

    onPanResponderRelease: () => {
      draggingRef.current = false;
    },
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
  const useHint = useCallback(() => {
    if (hintBtnLocked.current || solvedRef.current) return;
    if (hints <= 0) { setShowStore(true); return; }

    hintBtnLocked.current = true;
    setHintCell(null);

    const lv = levelDataRef.current;
    if (!lv) return;
    const { solution } = lv;

    if (pathRef.current.length === 0) {
      const [r, c] = solution[0].split(',').map(Number);
      spendHintFn();
      setHintCell({ r, c });
      setStatus(`Hint used · start at node 1`);
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
    spendHintFn();
    setHintCell({ r, c });
    setStatus(`Hint used · row ${r + 1}, col ${c + 1}`);
    setTimeout(() => { hintBtnLocked.current = false; }, 200);
  }, [hints, spendHintFn, setStatus]);

  // ─────────────────────────────────────────────
  // SKIP
  // ─────────────────────────────────────────────
  const triggerSkip = useCallback(() => {
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
  }, [levelNum, goLevel]);

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
    const newPath = pathRef.current.slice(0, -1);
    pathRef.current = newPath;
    setPath([...newPath]);
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

  // Patch finishAdWithTimeBonus now that showToastMsg is defined
  const finishAdWithTimeBonusStable = useCallback(async (callback) => {
    clearInterval(adIntervalRef.current);
    setShowAd(false);

    const newState = { ...adState, count: adState.count + 1, lastTime: Date.now() };
    setAdState(newState);
    await saveAdState(newState);

    callback?.();
    showToastMsg('⏱ +15 seconds added!');
  }, [adState, showToastMsg]);

  // ─────────────────────────────────────────────
  // STORE / BUY
  // ─────────────────────────────────────────────
  const buyPack = useCallback(async (pack) => {
    if (pack.key === 'first' && everBought) {
      showToastMsg('First-purchase offer already used!');
      return;
    }
    const total = pack.hints + pack.bonus;
    addHints(total);
    await markBought();
    setEverBought(true);
    setShowStore(false);
    showToastMsg(`💡 +${total} hints added!`);
  }, [everBought, addHints, showToastMsg]);

  const buyEmergency = useCallback(async () => {
    addHints(1);
    await markBought();
    setEverBought(true);
    setShowStore(false);
    showToastMsg('💡 +1 hint added!');
  }, [addHints, showToastMsg]);

  // ─────────────────────────────────────────────
  // AD SYSTEM
  // ─────────────────────────────────────────────
  const canWatchAd = useCallback(() => {
    const remaining = AD_MAX_PER_DAY - adState.count;
    if (remaining <= 0) return { ok: false, reason: 'daily_limit' };
    const elapsed = Date.now() - adState.lastTime;
    if (elapsed < AD_COOLDOWN_MS) {
      return { ok: false, reason: 'cooldown', remaining: Math.ceil((AD_COOLDOWN_MS - elapsed) / 1000) };
    }
    return { ok: true };
  }, [adState]);

  const startWatchAd = useCallback(() => {
    const check = canWatchAd();
    if (!check.ok) return;
    setShowStore(false);
    setAdProgress(0);
    setAdTimeLeft(AD_DURATION_S);
    setAdCanClose(false);
    setShowAd(true);

    let elapsed = 0;
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    adIntervalRef.current = setInterval(() => {
      elapsed++;
      setAdProgress(Math.min((elapsed / AD_DURATION_S) * 100, 100));
      setAdTimeLeft(Math.max(0, AD_DURATION_S - elapsed));
      if (elapsed >= AD_DURATION_S) {
        clearInterval(adIntervalRef.current);
        setAdCanClose(true);
      }
    }, 1000);
  }, [canWatchAd]);

  const finishAd = useCallback(async () => {
    clearInterval(adIntervalRef.current);
    setShowAd(false);
    const newState = { ...adState, count: adState.count + 1, lastTime: Date.now() };
    setAdState(newState);
    await saveAdState(newState);
    addHints(2);
    showToastMsg('💡 +2 Hints from ad! Thanks for watching.');
  }, [adState, addHints, showToastMsg]);

  // ─────────────────────────────────────────────
  // AD COOLDOWN DISPLAY
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (adCooldownRef.current) clearInterval(adCooldownRef.current);
    const check = canWatchAd();
    if (!check.ok && check.reason === 'cooldown') {
      setAdCooldownLeft(check.remaining || 0);
      adCooldownRef.current = setInterval(() => {
        setAdCooldownLeft(prev => {
          if (prev <= 1) {
            clearInterval(adCooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAdCooldownLeft(0);
    }
    return () => { if (adCooldownRef.current) clearInterval(adCooldownRef.current); };
  }, [adState, showStore]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (!levelData) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={{ color: COLORS.muted, marginTop: 40, textAlign: 'center' }}>Loading…</Text>
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
      const cc = Math.max(c1, c2);
      x1 = x2 = cc * CELL; y1 = r1 * CELL + 4; y2 = (r1 + 1) * CELL - 4;
    } else {
      const rr = Math.max(r1, r2);
      y1 = y2 = rr * CELL; x1 = c1 * CELL + 4; x2 = (c1 + 1) * CELL - 4;
    }
    wallSegments.push({ x1, y1, x2, y2, key: wk });
  });

  const adCheck = canWatchAd();
  const adRemaining = AD_MAX_PER_DAY - adState.count;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Top bar ── */}
      <View style={s.topbar}>
        <TouchableOpacity style={s.navBtn} onPress={() => { navigation.goBack(); }}>
          <Text style={s.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.timer}>⏱ {fmtTime(timerSecs)}</Text>
        <View style={s.levelBadge}>
          <Text style={s.levelBadgeText}>Level {levelNum}</Text>
        </View>
        <TouchableOpacity style={s.navBtn} onPress={resetLevel}>
          <Text style={s.navBtnText}>↺</Text>
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
                  <Line x1={0} y1={i * CELL} x2={BOARD_W} y2={i * CELL} stroke={COLORS.border} strokeWidth={1} />
                  <Line x1={i * CELL} y1={0} x2={i * CELL} y2={BOARD_W} stroke={COLORS.border} strokeWidth={1} />
                </G>
              ))}

              {wallSegments.map(w => (
                <Line key={w.key} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                  stroke={COLORS.text} strokeWidth={5} strokeLinecap="round" />
              ))}

              {path.length >= 2 && (
                <>
                  <Polyline points={pathPoints} fill="none"
                    stroke={COLORS.accentLight} strokeWidth={CELL * 0.28}
                    strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
                  <Polyline points={pathPoints} fill="none"
                    stroke={COLORS.accent} strokeWidth={CELL * 0.13}
                    strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
            </Svg>

            {Array.from({ length: size }, (_, r) =>
              Array.from({ length: size }, (_, c) => (
                <View key={`cell-${r}-${c}`} pointerEvents="none" style={{
                  position: 'absolute',
                  left: c * CELL + 1, top: r * CELL + 1,
                  width: CELL - 2, height: CELL - 2, borderRadius: 4,
                  backgroundColor: pathSet.has(`${r},${c}`) ? COLORS.accentFill : 'transparent',
                }} />
              ))
            )}

            {hintCell && (
              <Animated.View pointerEvents="none" style={{
                position: 'absolute',
                left: hintCell.c * CELL + 4, top: hintCell.r * CELL + 4,
                width: CELL - 8, height: CELL - 8, borderRadius: 6,
                backgroundColor: 'rgba(251,191,36,0.25)',
                borderWidth: 2.5, borderColor: COLORS.warn,
                opacity: hintPulse, transform: [{ scale: hintPulse }],
              }} />
            )}

            {nodes.map(([r, c], i) => {
              const reached = pathSet.has(`${r},${c}`);
              const cx = c * CELL + CELL / 2;
              const cy = r * CELL + CELL / 2;
              return (
                <View key={`node-${i}`} pointerEvents="none" style={{
                  position: 'absolute',
                  left: cx - 17, top: cy - 17,
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: reached ? COLORS.accent : COLORS.surfaceRaised,
                  borderWidth: 2,
                  borderColor: reached ? COLORS.accent : COLORS.borderStrong,
                  alignItems: 'center', justifyContent: 'center', zIndex: 10,
                  transform: [{ scale: reached ? 1.07 : 1 }],
                  shadowColor: reached ? COLORS.accent : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: reached ? 0.5 : 0.3,
                  shadowRadius: 4, elevation: 5,
                }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}>{i + 1}</Text>
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
          style={[s.actionBtn, path.length === 0 && s.actionBtnDisabled]}
          onPress={undoStep} disabled={path.length === 0}>
          <Text style={s.actionBtnText}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} onPress={useHint}>
          <Text style={s.actionBtnTextPrimary}>Hint </Text>
          <View style={[s.hintBadge, hints === 0 && s.hintBadgeEmpty]}>
            <Text style={s.hintBadgeText}>{hints > 999 ? '999+' : hints}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[s.actionBtn, s.skipBtn]} onPress={triggerSkip}>
          <Text style={[s.actionBtnText, { color: COLORS.muted }]}>Skip</Text>
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
            {(() => {
              const remaining = 5 - ((levelNum + 1) % 5 || 5);
              const isReward = (levelNum + 1) % 5 === 0;

              return (
                <View style={s.hintRewardTag}>
                  <Text style={s.hintRewardText}>
                    {isReward
                      ? '💡 +1 Hint earned!'
                      : `Complete ${remaining} more level${remaining > 1 ? 's' : ''} to get 1 hint`}
                  </Text>
                </View>
              );
            })()}
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.mbtn, s.mbtnGhost]} onPress={() => { setShowWin(false); resetLevel(); }}>
                <Text style={s.mbtnTextLight}>↺ Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mbtn, s.mbtnAccent]} onPress={() => { setShowWin(false); goLevel(levelNum + 1); }}>
                <Text style={s.mbtnTextLight}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ TIME MODAL ══ */}
      <Modal visible={showTimeUp} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>⏰</Text>
            <Text style={s.modalTitle}>Time's Up!</Text>
            <Text style={s.modalSub}>Your time is finished</Text>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.mbtn, s.mbtnGhost, { width: 70 }]}
                onPress={() => {
                  setShowTimeUp(false);
                  resetLevel();
                }}
              >
                <Text style={s.mbtnTextLight}>↺ Retry</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.mbtn, s.mbtnAccent]}
                onPress={async () => {
                  setShowTimeUp(false);
                  setShowAd(true);

                  // Start ad mock
                  setAdProgress(0);
                  setAdTimeLeft(AD_DURATION_S);
                  setAdCanClose(false);

                  let elapsed = 0;
                  if (adIntervalRef.current) clearInterval(adIntervalRef.current);
                  adIntervalRef.current = setInterval(() => {
                    elapsed++;
                    setAdProgress(Math.min((elapsed / AD_DURATION_S) * 100, 100));
                    setAdTimeLeft(Math.max(0, AD_DURATION_S - elapsed));
                    if (elapsed >= AD_DURATION_S) {
                      clearInterval(adIntervalRef.current);
                      setAdCanClose(true);
                    }
                  }, 1000);

                  // When ad finishes, finishAdWithTimeBonusStable is called by
                  // the "Collect" button handler below — we just set up the ad here.
                  // Store the callback so the collect button can invoke it.
                  pendingTimeBonusRef.current = () => {
                    setExtraTime(prev => {
                      const next = prev + 15;
                      extraTimeRef.current = next;
                      return next;
                    });
                    startTimerFromCurrent();
                  };
                }}
              >
                <Text style={s.mbtnTextLight}>📺 Watch Ad +15 sec</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ STORE MODAL ══ */}
      <Modal visible={showStore} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modalCard, { maxHeight: '90%' }]}>
            <TouchableOpacity style={s.storeClose} onPress={() => setShowStore(false)}>
              <Text style={{ color: COLORS.muted, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>

            <View style={s.storeHeader}>
              <View>
                <Text style={{ fontSize: 28 }}>💡</Text>
                <Text style={[s.modalTitle, { fontSize: 17 }]}>Get Hints</Text>
              </View>
              <View style={s.storeBalance}>
                <Text style={s.storeBalanceText}>💡 {hints > 999 ? '999+' : hints} hints</Text>
              </View>
            </View>

            <Text style={s.modalSub}>You're out of hints. Watch an ad.</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={s.adSection}>
                <View style={s.adRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.adTitle}>📺 Watch Ad → Get 2 Hints</Text>
                    <Text style={s.adSub}>{adRemaining} of {AD_MAX_PER_DAY} remaining today · 1 min cooldown</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.adBtn, (!adCheck.ok || adRemaining <= 0) && s.adBtnDisabled]}
                    onPress={startWatchAd} disabled={!adCheck.ok || adRemaining <= 0}>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>
                      {adRemaining <= 0 ? 'Done' : adCheck.ok ? 'Watch' : 'Wait'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {adCooldownLeft > 0 && <Text style={s.adCooldown}>Next ad in {adCooldownLeft}s</Text>}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══ SKIP MODAL ══ */}
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

      {/* ══ AD MOCK MODAL ══ */}
      <Modal visible={showAd} transparent animationType="fade">
        <View style={[s.overlay, { backgroundColor: 'rgba(0,0,0,0.92)' }]}>
          <View style={s.adMockCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📺</Text>
            <Text style={{ fontWeight: '700', fontSize: 16, color: COLORS.text, marginBottom: 4, textAlign: 'center' }}>Watching Ad…</Text>
            <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>You'll receive 2 hints after the ad</Text>
            <View style={s.adMockBar}>
              <View style={[s.adMockProgress, { width: `${adProgress}%` }]} />
            </View>
            <Text style={s.adMockTimer}>{adTimeLeft > 0 ? `${adTimeLeft}s remaining` : 'Ad complete!'}</Text>
            <Text style={{ fontSize: 12, color: COLORS.muted, marginTop: 4, textAlign: 'center' }}>Please wait for the ad to finish</Text>
            {adCanClose && (
              <TouchableOpacity
                style={s.adCloseBtn}
                onPress={async () => {
                  if (pendingTimeBonusRef.current) {
                    // Time-bonus ad (from Time's Up modal)
                    await finishAdWithTimeBonusStable(pendingTimeBonusRef.current);
                    pendingTimeBonusRef.current = null;
                  } else {
                    // Regular hint ad
                    await finishAd();
                  }
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>✓ Collect</Text>
              </TouchableOpacity>
            )}
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
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    gap: 12, justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  timer: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14, color: COLORS.muted, flex: 1,
  },
  levelBadge: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, backgroundColor: COLORS.surfaceRaised,
  },
  levelBadgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12, color: COLORS.textSub, fontWeight: '600',
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 18, color: COLORS.textSub, lineHeight: 22 },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  boardOuter: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  status: {
    marginTop: 12, fontSize: 12, color: COLORS.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center', paddingHorizontal: 16,
  },
  statusBad: { color: COLORS.bad },
  statusGood: { color: COLORS.good },
  bottomBar: {
    flexDirection: 'row', gap: 10, paddingVertical: 14, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  actionBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 40, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnPrimary: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  skipBtn: { flex: 0.7 },
  actionBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.textSub },
  actionBtnTextPrimary: { fontSize: 14, fontWeight: '500', color: COLORS.bg },
  hintBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: 'center',
  },
  hintBadgeEmpty: { opacity: 0.6 },
  hintBadgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12, color: COLORS.bg, fontWeight: '600',
  },
  overlay: {
    flex: 1, backgroundColor: COLORS.overlay,
    alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 24, padding: 28, width: '100%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  modalEmoji: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  modalTitle: { fontWeight: '700', fontSize: 20, color: COLORS.text, textAlign: 'center', marginBottom: 4 },
  modalSub: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  winTime: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16, color: COLORS.accent, textAlign: 'left', marginVertical: 8,
  },
  hintRewardTag: {
    alignSelf: 'center', backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: COLORS.good, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 4, marginTop: 8, marginBottom: 16,
  },
  hintRewardText: { color: COLORS.good, fontWeight: '700', fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  mbtn: {
    flex: 1, paddingVertical: 13, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  mbtnGhost: { backgroundColor: COLORS.surfaceRaised },
  mbtnAccent: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  mbtnTextLight: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  storeClose: {
    position: 'absolute', top: 14, right: 16,
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  storeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  storeBalance: {
    backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1.5, borderColor: COLORS.warn,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  storeBalanceText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13, fontWeight: '700', color: COLORS.warn,
  },
  adSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  adRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(14,165,233,0.1)', borderWidth: 1.5, borderColor: 'rgba(14,165,233,0.35)',
    borderRadius: 14, padding: 12, gap: 10,
  },
  adTitle: { fontWeight: '700', fontSize: 14, color: '#38bdf8' },
  adSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  adBtn: { backgroundColor: '#0369a1', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  adBtnDisabled: { backgroundColor: COLORS.border },
  adCooldown: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 6,
  },
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
  adMockCard: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 20, padding: 32, width: '90%', maxWidth: 320, alignItems: 'center',
  },
  adMockBar: {
    width: '100%', height: 6, backgroundColor: COLORS.border,
    borderRadius: 3, marginTop: 16, marginBottom: 8, overflow: 'hidden',
  },
  adMockProgress: { height: '100%', backgroundColor: COLORS.good, borderRadius: 3 },
  adMockTimer: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14, color: COLORS.muted,
  },
  adCloseBtn: {
    backgroundColor: COLORS.good, borderRadius: 40,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 16,
  },
  toast: {
    position: 'absolute', bottom: 80, alignSelf: 'center',
    backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 40, paddingHorizontal: 22, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  toastText: { color: COLORS.text, fontSize: 13, fontWeight: '500' },
});