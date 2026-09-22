// src/screens/ProfileScreen.jsx
// 50 Daily Achievements System with Midnight Reset & Dynamic Theme Styling

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../constants/theme';
import {
  getDailyAchievements,
  claimDailyAchievement,
  getProfile,
} from '../utils/ProfileManager';

const { width } = Dimensions.get('window');

const BackArrowIcon = ({ color = '#fff' }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ color = '#fff', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '🏆' },
  { key: 'levels', label: 'Levels', icon: '🎯' },
  { key: 'nohint', label: 'No Hint', icon: '⚡' },
  { key: 'coins', label: 'Coins', icon: '🪙' },
  { key: 'spend', label: 'Spend', icon: '💎' },
  { key: 'hints', label: 'Hints', icon: '💡' },
  { key: 'activity', label: 'Activity', icon: '🎡' },
];

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = Math.max(0, midnight - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [claimingId, setClaimingId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilMidnight());
  const [todayCoinsEarned, setTodayCoinsEarned] = useState(0);

  // Midnight countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilMidnight();
      setTimeRemaining(remaining);
      if (remaining === '00:00:00') {
        loadData();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [list, profile] = await Promise.all([
        getDailyAchievements(),
        getProfile(),
      ]);
      setAchievements(list || []);
      setTodayCoinsEarned(profile?.coinsEarnedToday || 0);
    } catch (e) {
      console.warn('[ProfileScreen] Failed to load daily achievements:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleClaim = async (taskId) => {
    if (claimingId) return;
    setClaimingId(taskId);
    try {
      const res = await claimDailyAchievement(taskId);
      if (res?.success) {
        Alert.alert('Reward Claimed!', `🪙 +${res.rewardCoins} Coins added to your balance!`);
        await loadData();
      } else {
        Alert.alert('Unable to Claim', 'This reward could not be claimed.');
      }
    } catch (err) {
      console.error('Claim error:', err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimAll = async () => {
    const claimable = achievements.filter((a) => a.completed && !a.claimed);
    if (claimable.length === 0) return;

    setClaimingId('all');
    let totalClaimed = 0;
    for (const item of claimable) {
      const res = await claimDailyAchievement(item.id);
      if (res?.success) totalClaimed += res.rewardCoins;
    }
    setClaimingId(null);
    Alert.alert('All Rewards Claimed!', `🎉 You claimed 🪙 +${totalClaimed} Coins!`);
    await loadData();
  };

  // Stats
  const totalCount = achievements.length;
  const completedCount = achievements.filter((a) => a.completed).length;
  const claimedCount = achievements.filter((a) => a.claimed).length;
  const claimableCount = achievements.filter((a) => a.completed && !a.claimed).length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered List
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <BackArrowIcon color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Daily Achievements</Text>
          <Text style={styles.headerSubtitle}>50 Daily Quests · Resets Daily</Text>
        </View>

        <View style={styles.timerBadge}>
          <Text style={styles.timerIcon}>⏳</Text>
          <Text style={styles.timerText}>{timeRemaining}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Overview Progress Banner ──────────────────────────── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <View>
              <Text style={styles.bannerEyebrow}>TODAY'S PROGRESS</Text>
              <Text style={styles.bannerTitle}>
                {completedCount} <Text style={styles.bannerTotal}>/ {totalCount || 50}</Text> Completed
              </Text>
            </View>

            <View style={styles.bannerPill}>
              <Text style={styles.bannerPillText}>{completionPercentage}%</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, completionPercentage)}%` },
              ]}
            />
          </View>

          {/* Banner Footer */}
          <View style={styles.bannerFooter}>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatIcon}>🪙</Text>
              <Text style={styles.bannerStatLabel}>Earned Today:</Text>
              <Text style={styles.bannerStatVal}>{todayCoinsEarned}</Text>
            </View>

            {claimableCount > 0 && (
              <TouchableOpacity
                style={styles.claimAllBtn}
                activeOpacity={0.8}
                onPress={handleClaimAll}
                disabled={claimingId !== null}
              >
                {claimingId === 'all' ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.claimAllBtnText}>CLAIM ALL ({claimableCount})</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Category Filter Chips ─────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.key;
            const count =
              cat.key === 'all'
                ? achievements.length
                : achievements.filter((a) => a.category === cat.key).length;

            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={styles.chipIcon}>{cat.icon}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
                <View style={[styles.chipCountBadge, active && styles.chipCountBadgeActive]}>
                  <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Achievements List ─────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading daily achievements...</Text>
          </View>
        ) : filteredAchievements.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No achievements in this category</Text>
          </View>
        ) : (
          filteredAchievements.map((item, idx) => {
            const isCompleted = item.completed;
            const isClaimed = item.claimed;
            const isClaimable = isCompleted && !isClaimed;
            const pct = Math.min(100, Math.round((item.progress / item.target) * 100));

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isClaimable && styles.cardClaimable,
                  isClaimed && styles.cardClaimed,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <Text style={styles.cardIcon}>{item.icon || '🎯'}</Text>
                  </View>

                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardDesc}>{item.desc}</Text>
                  </View>

                  {/* Reward Badge */}
                  <View style={styles.rewardPill}>
                    <Text style={styles.rewardCoinIcon}>🪙</Text>
                    <Text style={styles.rewardAmount}>+{item.rewardCoins}</Text>
                  </View>
                </View>

                {/* Progress bar row */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.cardProgressWrap}>
                    <View style={styles.cardProgressTrack}>
                      <View
                        style={[
                          styles.cardProgressFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: isCompleted
                              ? theme.good || '#10b981'
                              : theme.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.cardProgressText}>
                      {item.progress} / {item.target} ({pct}%)
                    </Text>
                  </View>

                  {/* Action Button */}
                  {isClaimed ? (
                    <View style={styles.claimedBadge}>
                      <CheckIcon color={theme.good || '#10b981'} size={14} />
                      <Text style={styles.claimedText}>CLAIMED</Text>
                    </View>
                  ) : isClaimable ? (
                    <TouchableOpacity
                      style={styles.claimBtn}
                      activeOpacity={0.8}
                      onPress={() => handleClaim(item.id)}
                      disabled={claimingId === item.id}
                    >
                      {claimingId === item.id ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.claimBtnText}>CLAIM</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.inProgressBadge}>
                      <Text style={styles.inProgressText}>IN PROGRESS</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Theme Stylesheet
// ─────────────────────────────────────────────────────────────────────────────
function getStyles(theme) {
  const isDark = theme.dark !== false;
  const primary = theme.primary || '#38bdf8';
  const good = theme.good || '#10b981';
  const warn = theme.warn || '#fbbf24';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border || 'rgba(255,255,255,0.08)',
      backgroundColor: theme.surface,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headerTitleWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontSize: 11,
      color: theme.textSecondary || theme.muted || 'rgba(255,255,255,0.5)',
      marginTop: 2,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(217,119,6,0.12)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251,191,36,0.25)' : 'rgba(217,119,6,0.25)',
    },
    timerIcon: {
      fontSize: 12,
      marginRight: 4,
    },
    timerText: {
      fontSize: 11,
      fontWeight: '700',
      color: warn,
      fontVariant: ['tabular-nums'],
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },

    // ── Progress Banner ──────────────────────────────────────────
    bannerCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255,255,255,0.08)',
      marginBottom: 16,
    },
    bannerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    bannerEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      color: primary,
      letterSpacing: 1,
      marginBottom: 2,
    },
    bannerTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.text,
    },
    bannerTotal: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary || 'rgba(255,255,255,0.5)',
    },
    bannerPill: {
      backgroundColor: primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    bannerPillText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#000',
    },
    progressBarTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
      marginBottom: 14,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: primary,
      borderRadius: 4,
    },
    bannerFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bannerStat: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bannerStatIcon: {
      fontSize: 14,
      marginRight: 4,
    },
    bannerStatLabel: {
      fontSize: 12,
      color: theme.textSecondary || 'rgba(255,255,255,0.6)',
      marginRight: 4,
    },
    bannerStatVal: {
      fontSize: 13,
      fontWeight: '800',
      color: warn,
    },
    claimAllBtn: {
      backgroundColor: good,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 12,
    },
    claimAllBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#000',
      letterSpacing: 0.5,
    },

    // ── Chips ───────────────────────────────────────────────────
    chipsRow: {
      paddingBottom: 14,
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255,255,255,0.08)',
    },
    chipActive: {
      backgroundColor: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(14,165,233,0.18)',
      borderColor: primary,
    },
    chipIcon: {
      fontSize: 13,
      marginRight: 6,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary || 'rgba(255,255,255,0.7)',
    },
    chipTextActive: {
      color: primary,
    },
    chipCountBadge: {
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.1)',
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginLeft: 6,
    },
    chipCountBadgeActive: {
      backgroundColor: primary,
    },
    chipCountText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSecondary || 'rgba(255,255,255,0.7)',
    },
    chipCountTextActive: {
      color: '#000',
    },

    // ── Achievement Cards ───────────────────────────────────────
    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255,255,255,0.06)',
    },
    cardClaimable: {
      borderColor: good,
      backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
    },
    cardClaimed: {
      opacity: 0.65,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    cardIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    cardIcon: {
      fontSize: 20,
    },
    cardTextWrap: {
      flex: 1,
      marginRight: 8,
    },
    cardName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    cardDesc: {
      fontSize: 12,
      color: theme.textSecondary || 'rgba(255,255,255,0.6)',
    },
    rewardPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(217,119,6,0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251,191,36,0.25)' : 'rgba(217,119,6,0.25)',
    },
    rewardCoinIcon: {
      fontSize: 11,
      marginRight: 3,
    },
    rewardAmount: {
      fontSize: 11,
      fontWeight: '800',
      color: warn,
    },
    cardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardProgressWrap: {
      flex: 1,
      marginRight: 12,
    },
    cardProgressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
      marginBottom: 4,
    },
    cardProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    cardProgressText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.textSecondary || 'rgba(255,255,255,0.5)',
    },

    // Button states
    claimedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.3)',
    },
    claimedText: {
      fontSize: 10,
      fontWeight: '800',
      color: good,
      marginLeft: 4,
    },
    claimBtn: {
      backgroundColor: good,
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 10,
    },
    claimBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#000',
      letterSpacing: 0.5,
    },
    inProgressBadge: {
      backgroundColor: theme.surfaceAlt || 'rgba(255,255,255,0.06)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    inProgressText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSecondary || 'rgba(255,255,255,0.4)',
    },

    loadingBox: {
      paddingVertical: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 13,
      color: theme.textSecondary || 'rgba(255,255,255,0.6)',
      marginTop: 10,
    },
    emptyBox: {
      paddingVertical: 60,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 36,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 13,
      color: theme.textSecondary || 'rgba(255,255,255,0.5)',
    },
  });
}
