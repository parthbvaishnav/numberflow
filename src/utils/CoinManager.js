// src/utils/CoinManager.js
// Central manager for coins, hints, daily rewards, and related persistence.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  COINS: 'zipCoins_v1',
  HINTS: 'zipHintsV2',
  DAILY_LAST: 'zipDailyLastClaim',
  DAILY_DAY: 'zipDailyCurrentDay',
  SPIN_LAST: 'zipSpinLastUsed',
};

// ── Daily reward schedule ──────────────────────────────────────────────────
export const DAILY_REWARDS = [
  { day: 1, coins: 30, hints: 0 },
  { day: 2, coins: 0, hints: 1 },
  { day: 3, coins: 40, hints: 0 },
  { day: 4, coins: 0, hints: 2 },
  { day: 5, coins: 50, hints: 0 },
  { day: 6, coins: 0, hints: 3 },
  { day: 7, coins: 30, hints: 4 },
];

// ── Hint purchase plans ────────────────────────────────────────────────────
export const HINT_PLANS = [
  { id: 'h1', coins: 169, hints: 2 },
  { id: 'h2', coins: 219, hints: 3 },
  { id: 'h3', coins: 429, hints: 4 },
  { id: 'h4', coins: 649, hints: 6 },
  { id: 'h5', coins: 949, hints: 8 },
];

// ── Spin wheel segments ────────────────────────────────────────────────────
export const SPIN_SEGMENTS = [
  { label: '50 Coins', type: 'coins', value: 50, color: '#f59e0b' },
  { label: '1 Hint', type: 'hints', value: 1, color: '#34d399' },
  { label: '25 Coins', type: 'coins', value: 25, color: '#60a5fa' },
  { label: '2 Hints', type: 'hints', value: 2, color: '#a78bfa' },
  { label: '100 Coins', type: 'coins', value: 100, color: '#fb923c' },
  { label: '75 Coins', type: 'coins', value: 75, color: '#f472b6' },
  { label: '3 Hints', type: 'hints', value: 3, color: '#4ade80' },
  { label: '150 Coins', type: 'coins', value: 150, color: '#fbbf24' },
];

// ── Coin helpers ───────────────────────────────────────────────────────────
export async function getCoins() {
  try {
    return Math.max(0, parseInt((await AsyncStorage.getItem(KEYS.COINS)) || '0', 10));
  } catch { return 0; }
}

export async function setCoins(n) {
  try { await AsyncStorage.setItem(KEYS.COINS, String(Math.max(0, n))); } catch { }
}

export async function addCoins(amount) {
  const current = await getCoins();
  const next = current + amount;
  await setCoins(next);
  return next;
}

export async function spendCoins(amount) {
  const current = await getCoins();
  if (current < amount) return false;
  await setCoins(current - amount);
  return true;
}

// ── Hint helpers ───────────────────────────────────────────────────────────
export async function getHints() {
  try {
    return Math.max(0, parseInt((await AsyncStorage.getItem(KEYS.HINTS)) || '0', 10));
  } catch { return 0; }
}

export async function setHints(n) {
  try { await AsyncStorage.setItem(KEYS.HINTS, String(Math.max(0, n))); } catch { }
}

export async function addHints(amount) {
  const current = await getHints();
  const next = current + amount;
  await setHints(next);
  return next;
}

export async function spendHint() {
  const current = await getHints();
  if (current <= 0) return false;
  await setHints(current - 1);
  return true;
}

// ── Daily reward helpers ───────────────────────────────────────────────────
export async function getDailyRewardStatus() {
  try {
    const lastClaim = await AsyncStorage.getItem(KEYS.DAILY_LAST);
    const currentDay = parseInt((await AsyncStorage.getItem(KEYS.DAILY_DAY)) || '0', 10);
    const now = Date.now();
    const MS_IN_DAY = 24 * 60 * 60 * 1000;

    if (!lastClaim) {
      return { canClaim: true, nextDay: 1, timeUntilNext: 0 };
    }

    const last = parseInt(lastClaim, 10);
    const elapsed = now - last;

    if (elapsed >= MS_IN_DAY) {
      const nextDay = currentDay >= 7 ? 1 : currentDay + 1;
      return { canClaim: true, nextDay, timeUntilNext: 0 };
    }

    return {
      canClaim: false,
      nextDay: currentDay >= 7 ? 1 : currentDay + 1,
      timeUntilNext: MS_IN_DAY - elapsed,
      currentDay,
    };
  } catch {
    return { canClaim: true, nextDay: 1, timeUntilNext: 0 };
  }
}

export async function claimDailyReward() {
  const status = await getDailyRewardStatus();
  if (!status.canClaim) return null;

  const day = status.nextDay;
  const reward = DAILY_REWARDS.find(r => r.day === day) || DAILY_REWARDS[0];

  await AsyncStorage.setItem(KEYS.DAILY_LAST, String(Date.now()));
  await AsyncStorage.setItem(KEYS.DAILY_DAY, String(day));

  if (reward.coins > 0) await addCoins(reward.coins);
  if (reward.hints > 0) await addHints(reward.hints);

  return { day, ...reward };
}


// ── Spin wheel cooldown (every 30 min) ────────────────────────────────────

const SPIN_COOLDOWN = 20 * 60 * 1000; // 30 minutes

export async function canSpin() {
  try {
    const last = await AsyncStorage.getItem(KEYS.SPIN_LAST);
    if (!last) return true;
    const elapsed = Date.now() - parseInt(last, 10);
    return elapsed >= SPIN_COOLDOWN;
  } catch {
    return true;
  }
}

export async function recordSpin() {
  try {
    await AsyncStorage.setItem(KEYS.SPIN_LAST, String(Date.now()));
  } catch { }
}

export async function getSpinTimeRemaining() {
  try {
    const last = await AsyncStorage.getItem(KEYS.SPIN_LAST);
    if (!last) return 0;
    const elapsed = Date.now() - parseInt(last, 10);
    const remaining = SPIN_COOLDOWN - elapsed;
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
}

// ── Level coin reward ──────────────────────────────────────────────────────
export function getLevelCoinReward() {
  return Math.floor(Math.random() * 40) + 50; // 50–89
}

export function formatCountdown(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const REWARD_COOLDOWN = 2 * 60 * 1000; // 2 min

export async function canUseRewardAd() {
  try {
    const last = await AsyncStorage.getItem(
      KEYS.REWARD_AD_LAST
    );

    if (!last) return true;

    const elapsed =
      Date.now() -
      parseInt(last, 10);

    return elapsed >= REWARD_COOLDOWN;

  } catch {
    return true;
  }
}

export async function recordRewardAd() {
  try {
    await AsyncStorage.setItem(
      KEYS.REWARD_AD_LAST,
      String(Date.now())
    );
  } catch { }
}

export async function getRewardAdRemaining() {
  try {
    const last =
      await AsyncStorage.getItem(
        KEYS.REWARD_AD_LAST
      );

    if (!last) return 0;

    const elapsed =
      Date.now() -
      parseInt(last, 10);

    return Math.max(
      0,
      REWARD_COOLDOWN - elapsed
    );

  } catch {
    return 0;
  }
}