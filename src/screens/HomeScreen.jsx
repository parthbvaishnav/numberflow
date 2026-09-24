import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  InteractionManager,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, G, Line, Text as SvgText } from 'react-native-svg';

import {
  generateLevel,
  preloadLevelBatch,
  levelCache,
} from '../utils/levelGenerator';

import RatingModal from '../components/RatingModal';
import DailyRewardModal from '../components/DailyRewardModal';
import CoinShopModal from '../components/CoinShopModal';
import UpdateModal, { compareVersions } from '../components/UpdateModal';
import { APP_VERSION } from '../constants/appVersion';

import { getCoins, getHints, getDailyRewardStatus } from '../utils/CoinManager';
import { getProfile, getDailyAchievements } from '../utils/ProfileManager';
import { useTheme } from '../constants/theme';
import { DEFAULT_AVATAR } from '../constants/avatars';
import RemoteConfigService from '../services/RemoteConfigService';
import AdManager from '../ads/AdManager';

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const PlayIcon = ({ color = '#000' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path d="M8 5v14l11-7z" fill={color} />
  </Svg>
);

const SettingsIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round"
    />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Premium 2x2 Hub Card for main app destinations. */
const HubCard = ({ icon, label, sub, tint, badge, dot, onPress, theme }) => {
  const styles = getStyles(theme);
  return (
    <TouchableOpacity style={styles.hubCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.hubCardTop}>
        <View style={[styles.hubCardGlyph, { backgroundColor: `${tint}1c`, borderColor: `${tint}4d` }]}>
          <Text style={styles.hubCardIcon}>{icon}</Text>
        </View>
        {badge != null && badge > 0 && (
          <View style={[styles.hubCardBadge, { backgroundColor: theme.bad || '#f87171' }]}>
            <Text style={styles.hubCardBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
        {dot && (
          <View style={[styles.hubCardDot, { backgroundColor: tint }]} />
        )}
      </View>
      <View style={styles.hubCardBottom}>
        <Text style={styles.hubCardLabel} numberOfLines={1}>{label}</Text>
        <Text style={[styles.hubCardSub, { color: tint }]} numberOfLines={1}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [displayLevel, setDisplayLevel] = useState(null);
  const [ready, setReady] = useState(false);

  const [coins, setCoins] = useState(0);
  const [hints, setHints] = useState(0);
  const [claimableQuestsCount, setClaimableQuestsCount] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);

  const [showShop, setShowShop] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);

  // ── Profile / Avatar & Update Modal State ───────────────────────────────
  const [playerName, setPlayerName] = useState('Flow Solver');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR.url);
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR.id);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  const heroPulse = useRef(new Animated.Value(0)).current;
  const coinScale = useRef(new Animated.Value(1)).current;
  const pregen = useRef(null);

  const LS_LEVEL = 'zipCurrentLevel';

  // ── Version Check (Remote Config) & Early Ad Warmup ─────────────────────────
  useEffect(() => {
    try {
      const config = RemoteConfigService.getAdsConfig();
      if (config?.ads?.update_info) {
        const info = config.ads.update_info;
        setUpdateInfo(info);
        const currentVersion = APP_VERSION; // ✅ appVersion.js se aata hai
        if (compareVersions(currentVersion, info.latest_version) < 0) {
          setShowUpdateModal(true);
        }
      }
    } catch (e) {
      console.warn('[HomeScreen] Version check error:', e);
    }

    // 🚀 Warm up ads early so rewards and interstitials are ready when user interacts
    try {
      AdManager.preloadAd('rewarded');
      AdManager.preloadAd('inter');
    } catch (adErr) {
      console.log('[HomeScreen] Early ad preload warning:', adErr);
    }
  }, []);

  // ── Hero breathing animation ─────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, {
          toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(heroPulse, {
          toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroPulse]);

  // ── Balance & Quest Status Refresh ───────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    setCoins(await getCoins());
    setHints(await getHints());

    try {
      const p = await getProfile();
      if (p) {
        if (p.playerName) setPlayerName(p.playerName);
        if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
        if (p.avatarId) setAvatarId(p.avatarId);
      }
    } catch (e) {
      console.warn('[HomeScreen] Profile load error:', e);
    }

    try {
      const dailyStatus = await getDailyRewardStatus();
      setCanClaimDaily(dailyStatus?.canClaim ?? false);

      const dailyAch = await getDailyAchievements();
      const claimableCount = dailyAch.filter(x => x.completed && !x.claimed).length;

      setClaimableQuestsCount(claimableCount);
    } catch (e) {
      console.error('Failed to load daily achievements on home:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshBalance();

      AsyncStorage.getItem(LS_LEVEL)
        .then((v) => {
          const n = Math.max(1, parseInt(v || '1', 10));
          setDisplayLevel(n);
          return n;
        })
        .then((n) => {
          InteractionManager.runAfterInteractions(() => {
            preloadLevelBatch(n);
            const data = levelCache.get(n) || generateLevel(n);
            levelCache.set(n, data);
            pregen.current = { levelNum: n, levelData: data };
            setReady(true);
          });
        })
        .catch(() => {
          InteractionManager.runAfterInteractions(() => {
            preloadLevelBatch(1);
            const data = levelCache.get(1) || generateLevel(1);
            levelCache.set(1, data);
            pregen.current = { levelNum: 1, levelData: data };
            setDisplayLevel(1);
            setReady(true);
          });
        });
    }, [refreshBalance])
  );

  const popCoin = useCallback(() => {
    Animated.sequence([
      Animated.timing(coinScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(coinScale, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [coinScale]);

  const handlePlay = () => {
    if (!pregen.current) return;
    navigation.navigate('Game', {
      pregenLevelNum: pregen.current.levelNum,
      pregenLevelData: pregen.current.levelData,
    });
  };

  const handleSpin = () => {
    navigation.navigate('SpinWheel');
  };

  const handleQuests = () => {
    navigation.navigate('Profile', { initialTab: 'missions' });
  };

  const handleDailyClaimed = async () => {
    popCoin();
    await refreshBalance();
  };

  const heroScale = heroPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* ── Header Bar: Player Profile Pill · Coin Pill · Settings ────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profilePill}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.headerAvatarRing}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.headerAvatarImg}
              resizeMode="cover"
            />
          </View>
          <View style={styles.profilePillInfo}>
            <Text style={styles.profilePillName} numberOfLines={1}>
              {playerName}
            </Text>
            <Text style={styles.profilePillLevel}>
              LEVEL {displayLevel || 1}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowShop(true)}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.coinPill, { transform: [{ scale: coinScale }] }]}>
              <Text style={styles.coinPillIcon}>🪙</Text>
              <Text style={styles.coinPillText}>{coins}</Text>
              <Text style={styles.coinPillDivider}>|</Text>
              <Text style={styles.coinPillIcon}>💡</Text>
              <Text style={styles.coinPillText}>{hints}</Text>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Settings')}
          >
            <SettingsIcon color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

        {/* ── Brand Hero Showcase (Centerpiece) ── */}
        <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
          <PuzzleHeroEmblem theme={theme} />
          <View style={styles.systemStatusPill}>
            <View style={[styles.systemStatusDot, { backgroundColor: theme.good || '#34d399' }]} />
            <Text style={styles.systemStatusText}>SYSTEM ONLINE</Text>
          </View>
          <Text style={styles.heroTitle}>NUMBER LINK</Text>
          <Text style={styles.heroSubtitle}>PUZZLE</Text>
          <Text style={styles.heroTagline}>CONNECT  •  FLOW  •  SOLVE</Text>
        </Animated.View>

        {/* ── Primary 3D Play Button ── */}
        <TouchableOpacity
          style={[styles.playBtn, !ready && styles.playBtnDisabled]}
          activeOpacity={0.88}
          onPress={handlePlay}
          disabled={!ready}
        >
          {ready ? (
            <PlayIcon color={theme.background || '#000000'} />
          ) : (
            <ActivityIndicator color={theme.background || '#000000'} size="small" />
          )}
          <Text style={styles.playText}>PLAY</Text>
          {displayLevel != null && (
            <View style={styles.playLevelBadge}>
              <Text style={styles.playLevelText}>LEVEL {displayLevel}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── 4-Card Gaming Action Hub (2x2 Balanced Deck) ── */}
        <View style={styles.hubGrid}>
          <HubCard
            icon="🛍️"
            label="Shop"
            sub="40 Themes"
            tint={theme.primaryLight || '#60a5fa'}
            onPress={() => setShowShop(true)}
            theme={theme}
          />
          <HubCard
            icon="🎡"
            label="Lucky Spin"
            sub="Win Coins"
            tint={theme.warn || '#fbbf24'}
            onPress={handleSpin}
            theme={theme}
          />
          <HubCard
            icon="🏆"
            label="Quests"
            sub="50 Missions"
            tint={theme.good || '#34d399'}
            badge={claimableQuestsCount}
            onPress={handleQuests}
            theme={theme}
          />
          <HubCard
            icon="🎁"
            label="Daily Gift"
            sub={canClaimDaily ? 'Ready!' : 'Claimed'}
            tint={theme.warn || '#fbbf24'}
            dot={canClaimDaily}
            onPress={() => setShowDailyReward(true)}
            theme={theme}
          />
        </View>

      </ScrollView>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <RatingModal />

      <DailyRewardModal
        visible={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        onClaimed={handleDailyClaimed}
      />

      <CoinShopModal
        visible={showShop}
        onClose={() => setShowShop(false)}
        onUpdate={refreshBalance}
      />

      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        currentVersion={APP_VERSION}
        onClose={() => setShowUpdateModal(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Theme Styles
// ─────────────────────────────────────────────────────────────────────────────
const PuzzleHeroEmblem = ({ theme }) => {
  const primary = theme.primary || '#38bdf8';
  const light = theme.primaryLight || '#93c5fd';
  const good = theme.good || '#34d399';

  return (
    <Svg width="150" height="120" viewBox="0 0 200 160" fill="none">
      <Defs>
        <LinearGradient id="heroCardGrad" x1="0" y1="0" x2="200" y2="160" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={primary} stopOpacity={0.16} />
          <Stop offset="100%" stopColor={primary} stopOpacity={0.03} />
        </LinearGradient>
        <LinearGradient id="heroLineGrad" x1="40" y1="40" x2="160" y2="120" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={light} />
          <Stop offset="50%" stopColor={primary} />
          <Stop offset="100%" stopColor="#00f2fe" />
        </LinearGradient>
      </Defs>

      {/* Cyber shield background */}
      <Rect
        x="10"
        y="10"
        width="180"
        height="140"
        rx="28"
        fill="url(#heroCardGrad)"
        stroke={primary}
        strokeWidth="1.5"
        strokeOpacity={0.35}
      />

      {/* Grid ambient dots */}
      <Circle cx="50" cy="45" r="2" fill={light} opacity={0.35} />
      <Circle cx="100" cy="45" r="2" fill={light} opacity={0.35} />
      <Circle cx="150" cy="45" r="2" fill={light} opacity={0.35} />
      <Circle cx="50" cy="80" r="2" fill={light} opacity={0.35} />
      <Circle cx="100" cy="80" r="2" fill={light} opacity={0.35} />
      <Circle cx="150" cy="80" r="2" fill={light} opacity={0.35} />
      <Circle cx="50" cy="115" r="2" fill={light} opacity={0.35} />
      <Circle cx="100" cy="115" r="2" fill={light} opacity={0.35} />
      <Circle cx="150" cy="115" r="2" fill={light} opacity={0.35} />

      {/* Connected Neon Laser Path (1 -> 2 -> 3 -> 4) */}
      <Path
        d="M 50 45 L 150 45 L 150 115 L 50 115"
        fill="none"
        stroke={primary}
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.3}
      />
      <Path
        d="M 50 45 L 150 45 L 150 115 L 50 115"
        fill="none"
        stroke="url(#heroLineGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 50 45 L 150 45 L 150 115 L 50 115"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />

      {/* Numbered Power Nodes */}
      <Circle cx="50" cy="45" r="14" fill={theme.surfaceRaised || '#1c2d3a'} stroke={primary} strokeWidth="2.5" />
      <SvgText x="50" y="50" fontSize="12" fontWeight="900" fill="#ffffff" textAnchor="middle">1</SvgText>

      <Circle cx="150" cy="45" r="14" fill={theme.surfaceRaised || '#1c2d3a'} stroke={primary} strokeWidth="2.5" />
      <SvgText x="150" y="50" fontSize="12" fontWeight="900" fill="#ffffff" textAnchor="middle">2</SvgText>

      <Circle cx="150" cy="115" r="14" fill={theme.surfaceRaised || '#1c2d3a'} stroke={primary} strokeWidth="2.5" />
      <SvgText x="150" y="120" fontSize="12" fontWeight="900" fill="#ffffff" textAnchor="middle">3</SvgText>

      <Circle cx="50" cy="115" r="14" fill={theme.surfaceRaised || '#1c2d3a'} stroke={good} strokeWidth="2.5" />
      <SvgText x="50" y="120" fontSize="12" fontWeight="900" fill={good} textAnchor="middle">4</SvgText>
    </Svg>
  );
};

const getStyles = (theme) => {
  const good = theme.good || '#34d399';
  const warn = theme.warn || '#fbbf24';
  const bad = theme.bad || '#f87171';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profilePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceRaised,
      borderWidth: 1.5,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      borderRadius: 24,
      paddingLeft: 4,
      paddingRight: 12,
      paddingVertical: 4,
      maxWidth: 165,
    },
    headerAvatarRing: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      borderWidth: 1.5,
      borderColor: '#8B5CF6',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginRight: 6,
    },
    headerAvatarImg: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    profilePillInfo: {
      flexDirection: 'column',
      justifyContent: 'center',
    },
    profilePillName: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    profilePillLevel: {
      color: '#8B5CF6',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    levelChip: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      backgroundColor: theme.surfaceRaised,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    levelChipLabel: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
    },
    levelChipValue: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '900',
    },
    coinPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.4)',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    coinPillIcon: {
      fontSize: 13,
    },
    coinPillText: {
      color: warn,
      fontSize: 14,
      fontWeight: '900',
    },
    coinPillDivider: {
      color: theme.border,
      fontSize: 12,
      marginHorizontal: 2,
    },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: theme.surfaceRaised,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollBody: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 24,
      gap: 18,
    },
    heroSection: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    systemStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(52,211,153,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(52,211,153,0.3)',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: 12,
      marginBottom: 6,
    },
    systemStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    systemStatusText: {
      color: good,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 2,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: 28,
      fontWeight: '900',
      color: theme.primary,
      letterSpacing: 6,
      textAlign: 'center',
      marginTop: -2,
    },
    heroTagline: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.muted || '#94A3B8',
      letterSpacing: 2,
      textAlign: 'center',
      marginTop: 6,
    },
    playBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      width: '100%',
      maxWidth: 340,
      height: 58,
      backgroundColor: theme.primary,
      borderRadius: 20,
      elevation: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      marginVertical: 4,
    },
    playBtnDisabled: {
      opacity: 0.5,
    },
    playText: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.background || '#000000',
      letterSpacing: 3,
    },
    playLevelBadge: {
      backgroundColor: 'rgba(0,0,0,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.22)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginLeft: 4,
    },
    playLevelText: {
      fontSize: 11,
      fontWeight: '900',
      color: theme.background || '#000000',
      letterSpacing: 0.5,
    },
    hubGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      width: '100%',
      maxWidth: 360,
      justifyContent: 'space-between',
    },
    hubCard: {
      width: '48%',
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 13,
      gap: 10,
    },
    hubCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    hubCardGlyph: {
      width: 42,
      height: 42,
      borderRadius: 13,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hubCardIcon: {
      fontSize: 20,
    },
    hubCardBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hubCardBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '900',
    },
    hubCardDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    hubCardBottom: {
      gap: 2,
    },
    hubCardLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
    },
    hubCardSub: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
};