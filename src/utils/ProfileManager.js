// src/utils/ProfileManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoins, setCoins, getHints, setHints } from './CoinManager';

const PROFILE_KEY = 'zipPlayerProfile_v1';

// 50 Curated Daily Achievements (Reset Every Calendar Day)
export const DAILY_ACHIEVEMENTS_50 = [
  // ── Levels Solved Today (12 tasks) ──────────────────────────────────────
  { id: 'da_lvl_1', name: 'Quick Start', desc: 'Solve 1 level today', target: 1, rewardCoins: 10, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_2', name: 'Warming Up', desc: 'Solve 2 levels today', target: 2, rewardCoins: 15, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_3', name: 'Flowing Along', desc: 'Solve 3 levels today', target: 3, rewardCoins: 20, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_4', name: 'Grid Navigator', desc: 'Solve 4 levels today', target: 4, rewardCoins: 25, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_5', name: 'Five Down', desc: 'Solve 5 levels today', target: 5, rewardCoins: 30, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_7', name: 'Lucky Seven', desc: 'Solve 7 levels today', target: 7, rewardCoins: 40, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_10', name: 'Deca Solver', desc: 'Solve 10 levels today', target: 10, rewardCoins: 50, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_12', name: 'Dozen Master', desc: 'Solve 12 levels today', target: 12, rewardCoins: 60, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_15', name: 'Flow Maestro', desc: 'Solve 15 levels today', target: 15, rewardCoins: 75, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_20', name: 'Twenty Streak', desc: 'Solve 20 levels today', target: 20, rewardCoins: 100, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_25', name: 'Silver Marathon', desc: 'Solve 25 levels today', target: 25, rewardCoins: 150, category: 'levels', icon: '🧩' },
  { id: 'da_lvl_30', name: 'Puzzle Champion', desc: 'Solve 30 levels today', target: 30, rewardCoins: 200, category: 'levels', icon: '🧩' },

  // ── No-Hint Solves Today (8 tasks) ──────────────────────────────────────
  { id: 'da_nh_1', name: 'Pure Intuition', desc: 'Win 1 level with no hints', target: 1, rewardCoins: 15, category: 'nohint', icon: '🧠' },
  { id: 'da_nh_2', name: 'Self-Reliant', desc: 'Win 2 levels with no hints', target: 2, rewardCoins: 25, category: 'nohint', icon: '🧠' },
  { id: 'da_nh_3', name: 'Sharp Mind', desc: 'Win 3 levels with no hints', target: 3, rewardCoins: 35, category: 'nohint', icon: '🧠' },
  { id: 'da_nh_5', name: 'Genius Streak', desc: 'Win 5 levels with no hints', target: 5, rewardCoins: 50, category: 'nohint', icon: '🧠' },
  { id: 'da_nh_7', name: 'Pristine Logic', desc: 'Win 7 levels with no hints', target: 7, rewardCoins: 75, category: 'nohint', icon: '🧠' },
  { id: 'da_nh_10', name: 'Flawless Ten', desc: 'Win 10 levels with no hints', target: 10, rewardCoins: 100, category: 'nohint', icon: '🧠' },
  { id: 'da_nh_15', name: 'Master Mind', desc: 'Win 15 levels with no hints', target: 15, rewardCoins: 150, category: 'nohint', icon: '🧠' },
  { id: 'da_nh_20', name: 'Number Deity', desc: 'Win 20 levels with no hints', target: 20, rewardCoins: 200, category: 'nohint', icon: '🧠' },

  // ── Coins Earned Today (8 tasks) ────────────────────────────────────────
  { id: 'da_ce_25', name: 'Pocket Change', desc: 'Earn 25 coins today', target: 25, rewardCoins: 10, category: 'coins', icon: '🪙' },
  { id: 'da_ce_50', name: 'Coin Pouch', desc: 'Earn 50 coins today', target: 50, rewardCoins: 20, category: 'coins', icon: '🪙' },
  { id: 'da_ce_100', name: 'Treasure Seeker', desc: 'Earn 100 coins today', target: 100, rewardCoins: 35, category: 'coins', icon: '🪙' },
  { id: 'da_ce_200', name: 'Gold Stash', desc: 'Earn 200 coins today', target: 200, rewardCoins: 60, category: 'coins', icon: '🪙' },
  { id: 'da_ce_300', name: 'Vault Builder', desc: 'Earn 300 coins today', target: 300, rewardCoins: 90, category: 'coins', icon: '🪙' },
  { id: 'da_ce_500', name: 'Coin Collector', desc: 'Earn 500 coins today', target: 500, rewardCoins: 150, category: 'coins', icon: '🪙' },
  { id: 'da_ce_750', name: 'Wealthy Solver', desc: 'Earn 750 coins today', target: 750, rewardCoins: 200, category: 'coins', icon: '🪙' },
  { id: 'da_ce_1000', name: 'Daily Tycoon', desc: 'Earn 1,000 coins today', target: 1000, rewardCoins: 300, category: 'coins', icon: '🪙' },

  // ── Coins Spent in Shop Today (5 tasks) ─────────────────────────────────
  { id: 'da_cs_100', name: 'First Purchase', desc: 'Spend 100 coins in shop', target: 100, rewardCoins: 25, category: 'spend', icon: '🛍️' },
  { id: 'da_cs_500', name: 'Shop Patron', desc: 'Spend 500 coins in shop', target: 500, rewardCoins: 60, category: 'spend', icon: '🛍️' },
  { id: 'da_cs_1000', name: 'Big Spender', desc: 'Spend 1,000 coins in shop', target: 1000, rewardCoins: 120, category: 'spend', icon: '🛍️' },
  { id: 'da_cs_2000', name: 'Shopaholic', desc: 'Spend 2,000 coins in shop', target: 2000, rewardCoins: 250, category: 'spend', icon: '🛍️' },
  { id: 'da_cs_5000', name: 'VIP Investor', desc: 'Spend 5,000 coins in shop', target: 5000, rewardCoins: 500, category: 'spend', icon: '🛍️' },

  // ── Hints Used Today (5 tasks) ──────────────────────────────────────────
  { id: 'da_h_1', name: 'Helpful Clue', desc: 'Use 1 hint today', target: 1, rewardCoins: 10, category: 'hints', icon: '💡' },
  { id: 'da_h_2', name: 'Double Clue', desc: 'Use 2 hints today', target: 2, rewardCoins: 20, category: 'hints', icon: '💡' },
  { id: 'da_h_3', name: 'Triple Clue', desc: 'Use 3 hints today', target: 3, rewardCoins: 30, category: 'hints', icon: '💡' },
  { id: 'da_h_5', name: 'Hint Strategist', desc: 'Use 5 hints today', target: 5, rewardCoins: 50, category: 'hints', icon: '💡' },
  { id: 'da_h_8', name: 'Master Inquirer', desc: 'Use 8 hints today', target: 8, rewardCoins: 80, category: 'hints', icon: '💡' },

  // ── Spin Wheel Spins Today (4 tasks) ────────────────────────────────────
  { id: 'da_sp_1', name: 'Daily Spin', desc: 'Spin the wheel 1 time', target: 1, rewardCoins: 15, category: 'activity', icon: '🎡' },
  { id: 'da_sp_2', name: 'Twice as Lucky', desc: 'Spin the wheel 2 times', target: 2, rewardCoins: 25, category: 'activity', icon: '🎡' },
  { id: 'da_sp_3', name: 'Triple Spinner', desc: 'Spin the wheel 3 times', target: 3, rewardCoins: 40, category: 'activity', icon: '🎡' },
  { id: 'da_sp_5', name: 'Wheel Enthusiast', desc: 'Spin the wheel 5 times', target: 5, rewardCoins: 75, category: 'activity', icon: '🎡' },

  // ── Ads Watched Today (4 tasks) ─────────────────────────────────────────
  { id: 'da_ad_1', name: 'Sponsor Support', desc: 'Watch 1 video ad today', target: 1, rewardCoins: 20, category: 'activity', icon: '📺' },
  { id: 'da_ad_2', name: 'Ad Enthusiast', desc: 'Watch 2 video ads today', target: 2, rewardCoins: 35, category: 'activity', icon: '📺' },
  { id: 'da_ad_3', name: 'Triple Viewer', desc: 'Watch 3 video ads today', target: 3, rewardCoins: 50, category: 'activity', icon: '📺' },
  { id: 'da_ad_5', name: 'Loyal Supporter', desc: 'Watch 5 video ads today', target: 5, rewardCoins: 100, category: 'activity', icon: '📺' },

  // ── Play Time Today (4 tasks) ───────────────────────────────────────────
  { id: 'da_pt_3', name: 'Warm-Up Time', desc: 'Play for 3 minutes today', target: 180, rewardCoins: 15, category: 'activity', icon: '⏱️' },
  { id: 'da_pt_10', name: 'Tenacious Solver', desc: 'Play for 10 minutes today', target: 600, rewardCoins: 30, category: 'activity', icon: '⏱️' },
  { id: 'da_pt_20', name: 'Dedicated Gamer', desc: 'Play for 20 minutes today', target: 1200, rewardCoins: 60, category: 'activity', icon: '⏱️' },
  { id: 'da_pt_30', name: 'Flow Mastermind', desc: 'Play for 30 minutes today', target: 1800, rewardCoins: 120, category: 'activity', icon: '⏱️' },
];

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const defaultProfile = {
  playerName: 'Flow Solver',
  avatar: '🦊',
  avatarUrl: 'https://api.dicebear.com/9.x/adventurer/png?seed=Jack&size=128',
  avatarId: 'adv_1',
  xp: 0,
  levelsCompleted: 0,
  totalPlayTime: 0, // seconds
  currentStreak: 1,
  bestStreak: 1,
  lastLoginDate: '',
  unlockedAvatars: ['adv_1'],
  unlockedThemes: ['default'],
  hintsUsedCount: 0,
  noHintStreak: 0,
  wheelSpinsCount: 0,
  accumulatedCoins: 0,
  levelsCompletedToday: 0,
  noHintLevelsToday: 0,
  hintsUsedToday: 0,
  adsWatchedToday: 0,
  coinsEarnedToday: 0,
  coinsSpentToday: 0,
  wheelSpinsToday: 0,
  playTimeToday: 0,
  claimedDailyAchievements: [],
  lastDailyAchievementDate: '',
};

export async function getProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    const syncCoins = await getCoins();
    const syncHints = await getHints();

    if (!raw) {
      const p = { ...defaultProfile, coins: syncCoins, hints: syncHints };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      return p;
    }

    const p = JSON.parse(raw);
    const profile = { ...defaultProfile, ...p };

    const coinDiff = syncCoins - (profile.coins || 0);
    if (coinDiff > 0) {
      profile.accumulatedCoins = (profile.accumulatedCoins || 0) + coinDiff;
      profile.coinsEarnedToday = (profile.coinsEarnedToday || 0) + coinDiff;
    }

    profile.coins = syncCoins;
    profile.hints = syncHints;
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  } catch (e) {
    return { ...defaultProfile };
  }
}

export async function saveProfile(profile) {
  try {
    const oldCoins = await getCoins();
    const coinDiff = profile.coins - oldCoins;
    if (coinDiff > 0) {
      profile.accumulatedCoins = (profile.accumulatedCoins || 0) + coinDiff;
      profile.coinsEarnedToday = (profile.coinsEarnedToday || 0) + coinDiff;
    }

    await setCoins(profile.coins);
    await setHints(profile.hints);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) { }
}

export async function incrementMissionProgress(type, count = 1) {
  const profile = await getProfile();

  if (type === 'hints') {
    profile.hintsUsedCount = (profile.hintsUsedCount || 0) + count;
    profile.hintsUsedToday = (profile.hintsUsedToday || 0) + count;
  } else if (type === 'ads') {
    profile.adsWatchedToday = (profile.adsWatchedToday || 0) + count;
  } else if (type === 'levels') {
    profile.levelsCompletedToday = (profile.levelsCompletedToday || 0) + count;
  }
  await saveProfile(profile);
}

export async function completeLevel(levelNum, timeSpent, usedHint, difficulty = 'Medium') {
  await incrementMissionProgress('levels', 1);

  const profile = await getProfile();
  profile.levelsCompleted += 1;
  profile.levelsCompletedToday = (profile.levelsCompletedToday || 0) + 1;
  profile.totalPlayTime += timeSpent;
  profile.xp = (profile.xp || 0) + 5;
  profile.playTimeToday = (profile.playTimeToday || 0) + timeSpent;

  if (usedHint) {
    profile.noHintStreak = 0;
  } else {
    profile.noHintStreak += 1;
    profile.noHintLevelsToday = (profile.noHintLevelsToday || 0) + 1;
  }

  await saveProfile(profile);
  return { profile, promoted: false, promotionMsg: '' };
}

export async function unlockTheme(themeId, cost) {
  const profile = await getProfile();
  if (profile.unlockedThemes.includes(themeId)) return true;
  if (profile.coins < cost) return false;

  profile.coins -= cost;
  profile.unlockedThemes.push(themeId);
  await saveProfile(profile);
  return true;
}

export async function updatePlayerName(name) {
  if (!name || !name.trim()) return false;
  const profile = await getProfile();
  profile.playerName = name.trim().slice(0, 20);
  await saveProfile(profile);
  return profile.playerName;
}

export async function updatePlayerAvatar(avatarUrl, avatarId) {
  if (!avatarUrl) return false;
  const profile = await getProfile();
  profile.avatarUrl = avatarUrl;
  if (avatarId) profile.avatarId = avatarId;
  await saveProfile(profile);
  return { avatarUrl: profile.avatarUrl, avatarId: profile.avatarId };
}

// ── 50 Daily Achievements Core Engine ──────────────────────────────────────
export async function getDailyAchievements() {
  const profile = await getProfile();
  const today = getTodayString();

  // Next-day automatic reset logic
  if (profile.lastDailyAchievementDate !== today) {
    profile.lastDailyAchievementDate = today;
    profile.levelsCompletedToday = 0;
    profile.noHintLevelsToday = 0;
    profile.coinsEarnedToday = 0;
    profile.coinsSpentToday = 0;
    profile.hintsUsedToday = 0;
    profile.wheelSpinsToday = 0;
    profile.adsWatchedToday = 0;
    profile.playTimeToday = 0;
    profile.claimedDailyAchievements = [];
    await saveProfile(profile);
  }

  const claimedSet = new Set(profile.claimedDailyAchievements || []);

  return DAILY_ACHIEVEMENTS_50.map((task) => {
    let progress = 0;
    switch (task.category) {
      case 'levels':
        progress = profile.levelsCompletedToday || 0;
        break;
      case 'nohint':
        progress = profile.noHintLevelsToday || 0;
        break;
      case 'coins':
        progress = profile.coinsEarnedToday || 0;
        break;
      case 'spend':
        progress = profile.coinsSpentToday || 0;
        break;
      case 'hints':
        progress = profile.hintsUsedToday || 0;
        break;
      case 'activity':
        if (task.id.startsWith('da_sp')) {
          progress = profile.wheelSpinsToday || 0;
        } else if (task.id.startsWith('da_ad')) {
          progress = profile.adsWatchedToday || 0;
        } else if (task.id.startsWith('da_pt')) {
          progress = profile.playTimeToday || 0;
        }
        break;
      default:
        progress = 0;
    }

    const completed = progress >= task.target;
    const claimed = claimedSet.has(task.id);
    return {
      ...task,
      progress: Math.min(progress, task.target),
      currentValue: progress,
      completed,
      claimed,
    };
  });
}

export async function claimDailyAchievement(taskId) {
  const achievements = await getDailyAchievements();
  const task = achievements.find((t) => t.id === taskId);
  if (!task || !task.completed || task.claimed) return false;

  const profile = await getProfile();
  if (!profile.claimedDailyAchievements) {
    profile.claimedDailyAchievements = [];
  }
  profile.claimedDailyAchievements.push(taskId);
  profile.coins = (profile.coins || 0) + task.rewardCoins;
  await saveProfile(profile);
  return { success: true, rewardCoins: task.rewardCoins };
}
