// utils/levelGenerator.js
// ─────────────────────────────────────────────
// Pure level-generation logic — no React, no side effects.
// Import this wherever you need to pre-generate levels.
// ─────────────────────────────────────────────

import { InteractionManager } from 'react-native';

export const levelCache = new Map();

export function preloadLevelBatch(currentLevel) {
  const start = Math.floor((currentLevel - 1) / 10) * 10 + 1;
  const end = start + 9;

  for (let i = start; i <= end; i++) {
    if (!levelCache.has(i)) {
      InteractionManager.runAfterInteractions(() => {
        if (!levelCache.has(i)) {
          levelCache.set(i, generateLevel(i));
        }
      });
    }
  }
}

// ── Seeded PRNG — Mulberry32 ──────────────────
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function wallKey(r1, c1, r2, c2) {
  if (r1 > r2 || (r1 === r2 && c1 > c2)) return `${r2},${c2}|${r1},${c1}`;
  return `${r1},${c1}|${r2},${c2}`;
}

export function generateLevel(levelNum) {
  const rng = makeRng(levelNum * 999983 + 31337);
  const size = levelNum <= 4 ? 5 : 6;
  const nodeCount = Math.min(3 + Math.floor((levelNum - 1) / 3), 7);
  const total = size * size;
  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  let solution = null;
  const startCandidates = seededShuffle(
    Array.from({ length: total }, (_, i) => [Math.floor(i / size), i % size]),
    rng,
  );

  for (const [sr, sc] of startCandidates.slice(0, 8)) {
    const visited = Array.from({ length: size }, () => new Array(size).fill(false));
    const result = [];

    function dfs(r, c) {
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
  const nodes = sortedIndices.map(i => solution[i].split(',').map(Number));

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

  return { size, nodes, solution, wallSet };
}