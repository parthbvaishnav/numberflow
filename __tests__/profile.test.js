import {
  getProfile,
  saveProfile,
  addXp,
  getRankIndex,
  getNextRankInfo,
  completeLevel,
  enterReferralCode,
  unlockTheme,
  unlockAvatar,
  getDailyMissions,
  claimMissionReward,
  getAchievements,
  claimAchievementReward
} from '../src/utils/ProfileManager';

// Define mock variables with 'mock' prefix so Jest allows hoisting references
let mockCoins = 1000;
let mockHints = 5;
const mockStore = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => Promise.resolve(mockStore[key] || null)),
  setItem: jest.fn((key, value) => {
    mockStore[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStore).forEach(key => delete mockStore[key]);
    return Promise.resolve();
  }),
}));

// Mock CoinManager
jest.mock('../src/utils/CoinManager', () => ({
  getCoins: jest.fn(() => Promise.resolve(mockCoins)),
  setCoins: jest.fn((val) => {
    mockCoins = val;
    return Promise.resolve();
  }),
  getHints: jest.fn(() => Promise.resolve(mockHints)),
  setHints: jest.fn((val) => {
    mockHints = val;
    return Promise.resolve();
  }),
  DAILY_REWARDS: [],
  formatCountdown: jest.fn(() => '23:59:59'),
}));

describe('ProfileManager tests', () => {
  beforeEach(async () => {
    // Reset mocks and state for each test
    mockCoins = 1000;
    mockHints = 5;
    Object.keys(mockStore).forEach(key => delete mockStore[key]);
  });

  test('getProfile returns default profile and saves it', async () => {
    const profile = await getProfile();
    expect(profile.playerName).toBe('Guest Solver');
    expect(profile.avatar).toBe('🦊');
    expect(profile.xp).toBe(0);
    expect(profile.coins).toBe(1000);
  });

  test('addXp adds XP and handles promotions correctly', async () => {
    // Initial profile
    const { profile: p1 } = await addXp(50);
    expect(p1.xp).toBe(50);
    expect(getRankIndex(p1.xp)).toBe(0); // Bronze

    // Add 1000 XP (Total: 1050), should promote to Silver (requires 1000 XP)
    const { profile: p2, promoted, promotionMsg } = await addXp(1000);
    expect(p2.xp).toBe(1050);
    expect(promoted).toBe(true);
    expect(p2.coins).toBe(1100); // 1000 initial + 100 reward
    expect(promotionMsg).toContain('Silver');
  });

  test('getRankIndex and getNextRankInfo return correct states', () => {
    expect(getRankIndex(0)).toBe(0);
    expect(getRankIndex(1500)).toBe(1); // Silver

    const info1 = getNextRankInfo(0);
    expect(info1.currentRank).toBe('Bronze');
    expect(info1.nextRank).toBe('Silver');
    expect(info1.progress).toBe(0);

    const info2 = getNextRankInfo(500);
    expect(info2.currentRank).toBe('Bronze');
    expect(info2.nextRank).toBe('Silver');
    expect(info2.progress).toBe(0.5);
  });

  test('completeLevel completes level, awards XP, and updates progress', async () => {
    const res = await completeLevel(1, 120, false, 'Hard'); // Awards 5 XP
    expect(res.profile.xp).toBe(5);
    
    const profile = await getProfile();
    expect(profile.levelsCompleted).toBe(1);
    expect(profile.totalPlayTime).toBe(120);
    expect(profile.noHintStreak).toBe(1);
  });

  test('unlockTheme unlocks theme when user has enough coins', async () => {
    const success = await unlockTheme('neon', 100);
    expect(success).toBe(true);

    const profile = await getProfile();
    expect(profile.unlockedThemes).toContain('neon');
    expect(profile.coins).toBe(900); // 1000 - 100

    // Try to unlock locked theme with insufficient balance
    const success2 = await unlockTheme('purple', 1000);
    expect(success2).toBe(false);
  });

  test('unlockAvatar unlocks paid avatar', async () => {
    const success = await unlockAvatar('🦁', 200);
    expect(success).toBe(true);

    const profile = await getProfile();
    expect(profile.unlockedAvatars).toContain('🦁');
    expect(profile.coins).toBe(800); // 1000 - 200
  });

  test('enterReferralCode awards 300 coins', async () => {
    const res = await enterReferralCode('CODE123');
    expect(res.success).toBe(true);
    expect(res.msg).toContain('🪙 +300 Coins');

    const profile = await getProfile();
    expect(profile.coins).toBe(1300);
    expect(profile.referralClaimed).toBe(true);
  });

  test('profile coin increases automatically increment coin daily mission progress', async () => {
    const missions = await getDailyMissions();
    const coinMissionBefore = missions.find(m => m.type === 'coins');
    const beforeProg = coinMissionBefore ? coinMissionBefore.progress : 0;

    // Simulate earning 150 coins externally via CoinManager
    mockCoins += 150;

    // Retrieve profile to trigger the coin difference auto-sync
    const profile = await getProfile();
    expect(profile.coins).toBe(1150); // 1000 + 150
    expect(profile.coinsEarnedToday).toBe(150);

    const updatedMissions = await getDailyMissions();
    const coinMissionAfter = updatedMissions.find(m => m.type === 'coins');
    if (coinMissionBefore && coinMissionAfter) {
      expect(coinMissionAfter.progress).toBe(beforeProg + 150);
    }
  });
});
