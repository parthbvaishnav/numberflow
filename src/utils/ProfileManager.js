// src/utils/ProfileManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoins, setCoins, getHints, setHints } from './CoinManager';

const PROFILE_KEY = 'zipPlayerProfile_v1';
const MISSION_DATE_KEY = 'zipDailyMissionDate_v1';
const MISSIONS_LIST_KEY = 'zipDailyMissionsList_v1';

export const RANKS = [
  { name: 'Bronze', xpNeeded: 0, rewardCoins: 0 },
  { name: 'Silver', xpNeeded: 1000, rewardCoins: 100 },
  { name: 'Gold', xpNeeded: 3000, rewardCoins: 250 },
  { name: 'Platinum', xpNeeded: 6000, rewardCoins: 400 },
  { name: 'Diamond', xpNeeded: 10000, rewardCoins: 600 },
  { name: 'Master', xpNeeded: 15000, rewardCoins: 1000 },
  { name: 'Grandmaster', xpNeeded: 22000, rewardCoins: 1500 },
  { name: 'Legend', xpNeeded: 30000, rewardCoins: 2500 }
];

export const AVATARS = ['🦊', '🐱', '🐼', '🦁', '🐻', '🐨', '🐯', '🐸', '🐙', '🦖', '🦄', '🐲'];
export const AVATAR_COSTS = {
  '🦊': 0, '🐱': 0, '🐼': 0,
  '🦁': 200, '🐻': 200, '🐨': 200,
  '🐯': 500, '🐸': 500, '🐙': 500,
  '🦖': 1000, '🦄': 1000, '🐲': 1500
};

// Raw Achievements definitions
export const ACHIEVEMENTS = [
  { id: 'beg', name: 'Beginner', desc: 'Complete 10 Levels', target: 10, rewardCoins: 100 },
  { id: 'exp', name: 'Explorer', desc: 'Complete 50 Levels', target: 50, rewardCoins: 250 },
  { id: 'master', name: 'Master', desc: 'Complete 200 Levels', target: 200, rewardCoins: 800 },
  { id: 'speed', name: 'Speed Runner', desc: 'Complete 10 Levels in One Day', target: 10, rewardCoins: 150 },
  { id: 'nohint', name: 'No Hint Challenge', desc: 'Complete 10 Levels without Hints', target: 10, rewardCoins: 200 },
  { id: 'collector', name: 'Coin Collector', desc: 'Accumulate 3,000 Total Coins', target: 3000, rewardCoins: 300 },
  { id: 'streak_7', name: 'Daily Player', desc: 'Reach a 7-Day Daily Streak', target: 7, rewardCoins: 200 },
  { id: 'wheel', name: 'Wheel Spinner', desc: 'Spin the wheel 5 times', target: 5, rewardCoins: 100 },
  { id: 'hint_use', name: 'Hint Spender', desc: 'Use 5 Hints in total', target: 5, rewardCoins: 100 }
];

// Raw Daily Missions options
const MISSION_POOL = [
  { id: 'm_lvls', name: 'Complete 5 Levels', target: 5, rewardCoins: 100, type: 'levels' },
  { id: 'm_hints', name: 'Use 2 Hints', target: 2, rewardCoins: 50, type: 'hints' },
  { id: 'm_ads', name: 'Watch 2 Ads', target: 2, rewardCoins: 60, type: 'ads' },
  { id: 'm_coins', name: 'Earn 300 Coins', target: 300, rewardCoins: 70, type: 'coins' }
];

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const defaultProfile = {
  playerName: 'Guest Solver',
  avatar: '🦊',
  xp: 0,
  levelsCompleted: 0,
  totalPlayTime: 0, // seconds
  currentStreak: 1,
  bestStreak: 1,
  lastLoginDate: '',
  unlockedAvatars: ['🦊', '🐱', '🐼'],
  unlockedThemes: ['default'],
  claimedAchievements: [], // array of id
  claimedMissions: [], // array of mission ids today
  referralClaimed: false,
  loginType: 'Guest',
  streakBroken: false,
  restoreAdWatched: false,
  hintsUsedCount: 0,
  noHintStreak: 0,
  wheelSpinsCount: 0,
  accumulatedCoins: 0,
  levelsCompletedToday: 0,
  hintsUsedToday: 0,
  adsWatchedToday: 0,
  coinsEarnedToday: 0
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
      
      const savedMissions = await AsyncStorage.getItem(MISSIONS_LIST_KEY);
      if (savedMissions) {
        const missions = JSON.parse(savedMissions);
        let updated = false;
        const updatedMissions = missions.map(m => {
          if (m.type === 'coins') {
            m.progress = Math.min(m.target, (m.progress || 0) + coinDiff);
            updated = true;
          }
          return m;
        });
        if (updated) {
          await AsyncStorage.setItem(MISSIONS_LIST_KEY, JSON.stringify(updatedMissions));
        }
      }
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
      
      const savedMissions = await AsyncStorage.getItem(MISSIONS_LIST_KEY);
      if (savedMissions) {
        const missions = JSON.parse(savedMissions);
        let updated = false;
        const updatedMissions = missions.map(m => {
          if (m.type === 'coins') {
            m.progress = Math.min(m.target, (m.progress || 0) + coinDiff);
            updated = true;
          }
          return m;
        });
        if (updated) {
          await AsyncStorage.setItem(MISSIONS_LIST_KEY, JSON.stringify(updatedMissions));
        }
      }
    }

    await setCoins(profile.coins);
    await setHints(profile.hints);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) { }
}

export async function addXp(amount) {
  const profile = await getProfile();
  const oldRankIndex = getRankIndex(profile.xp);
  profile.xp += amount;
  const newRankIndex = getRankIndex(profile.xp);

  let promoted = false;
  let promotionMsg = '';

  if (newRankIndex > oldRankIndex) {
    promoted = true;
    const rank = RANKS[newRankIndex];
    profile.coins += rank.rewardCoins;
    promotionMsg = `🎉 Promoted to ${rank.name}! +${rank.rewardCoins} Coins unlocked!`;
  }

  await saveProfile(profile);
  return { profile, promoted, promotionMsg };
}

export function getRankIndex(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xpNeeded) {
      idx = i;
    }
  }
  return idx;
}

export function getNextRankInfo(xp) {
  const idx = getRankIndex(xp);
  if (idx >= RANKS.length - 1) {
    return { currentRank: RANKS[idx].name, nextRank: 'Max Rank', xpRemaining: 0, progress: 1.0 };
  }
  const curr = RANKS[idx];
  const next = RANKS[idx + 1];
  const range = next.xpNeeded - curr.xpNeeded;
  const progressXp = xp - curr.xpNeeded;
  return {
    currentRank: curr.name,
    nextRank: next.name,
    xpRemaining: next.xpNeeded - xp,
    progress: Math.min(1.0, Math.max(0.0, progressXp / range))
  };
}

export async function checkDailyLogin() {
  const profile = await getProfile();
  const today = getTodayString();

  if (profile.lastLoginDate === today) {
    return { streak: profile.currentStreak, broken: false };
  }

  const lastDate = profile.lastLoginDate;
  profile.lastLoginDate = today;

  // Reset daily task counters
  profile.levelsCompletedToday = 0;
  profile.hintsUsedToday = 0;
  profile.adsWatchedToday = 0;
  profile.coinsEarnedToday = 0;

  if (!lastDate) {
    profile.currentStreak = 1;
    profile.streakBroken = false;
    await saveProfile(profile);
    return { streak: 1, broken: false };
  }

  const last = new Date(lastDate);
  const curr = new Date(today);
  const diffTime = Math.abs(curr - last);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    profile.currentStreak += 1;
    if (profile.currentStreak > profile.bestStreak) {
      profile.bestStreak = profile.currentStreak;
    }
    profile.streakBroken = false;
    // Check daily streak achievements
    await saveProfile(profile);
    return { streak: profile.currentStreak, broken: false };
  } else if (diffDays > 1) {
    profile.streakBroken = true;
    await saveProfile(profile);
    return { streak: profile.currentStreak, broken: true };
  }

  return { streak: profile.currentStreak, broken: false };
}

export async function restoreStreak() {
  const profile = await getProfile();
  if (profile.streakBroken) {
    profile.streakBroken = false;
    profile.restoreAdWatched = true;
    await saveProfile(profile);
  }
  return profile;
}

export async function incrementMissionProgress(type, count = 1) {
  const profile = await getProfile();
  const missions = await getDailyMissions();

  let updated = false;
  const updatedMissions = missions.map(m => {
    if (m.type === type) {
      m.progress = Math.min(m.target, m.progress + count);
      updated = true;
    }
    return m;
  });

  if (updated) {
    await AsyncStorage.setItem(MISSIONS_LIST_KEY, JSON.stringify(updatedMissions));
  }

  if (type === 'hints') {
    profile.hintsUsedCount += count;
    profile.hintsUsedToday += count;
  } else if (type === 'ads') {
    profile.adsWatchedToday += count;
  }
  await saveProfile(profile);
}

export async function completeLevel(levelNum, timeSpent, usedHint, difficulty = 'Medium') {
  // Update daily mission completed levels first to avoid overwriting state
  await incrementMissionProgress('levels', 1);

  const profile = await getProfile();
  profile.levelsCompleted += 1;
  profile.levelsCompletedToday += 1;
  profile.totalPlayTime += timeSpent;

  // Award 5 XP for every completed level
  const xpReward = 5;
  const oldRankIndex = getRankIndex(profile.xp);
  profile.xp += xpReward;
  const newRankIndex = getRankIndex(profile.xp);

  let promoted = false;
  let promotionMsg = '';

  if (newRankIndex > oldRankIndex) {
    promoted = true;
    const rank = RANKS[newRankIndex];
    profile.coins += rank.rewardCoins;
    promotionMsg = `🎉 Promoted to ${rank.name}! +${rank.rewardCoins} Coins unlocked!`;
  }

  if (usedHint) {
    profile.noHintStreak = 0;
  } else {
    profile.noHintStreak += 1;
  }

  await saveProfile(profile);
  return { profile, promoted, promotionMsg };
}

export async function getDailyMissions() {
  const today = getTodayString();
  const savedDate = await AsyncStorage.getItem(MISSION_DATE_KEY);
  const savedMissions = await AsyncStorage.getItem(MISSIONS_LIST_KEY);

  if (savedDate === today && savedMissions) {
    return JSON.parse(savedMissions);
  }

  // Generate 3 randomized missions
  const pool = [...MISSION_POOL];
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map(m => ({
    ...m,
    progress: 0,
    claimed: false
  }));

  await AsyncStorage.setItem(MISSION_DATE_KEY, today);
  await AsyncStorage.setItem(MISSIONS_LIST_KEY, JSON.stringify(selected));

  // Reset claimed mission list in profile
  const profile = await getProfile();
  profile.claimedMissions = [];
  await saveProfile(profile);

  return selected;
}

export async function claimMissionReward(missionId) {
  const missions = await getDailyMissions();
  const idx = missions.findIndex(m => m.id === missionId);
  if (idx === -1) return false;

  const mission = missions[idx];
  if (mission.progress < mission.target || mission.claimed) return false;

  const profile = await getProfile();
  profile.coins += mission.rewardCoins;
  profile.claimedMissions.push(missionId);
  mission.claimed = true;

  await saveProfile(profile);
  await AsyncStorage.setItem(MISSIONS_LIST_KEY, JSON.stringify(missions));
  return true;
}

export async function getAchievements() {
  const profile = await getProfile();

  return ACHIEVEMENTS.map(ach => {
    let progress = 0;
    switch (ach.id) {
      case 'beg':
      case 'exp':
      case 'master':
        progress = profile.levelsCompleted;
        break;
      case 'speed':
        progress = profile.levelsCompletedToday;
        break;
      case 'nohint':
        progress = profile.noHintStreak;
        break;
      case 'collector':
        progress = profile.coins; // total current balance
        break;
      case 'streak_7':
        progress = profile.currentStreak;
        break;
      case 'wheel':
        progress = profile.wheelSpinsCount;
        break;
      case 'hint_use':
        progress = profile.hintsUsedCount;
        break;
    }
    const completed = progress >= ach.target;
    const claimed = profile.claimedAchievements.includes(ach.id);
    return { ...ach, progress, completed, claimed };
  });
}

export async function claimAchievementReward(achId) {
  const achs = await getAchievements();
  const ach = achs.find(a => a.id === achId);
  if (!ach || !ach.completed || ach.claimed) return false;

  const profile = await getProfile();
  profile.coins += ach.rewardCoins;
  profile.claimedAchievements.push(achId);

  await saveProfile(profile);
  return true;
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

export async function unlockAvatar(avatar, cost) {
  const profile = await getProfile();
  if (profile.unlockedAvatars.includes(avatar)) return true;
  if (profile.coins < cost) return false;

  profile.coins -= cost;
  profile.unlockedAvatars.push(avatar);
  await saveProfile(profile);
  return true;
}

export async function enterReferralCode(code) {
  const profile = await getProfile();
  if (profile.referralClaimed) return { success: false, msg: 'Referral reward already claimed!' };
  if (!code || code.trim().length < 4) return { success: false, msg: 'Invalid referral code!' };

  profile.coins += 300;
  profile.referralClaimed = true;
  await saveProfile(profile);
  return { success: true, msg: 'Referral claimed! 🪙 +300 Coins added!' };
}

export async function recordWheelSpin() {
  const profile = await getProfile();
  profile.wheelSpinsCount += 1;
  await saveProfile(profile);
}
