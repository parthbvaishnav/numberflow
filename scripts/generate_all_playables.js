const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '..');
const HTML_DIR = path.join(BASE_DIR, 'google-ads', 'html');
const PLAYABLES_DIR = path.join(HTML_DIR, 'playables');
const ZIPS_DIR = path.join(HTML_DIR, 'playables_zip');

if (!fs.existsSync(PLAYABLES_DIR)) fs.mkdirSync(PLAYABLES_DIR, { recursive: true });
if (!fs.existsSync(ZIPS_DIR)) fs.mkdirSync(ZIPS_DIR, { recursive: true });

// ── Seeded PRNG — Mulberry32 (Exact copy of src/utils/levelGenerator.js) ──
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wallKey(r1, c1, r2, c2) {
  if (r1 > r2 || (r1 === r2 && c1 > c2)) return `${r2},${c2}|${r1},${c1}`;
  return `${r1},${c1}|${r2},${c2}`;
}

function generateLevel(levelNum) {
  const rng = makeRng(levelNum * 999983 + 31337);
  const size = levelNum <= 4 ? 5 : 6;
  const nodeCount = Math.min(3 + Math.floor((levelNum - 1) / 3), 7);
  const total = size * size;
  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  let solution = null;
  const startCandidates = seededShuffle(
    Array.from({ length: total }, (_, i) => [Math.floor(i / size), i % size]),
    rng
  );

  const maxSteps = 3000;
  for (const [sr, sc] of startCandidates.slice(0, 8)) {
    const visited = Array.from({ length: size }, () => new Array(size).fill(false));
    const result = [];
    let steps = 0;

    function dfs(r, c) {
      steps++;
      if (steps > maxSteps) return false;
      visited[r][c] = true;
      result.push(`${r},${c}`);
      if (result.length === total) return true;
      const dirs = seededShuffle(DIRS, rng);
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (visited[nr][nc]) continue;
        if (dfs(nr, nc)) return true;
      }
      visited[r][c] = false;
      result.pop();
      return false;
    }

    if (dfs(sr, sc)) { solution = result; break; }
  }

  if (!solution) {
    solution = [];
    for (let r = 0; r < size; r++) {
      const cols = r % 2 === 0
        ? Array.from({ length: size }, (_, c) => c)
        : Array.from({ length: size }, (_, c) => size - 1 - c);
      for (const c of cols) solution.push(`${r},${c}`);
    }
  }

  const indices = new Set([0, total - 1]);
  const step = Math.floor((total - 1) / (nodeCount - 1));
  for (let i = 1; i < nodeCount - 1; i++) indices.add(i * step);
  while (indices.size < nodeCount) {
    indices.add(Math.floor(rng() * (total - 2)) + 1);
  }
  const sortedIndices = Array.from(indices).sort((a, b) => a - b).slice(0, nodeCount);
  const nodes = sortedIndices.map((idx, i) => {
    const [r, c] = solution[idx].split(',').map(Number);
    return { num: i + 1, r, c, stepIndex: idx };
  });

  const requiredOpen = new Set();
  for (let i = 0; i < solution.length - 1; i++) {
    const [r1, c1] = solution[i].split(',').map(Number);
    const [r2, c2] = solution[i + 1].split(',').map(Number);
    requiredOpen.add(wallKey(r1, c1, r2, c2));
  }

  const wallSet = new Set();
  const density = 0.10 + Math.min(levelNum * 0.007, 0.20);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c < size - 1) {
        const k = wallKey(r, c, r, c + 1);
        if (!requiredOpen.has(k) && rng() < density) wallSet.add(k);
      }
      if (r < size - 1) {
        const k = wallKey(r, c, r + 1, c);
        if (!requiredOpen.has(k) && rng() < density) wallSet.add(k);
      }
    }
  }

  return { size, nodes, solution, walls: Array.from(wallSet) };
}

// ── THEMES (from src/constants/theme.js) ──
const THEMES = {
  default: {
    id: 'default',
    name: 'Classic Dark',
    icon: '🌑',
    background: '#0f1923',
    surface: '#16212b',
    surfaceRaised: '#1c2d3a',
    border: '#2a3a4a',
    primary: '#4da9ff',
    primaryLight: '#8ecbff',
    text: '#ffffff',
    muted: '#8fa3b8',
    accentGlow: 'rgba(77,169,255,0.4)',
    accentTag: 'rgba(56,189,248,0.2)',
    btn2x: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  neon: {
    id: 'neon',
    name: 'Neon Pulse',
    icon: '⚡',
    background: '#0a0a0a',
    surface: '#141414',
    surfaceRaised: '#1e1e1e',
    border: '#2a2a2a',
    primary: '#00FF88',
    primaryLight: '#39FF14',
    text: '#FFFFFF',
    muted: '#888888',
    accentGlow: 'rgba(0,255,136,0.4)',
    accentTag: 'rgba(0,255,136,0.2)',
    btn2x: 'linear-gradient(135deg, #00FF88 0%, #059669 100%)'
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Ocean',
    icon: '🌊',
    background: '#021B2B',
    surface: '#032D44',
    surfaceRaised: '#054060',
    border: '#1a5276',
    primary: '#00B4D8',
    primaryLight: '#48CAE4',
    text: '#E0F7FF',
    muted: '#7FB3C8',
    accentGlow: 'rgba(0,180,216,0.4)',
    accentTag: 'rgba(0,180,216,0.25)',
    btn2x: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)'
  },
  purple: {
    id: 'purple',
    name: 'Mystic Purple',
    icon: '🔮',
    background: '#1a0535',
    surface: '#2a0d4d',
    surfaceRaised: '#3b1469',
    border: '#581C87',
    primary: '#9333EA',
    primaryLight: '#C084FC',
    text: '#F3E8FF',
    muted: '#D8B4FE',
    accentGlow: 'rgba(147,51,234,0.4)',
    accentTag: 'rgba(147,51,234,0.25)',
    btn2x: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)'
  },
  dark: {
    id: 'dark',
    name: 'Pure Dark',
    icon: '🕶',
    background: '#050505',
    surface: '#0f0f0f',
    surfaceRaised: '#1a1a1a',
    border: '#262626',
    primary: '#ffffff',
    primaryLight: '#cccccc',
    text: '#ffffff',
    muted: '#777777',
    accentGlow: 'rgba(255,255,255,0.25)',
    accentTag: 'rgba(255,255,255,0.15)',
    btn2x: 'linear-gradient(135deg, #e5e5e5 0%, #a3a3a3 100%)'
  }
};

// ── 20 PLAYABLES CONFIGURATION (Levels 1 to 20 across 5 themes) ──
const PLAYABLE_MATRIX = [
  { lv: 1, theme: 'default' },
  { lv: 2, theme: 'neon' },
  { lv: 3, theme: 'ocean' },
  { lv: 4, theme: 'purple' },
  { lv: 5, theme: 'dark' },
  { lv: 6, theme: 'default' },
  { lv: 7, theme: 'neon' },
  { lv: 8, theme: 'ocean' },
  { lv: 9, theme: 'purple' },
  { lv: 10, theme: 'dark' },
  { lv: 11, theme: 'default' },
  { lv: 12, theme: 'neon' },
  { lv: 13, theme: 'ocean' },
  { lv: 14, theme: 'purple' },
  { lv: 15, theme: 'dark' },
  { lv: 16, theme: 'default' },
  { lv: 17, theme: 'neon' },
  { lv: 18, theme: 'ocean' },
  { lv: 19, theme: 'purple' },
  { lv: 20, theme: 'dark' }
];

function buildPlayableHtml(levelNum, themeObj, levelData) {
  const { size, nodes, solution, walls } = levelData;
  const initialPathLen = Math.max(1, Math.floor(solution.length * 0.65));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="ad.size" content="width=320,height=480">
  <meta name="app.url" content="https://play.google.com/store/apps/details?id=com.numberflow.game">
  <title>Number Link Puzzle — Level ${levelNum} (${themeObj.name})</title>
  <script src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script>
  <style>
    * {
      margin: 0; padding: 0; box-sizing: border-box;
      user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
    }
    body {
      width: 100vw; height: 100vh; max-width: 480px; margin: 0 auto;
      overflow: hidden; background-color: ${themeObj.background};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: ${themeObj.text}; position: relative; touch-action: none;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .topbar {
      height: 48px; display: flex; align-items: center; justify-content: space-between;
      padding: 0 12px; border-bottom: 1px solid ${themeObj.border};
      background: ${themeObj.background}; z-index: 10;
    }
    .nav-btn {
      width: 30px; height: 30px; border-radius: 15px; border: 1.5px solid ${themeObj.border};
      background: ${themeObj.surfaceRaised}; display: flex; align-items: center; justify-content: center;
      color: ${themeObj.text}; font-size: 14px; cursor: pointer;
    }
    .timer {
      font-family: Courier, monospace; font-size: 13px; color: ${themeObj.muted};
      display: flex; align-items: center; gap: 4px;
    }
    .level-badge {
      border: 1.5px solid ${themeObj.border}; border-radius: 16px; padding: 3px 10px;
      background: ${themeObj.surfaceRaised}; font-family: Courier, monospace;
      font-size: 12px; color: ${themeObj.text}; font-weight: 700;
    }
    .bal-chip {
      background: ${themeObj.surfaceRaised}; border: 1px solid ${themeObj.border};
      border-radius: 12px; padding: 4px 8px; font-size: 11px; font-weight: 700;
      color: ${themeObj.text}; display: flex; align-items: center; gap: 3px;
    }

    .board-area {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 10px 0; position: relative;
    }
    .board-outer {
      background: ${themeObj.surface}; border: 1.5px solid ${themeObj.border};
      border-radius: 20px; padding: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      position: relative;
    }
    canvas { display: block; border-radius: 14px; cursor: pointer; }
    .status-text {
      margin-top: 14px; font-size: 13px; color: ${themeObj.muted}; font-weight: 600;
      font-family: -apple-system, sans-serif; letter-spacing: 0.2px; text-align: center;
    }

    #hand-guide {
      position: absolute; pointer-events: none; z-index: 20;
      filter: drop-shadow(0 2px 8px ${themeObj.accentGlow});
      transition: transform 0.25s ease-out; display: none;
    }

    .bottom-bar {
      height: 60px; display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; border-top: 1px solid ${themeObj.border};
      background: ${themeObj.background}; z-index: 10;
    }
    .action-btn {
      height: 40px; border-radius: 20px; border: 1.5px solid ${themeObj.border};
      background: ${themeObj.surfaceRaised}; display: flex; align-items: center;
      justify-content: center; cursor: pointer; color: ${themeObj.text};
      font-size: 13px; font-weight: 600; transition: transform 0.1s;
    }
    .btn-retry { width: 40px; font-size: 18px; }
    .action-btn-primary {
      flex: 1; margin: 0 12px; background: ${themeObj.primary};
      border-color: ${themeObj.primary}; color: #000; font-weight: 700;
      display: flex; gap: 6px;
    }
    .hint-badge {
      background: rgba(0,0,0,0.25); border-radius: 10px; padding: 1px 7px;
      font-size: 11px; font-weight: 800; color: #fff;
    }
    .skip-btn { padding: 0 14px; color: ${themeObj.muted}; }

    #win-modal {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(10, 18, 26, 0.88); backdrop-filter: blur(4px);
      display: none; align-items: center; justify-content: center; z-index: 100;
      padding: 20px;
    }
    .modal-card {
      width: 100%; max-width: 320px; background: ${themeObj.surfaceRaised};
      border: 1.5px solid ${themeObj.border}; border-radius: 24px;
      padding: 22px 18px 18px; text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
      animation: modalPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes modalPop {
      0% { transform: scale(0.85); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .modal-emoji { font-size: 40px; margin-bottom: 6px; }
    .modal-title { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .modal-sub { font-size: 12px; color: ${themeObj.muted}; margin-bottom: 12px; }
    .coin-reward-badge {
      display: inline-flex; align-items: center; justify-content: center; gap: 4px;
      background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4);
      border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 800;
      color: #fbbf24; margin-bottom: 8px;
    }
    .hint-reward-tag { font-size: 11px; color: ${themeObj.muted}; margin-bottom: 14px; }
    .modal-actions { display: flex; gap: 8px; margin-bottom: 10px; }
    .mbtn {
      flex: 1; padding: 10px 0; border-radius: 25px; font-size: 13px;
      font-weight: 700; cursor: pointer; text-align: center; border: 1.5px solid transparent;
    }
    .mbtn-ghost { background: ${themeObj.surface}; border-color: ${themeObj.border}; color: ${themeObj.text}; }
    .mbtn-accent { background: ${themeObj.primary}; color: #000; }
    .mbtn-2x {
      display: block; width: 100%; background: ${themeObj.btn2x};
      color: #ffffff; padding: 11px 0; border-radius: 25px; font-size: 13px;
      font-weight: 800; box-shadow: 0 4px 14px ${themeObj.accentGlow}; cursor: pointer;
      margin-bottom: 8px;
    }
    .store-cta-btn {
      display: block; width: 100%; background: ${themeObj.primary};
      color: #000; padding: 10px 0; border-radius: 20px; font-size: 12px;
      font-weight: 900; letter-spacing: 0.5px; text-decoration: none; cursor: pointer;
    }
  </style>
</head>
<body>

  <div class="topbar">
    <div class="nav-btn" onclick="openStoreUrl()">‹</div>
    <div class="timer" id="timer-display">⏱ 0:11</div>
    <div class="level-badge">Level ${levelNum}</div>
    <div class="bal-chip">🪙 175</div>
    <div class="nav-btn" onclick="openStoreUrl()">?</div>
  </div>

  <div class="board-area">
    <div class="board-outer">
      <canvas id="game-canvas" width="280" height="280"></canvas>
      <div id="hand-guide">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${themeObj.primary}" stroke-width="2">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8M6 14v1a6 6 0 0 0 6 6h1a6 6 0 0 0 6-6v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2" fill="${themeObj.accentGlow}"/>
        </svg>
      </div>
    </div>
    <div class="status-text" id="status-display">Next: node ${nodes.length} · ${initialPathLen}/${solution.length} cells filled</div>
  </div>

  <div class="bottom-bar">
    <div class="action-btn btn-retry" onclick="resetPuzzle()">↺</div>
    <div class="action-btn action-btn-primary" onclick="useHint()">
      <span>Hint</span>
      <div class="hint-badge">4</div>
    </div>
    <div class="action-btn skip-btn" onclick="openStoreUrl()">Skip</div>
  </div>

  <div id="win-modal">
    <div class="modal-card">
      <div class="modal-emoji">🎉</div>
      <div class="modal-title">Level Complete!</div>
      <div class="modal-sub">Clean solve! You're a natural.</div>
      <div class="coin-reward-badge">🪙 +75 Coins Earned!</div>
      <div class="hint-reward-tag">💡 4 more levels for a hint</div>
      <div class="modal-actions">
        <div class="mbtn mbtn-ghost" onclick="resetPuzzle()">↺ Retry</div>
        <div class="mbtn mbtn-accent" onclick="openStoreUrl()">Next →</div>
      </div>
      <div class="mbtn-2x" onclick="openStoreUrl()">
        📺 Watch Ad · 2× Coins (+75)
      </div>
      <div class="store-cta-btn" onclick="openStoreUrl()">
        INSTALL FREE ON GOOGLE PLAY ▶
      </div>
    </div>
  </div>

  <script>
    const APP_URL = "https://play.google.com/store/apps/details?id=com.numberflow.game";
    window.clickTag = APP_URL;

    let audioCtx = null;
    function getAudioContext() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
    function playTone(freq, duration = 0.08, type = 'sine') {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    }
    function playWinSound() {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.35, 'triangle'), i * 110);
      });
    }

    function openStoreUrl() {
      playTone(600, 0.1);
      if (window.ExitApi && typeof window.ExitApi.exit === 'function') {
        try { ExitApi.exit(APP_URL); } catch (e) { ExitApi.exit(); }
      } else if (window.mraid && typeof window.mraid.open === 'function') {
        window.mraid.open(APP_URL);
      } else {
        window.open(APP_URL, '_blank');
      }
    }

    const SIZE = ${size};
    const CELL = 280 / SIZE;
    const TOTAL_CELLS = ${solution.length};
    const NODES = ${JSON.stringify(nodes)};
    const SOLUTION = ${JSON.stringify(solution)};
    const WALL_SET = new Set(${JSON.stringify(walls)});

    function wallKey(r1, c1, r2, c2) {
      if (r1 > r2 || (r1 === r2 && c1 > c2)) return r2 + ',' + c2 + '|' + r1 + ',' + c1;
      return r1 + ',' + c1 + '|' + r2 + ',' + c2;
    }

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const statusDisplay = document.getElementById('status-display');
    const timerDisplay = document.getElementById('timer-display');
    const handGuide = document.getElementById('hand-guide');
    const winModal = document.getElementById('win-modal');

    const INITIAL_PATH_LEN = ${initialPathLen};
    let path = SOLUTION.slice(0, INITIAL_PATH_LEN);
    let pathSet = new Set(path);
    let isDragging = false;
    let tutorialActive = true;
    let particles = [];
    let timerSecs = 11;

    setInterval(() => {
      if (path.length < TOTAL_CELLS) {
        timerSecs++;
        const m = Math.floor(timerSecs / 60);
        const s = timerSecs % 60;
        timerDisplay.innerText = '⏱ ' + m + ':' + (s < 10 ? '0' : '') + s;
      }
    }, 1000);

    function updateStatus() {
      const filled = path.length;
      if (filled === TOTAL_CELLS) {
        statusDisplay.innerText = "Level Complete! · " + TOTAL_CELLS + "/" + TOTAL_CELLS + " cells";
        statusDisplay.style.color = "${themeObj.primary}";
      } else {
        const nextNode = NODES.find(n => !pathSet.has(n.r + ',' + n.c));
        const num = nextNode ? nextNode.num : NODES[NODES.length - 1].num;
        statusDisplay.innerText = "Next: node " + num + " · " + filled + "/" + TOTAL_CELLS + " cells filled";
        statusDisplay.style.color = "${themeObj.muted}";
      }
    }

    function spawnConfetti() {
      particles = [];
      const colors = ['${themeObj.primary}', '#fbbf24', '#ffffff', '#10b981'];
      for (let i = 0; i < 45; i++) {
        particles.push({
          x: 140, y: 140,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12 - 2,
          size: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015
        });
      }
    }

    function checkWin() {
      if (path.length === TOTAL_CELLS) {
        tutorialActive = false;
        handGuide.style.display = 'none';
        playWinSound();
        spawnConfetti();
        updateStatus();
        setTimeout(() => {
          winModal.style.display = 'flex';
        }, 600);
      }
    }

    function resetPuzzle() {
      path = SOLUTION.slice(0, INITIAL_PATH_LEN);
      pathSet = new Set(path);
      tutorialActive = true;
      winModal.style.display = 'none';
      updateStatus();
      playTone(350, 0.1);
    }

    function useHint() {
      playTone(550, 0.15);
      if (path.length < TOTAL_CELLS) {
        const nextCell = SOLUTION[path.length];
        path.push(nextCell);
        pathSet.add(nextCell);
        updateStatus();
        checkWin();
      }
    }

    function getCellFromCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
        return { r, c, key: r + ',' + c };
      }
      return null;
    }

    function handleStart(clientX, clientY) {
      const cell = getCellFromCoords(clientX, clientY);
      if (!cell) return;
      tutorialActive = false;
      handGuide.style.display = 'none';
      if (path.length > 0 && path[path.length - 1] === cell.key) {
        isDragging = true;
      } else if (pathSet.has(cell.key)) {
        const idx = path.indexOf(cell.key);
        if (idx !== -1) {
          path = path.slice(0, idx + 1);
          pathSet = new Set(path);
          isDragging = true;
          playTone(420, 0.05);
          updateStatus();
        }
      }
    }

    function handleMove(clientX, clientY) {
      if (!isDragging) return;
      const target = getCellFromCoords(clientX, clientY);
      if (!target) return;
      const headKey = path[path.length - 1];
      if (target.key === headKey) return;
      const [hr, hc] = headKey.split(',').map(Number);
      const dr = Math.abs(target.r - hr);
      const dc = Math.abs(target.c - hc);
      const isNeighbor = (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
      if (!isNeighbor) return;
      const wk = wallKey(hr, hc, target.r, target.c);
      if (WALL_SET.has(wk)) {
        playTone(150, 0.12, 'sawtooth');
        return;
      }
      if (path.length >= 2 && path[path.length - 2] === target.key) {
        path.pop();
        pathSet.delete(headKey);
        playTone(320, 0.04);
        updateStatus();
        return;
      }
      if (pathSet.has(target.key)) return;
      path.push(target.key);
      pathSet.add(target.key);
      playTone(440 + path.length * 15, 0.05);
      updateStatus();
      checkWin();
    }

    function handleEnd() { isDragging = false; }

    canvas.addEventListener('touchstart', e => { e.preventDefault(); handleStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    window.addEventListener('touchend', () => handleEnd());

    canvas.addEventListener('mousedown', e => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => handleEnd());

    function updateHand() {
      if (!tutorialActive || path.length >= TOTAL_CELLS) {
        handGuide.style.display = 'none';
        return;
      }
      handGuide.style.display = 'block';
      const headKey = path[path.length - 1];
      const nextKey = SOLUTION[path.length];
      const [hr, hc] = headKey.split(',').map(Number);
      const [nr, nc] = nextKey.split(',').map(Number);
      const t = (Date.now() % 1200) / 1200;
      const curR = hr + (nr - hr) * t;
      const curC = hc + (nc - hc) * t;
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / canvas.width;
      const px = (curC * CELL + CELL / 2) * scale;
      const py = (curR * CELL + CELL / 2) * scale;
      handGuide.style.transform = 'translate(' + (px + 6) + 'px, ' + (py + 6) + 'px)';
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.fillStyle = '${themeObj.surface}';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = '${themeObj.border}';
      ctx.lineWidth = 1;
      for (let i = 0; i <= SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height);
        ctx.stroke();
      }

      // Visited cell glow
      path.forEach(k => {
        const [r, c] = k.split(',').map(Number);
        ctx.fillStyle = '${themeObj.accentGlow}';
        ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4);
      });

      // Neon line path
      if (path.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const [r0, c0] = path[0].split(',').map(Number);
        ctx.moveTo(c0 * CELL + CELL / 2, r0 * CELL + CELL / 2);
        for (let i = 1; i < path.length; i++) {
          const [r, c] = path[i].split(',').map(Number);
          ctx.lineTo(c * CELL + CELL / 2, r * CELL + CELL / 2);
        }
        ctx.strokeStyle = '${themeObj.primaryLight}';
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = CELL * 0.30;
        ctx.stroke();

        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '${themeObj.primary}';
        ctx.lineWidth = CELL * 0.14;
        ctx.stroke();
      }

      // Barrier walls
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      WALL_SET.forEach(wk => {
        const [a, b] = wk.split('|');
        const [r1, c1] = a.split(',').map(Number);
        const [r2, c2] = b.split(',').map(Number);
        let x1, y1, x2, y2;
        if (r1 === r2) {
          const cc = Math.max(c1, c2);
          x1 = x2 = cc * CELL;
          y1 = r1 * CELL + 4;
          y2 = (r1 + 1) * CELL - 4;
        } else {
          const rr = Math.max(r1, r2);
          y1 = y2 = rr * CELL;
          x1 = c1 * CELL + 4;
          x2 = (c1 + 1) * CELL - 4;
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Numbered Nodes
      NODES.forEach(n => {
        const cx = n.c * CELL + CELL / 2;
        const cy = n.r * CELL + CELL / 2;
        const isReached = pathSet.has(n.r + ',' + n.c);

        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = isReached ? '${themeObj.primary}' : '${themeObj.surfaceRaised}';
        ctx.fill();
        ctx.strokeStyle = isReached ? '${themeObj.primary}' : '${themeObj.border}';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isReached ? '#000000' : '${themeObj.text}';
        ctx.font = 'bold 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.num, cx, cy);
      });

      // Confetti
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
        else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      updateHand();
      requestAnimationFrame(render);
    }

    render();
  </script>
</body>
</html>
`;
}

console.log('🚀 Generating 20 HTML5 Playable Ads Across Levels 1-20 & All 5 Themes...');

const generatedList = [];

PLAYABLE_MATRIX.forEach(({ lv, theme }) => {
  const themeObj = THEMES[theme];
  const levelData = generateLevel(lv);
  const padLv = String(lv).padStart(2, '0');
  const folderName = `playable_lv${padLv}_${theme}`;
  const targetDir = path.join(PLAYABLES_DIR, folderName);

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const htmlContent = buildPlayableHtml(lv, themeObj, levelData);
  const htmlPath = path.join(targetDir, 'index.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  // Package into zip using powershell Compress-Archive
  const zipName = `${folderName}.zip`;
  const zipPath = path.join(ZIPS_DIR, zipName);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  try {
    execSync(`powershell -Command "Compress-Archive -Path '${targetDir}\\*' -DestinationPath '${zipPath}' -Force"`);
    const sizeKb = (fs.statSync(zipPath).size / 1024).toFixed(1);
    console.log(`[DONE] Level ${lv} (${themeObj.name}): ${zipName} (${sizeKb} KB)`);
    generatedList.push({
      lv,
      theme,
      themeName: themeObj.name,
      folderName,
      zipName,
      sizeKb,
      size: levelData.size,
      nodeCount: levelData.nodes.length
    });
  } catch (err) {
    console.error(`Error zipping ${folderName}:`, err.message);
  }
});

// Save manifest for gallery
const manifestPath = path.join(HTML_DIR, 'playables_manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(generatedList, null, 2), 'utf8');
console.log(`\n🎉 All 20 Playables generated & packaged successfully in:\n👉 ${ZIPS_DIR}`);
