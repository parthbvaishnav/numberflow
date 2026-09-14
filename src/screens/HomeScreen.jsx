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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

import {
  generateLevel,
  preloadLevelBatch,
  levelCache,
} from '../utils/levelGenerator';

import RatingModal from '../components/RatingModal';
import DailyRewardModal from '../components/DailyRewardModal';
import CoinShopModal from '../components/CoinShopModal';
import SettingsModal from '../components/SettingsModal';

import { getCoins, getHints, getDailyRewardStatus } from '../utils/CoinManager';
import { getDailyMissions, getAchievements } from '../utils/ProfileManager';
import { useTheme } from '../constants/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const PlayIcon = ({ color = '#000' }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24">
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

/** Round action orb flanking the title. */
const TitleAction = ({ icon, label, tint, badge, onPress, theme }) => {
  const styles = getStyles(theme);
  return (
    <TouchableOpacity style={styles.titleAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.titleActionOrb, { borderColor: tint, backgroundColor: `${tint}1a` }]}>
        <Text style={styles.titleActionIcon}>{icon}</Text>
        {badge != null && badge > 0 && (
          <View style={styles.titleActionBadge}>
            <Text style={styles.titleActionBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.titleActionLabel, { color: tint }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
};

/** Wide action tile in the bottom row. */
const ActionTile = ({ icon, label, sub, tint, dot, onPress, theme }) => {
  const styles = getStyles(theme);
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.tileGlyph, { backgroundColor: `${tint}1f`, borderColor: `${tint}59` }]}>
        <Text style={styles.tileIcon}>{icon}</Text>
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
      <Text style={[styles.tileSub, { color: tint }]} numberOfLines={1}>{sub}</Text>
      {dot && <View style={[styles.tileDot, { backgroundColor: tint }]} />}
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
  const [showSettings, setShowSettings] = useState(false);

  const heroPulse = useRef(new Animated.Value(0)).current;
  const coinScale = useRef(new Animated.Value(1)).current;
  const pregen = useRef(null);

  const LS_LEVEL = 'zipCurrentLevel';

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
      const dailyStatus = await getDailyRewardStatus();
      setCanClaimDaily(dailyStatus?.canClaim ?? false);

      const m = await getDailyMissions();
      const claimableM = m.filter(x => x.progress >= x.target && !x.claimed).length;

      const a = await getAchievements();
      const claimableA = a.filter(x => x.completed && !x.claimed).length;

      setClaimableQuestsCount(claimableM + claimableA);
    } catch (e) {
      console.error('Failed to load missions/achievements on home:', e);
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

      {/* ── Header Bar: Level Chip · Coin Pill · Settings ────────────────── */}
      <View style={styles.header}>
        <View style={styles.levelChip}>
          <Text style={styles.levelChipLabel}>LEVEL</Text>
          <Text style={styles.levelChipValue}>{displayLevel || 1}</Text>
        </View>

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
            onPress={() => setShowSettings(true)}
          >
            <SettingsIcon color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

        {/* ── Title Row: Spin — TITLE — Quests ──────────────────────────── */}
        <View style={styles.titleRow}>
          <TitleAction
            icon="🎡"
            label="Spin"
            tint={theme.warn || '#fbbf24'}
            onPress={handleSpin}
            theme={theme}
          />
          <View style={{ alignItems: 'center' }} pointerEvents="none">
            <BrainIcon />
            <View style={styles.titleCenter}>
              <Text style={styles.eyebrow}>SYSTEM ONLINE</Text>
              <Text style={styles.title}>NUMBER LINK</Text>
              <Text style={styles.titleAlt}>PUZZLE</Text>
            </View>
          </View>

          <TitleAction
            icon="🏆"
            label="Quests"
            tint={theme.good || '#34d399'}
            badge={claimableQuestsCount}
            onPress={handleQuests}
            theme={theme}
          />
        </View>

        {/* ── Animated Hero ─────────────────────────────────────────────── */}


        {/* ── Primary Play Button ───────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.playBtn, !ready && styles.playBtnDisabled]}
          activeOpacity={0.88}
          onPress={handlePlay}
          disabled={!ready}
        >
          {ready ? (
            <PlayIcon color={theme.background} />
          ) : (
            <ActivityIndicator color={theme.background} size="small" />
          )}
          <Text style={styles.playText}>PLAY</Text>
          {displayLevel != null && (
            <Text style={styles.levelBadgeText}>LEVEL {displayLevel}</Text>
          )}
        </TouchableOpacity>

        {/* ── Action Tiles Row ──────────────────────────────────────────── */}
        <View style={styles.tileRow}>
          <ActionTile
            icon="🛍️"
            label="Shop"
            sub="Skins & boosts"
            tint={theme.primaryLight || '#60a5fa'}
            onPress={() => setShowShop(true)}
            theme={theme}
          />
          <ActionTile
            icon="⚡"
            label="Game"
            sub="Level Play"
            tint={theme.bad || '#f87171'}
            onPress={handlePlay}
            theme={theme}
          />
          <ActionTile
            icon="🎁"
            label="Reward"
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

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Theme Styles
// ─────────────────────────────────────────────────────────────────────────────
const BrainIcon = () => {
  const { theme } = useTheme();
  const primary = theme.primary || '#38bdf8';
  const light = theme.primaryLight || '#93c5fd';

  return (
    <Svg width="150" height="95" viewBox="0 0 240 120" fill="none">
      <Defs>
        <LinearGradient id="nlpGrad" x1="0" y1="0" x2="240" y2="120" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={light} />
          <Stop offset="50%" stopColor={primary} />
          <Stop offset="100%" stopColor="#00e5ff" />
        </LinearGradient>
        <LinearGradient id="nlpBg" x1="0" y1="0" x2="240" y2="120" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor={primary} stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#00e5ff" stopOpacity={0.03} />
        </LinearGradient>
      </Defs>

      {/* Outer rounded capsule border */}
      <Rect
        x="6"
        y="6"
        width="228"
        height="108"
        rx="24"
        fill="url(#nlpBg)"
        stroke={primary}
        strokeWidth="1.5"
        strokeOpacity={0.35}
      />

      {/* Decorative corner target pins */}
      <Circle cx="24" cy="24" r="2.5" fill={light} opacity={0.4} />
      <Circle cx="216" cy="24" r="2.5" fill={light} opacity={0.4} />
      <Circle cx="24" cy="96" r="2.5" fill={light} opacity={0.4} />
      <Circle cx="216" cy="96" r="2.5" fill={light} opacity={0.4} />

      {/* Interconnecting dashed puzzle link between N - L - P */}
      <Path
        d="M 72 82 C 86 82, 90 38, 104 38 S 128 82, 138 82 S 154 38, 168 38"
        fill="none"
        stroke={primary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 6"
        opacity={0.45}
      />

      {/* ── Letter N ────────────────────────────────────── */}
      {/* Glow Layer */}
      <Path
        d="M 38 82 L 38 38 L 72 82 L 72 38"
        fill="none"
        stroke={light}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.25}
      />
      {/* Core Stroke */}
      <Path
        d="M 38 82 L 38 38 L 72 82 L 72 38"
        fill="none"
        stroke="url(#nlpGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* N Nodes */}
      <Circle cx="38" cy="38" r="5" fill="#ffffff" />
      <Circle cx="38" cy="38" r="2.5" fill={primary} />
      <Circle cx="72" cy="82" r="5" fill="#ffffff" />
      <Circle cx="72" cy="82" r="2.5" fill={primary} />

      {/* ── Letter L ────────────────────────────────────── */}
      {/* Glow Layer */}
      <Path
        d="M 104 38 L 104 82 L 138 82"
        fill="none"
        stroke={light}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.25}
      />
      {/* Core Stroke */}
      <Path
        d="M 104 38 L 104 82 L 138 82"
        fill="none"
        stroke="url(#nlpGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* L Nodes */}
      <Circle cx="104" cy="38" r="5" fill="#ffffff" />
      <Circle cx="104" cy="38" r="2.5" fill={primary} />
      <Circle cx="138" cy="82" r="5" fill="#ffffff" />
      <Circle cx="138" cy="82" r="2.5" fill={primary} />

      {/* ── Letter P ────────────────────────────────────── */}
      {/* Glow Layer */}
      <Path
        d="M 168 82 L 168 38 C 188 38, 202 40, 202 54 C 202 68, 188 70, 168 70"
        fill="none"
        stroke={light}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.25}
      />
      {/* Core Stroke */}
      <Path
        d="M 168 82 L 168 38 C 188 38, 202 40, 202 54 C 202 68, 188 70, 168 70"
        fill="none"
        stroke="url(#nlpGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* P Nodes */}
      <Circle cx="168" cy="82" r="5" fill="#ffffff" />
      <Circle cx="168" cy="82" r="2.5" fill={primary} />
      <Circle cx="202" cy="54" r="5" fill="#ffffff" />
      <Circle cx="202" cy="54" r="2.5" fill={primary} />
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
      paddingHorizontal: 18,
      paddingBottom: 24,
      gap: 20,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      width: '100%',
      gap: 8,
    },
    titleCenter: {
      flex: 1,
      alignItems: 'center',
    },
    eyebrow: {
      color: theme.primaryLight || '#60a5fa',
      fontSize: 10,
      letterSpacing: 3,
      fontWeight: '700',
      textAlign: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 2.5,
      marginTop: 3,
      textAlign: 'center',
    },
    titleAlt: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.primary,
      letterSpacing: 5,
      textAlign: 'center',
    },
    titleAction: {
      alignItems: 'center',
      width: 64,
      gap: 6,
    },
    titleActionOrb: {
      width: 54,
      height: 54,
      borderRadius: 27,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleActionIcon: {
      fontSize: 24,
    },
    titleActionLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    titleActionBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 21,
      height: 21,
      borderRadius: 11,
      paddingHorizontal: 5,
      backgroundColor: bad,
      borderWidth: 2,
      borderColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleActionBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '900',
    },
    heroWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: {
      width: 186,
      height: 186,
      borderRadius: 28,
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    puzzleIcon: {
      width: 130,
      height: 130,
      position: 'relative',
    },
    puzzleCell: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.surfaceRaised,
      borderWidth: 1,
      borderColor: theme.border,
    },
    puzzleCellActive: {
      backgroundColor: 'rgba(77,169,255,0.16)',
      borderColor: theme.primary,
    },
    puzzleLine1: {
      position: 'absolute',
      top: 17,
      left: 18,
      width: 96,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.primary,
      opacity: 0.65,
    },
    puzzleLine2: {
      position: 'absolute',
      top: 17,
      left: 110,
      width: 3,
      height: 96,
      borderRadius: 2,
      backgroundColor: theme.primary,
      opacity: 0.65,
    },
    playBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
      maxWidth: 320,
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 20,
      elevation: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
    },
    playBtnDisabled: {
      opacity: 0.5,
    },
    playText: {
      fontSize: 19,
      fontWeight: '900',
      color: theme.background,
      letterSpacing: 3,
    },
    levelBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.background,
      opacity: 0.85,
      marginLeft: 4,
    },
    tileRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      maxWidth: 380,
    },
    tile: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    tileGlyph: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileIcon: {
      fontSize: 21,
    },
    tileLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
    },
    tileSub: {
      fontSize: 10,
      fontWeight: '700',
    },
    tileDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 9,
      height: 9,
      borderRadius: 5,
    },
  });
};