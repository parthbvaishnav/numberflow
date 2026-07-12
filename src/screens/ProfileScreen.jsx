// src/screens/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  FlatList,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, themes } from '../constants/theme';
import AdManager from '../ads/AdManager';
import {
  getProfile,
  restoreStreak,
  saveProfile,
  AVATARS,
  RANKS,
  AVATAR_COSTS,
  getNextRankInfo,
  unlockAvatar,
  unlockTheme,
  getDailyMissions,
  claimMissionReward,
  getAchievements,
  claimAchievementReward,
} from '../utils/ProfileManager';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, setTheme, themeId } = useTheme();
  const styles = getStyles(theme);

  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [missions, setMissions] = useState([]);
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'missions');

  const hasClaimableMissions = profile ? missions.some(m => m.progress >= m.target && !profile.claimedMissions.includes(m.id)) : false;
  const hasClaimableAchievements = achievements.some(a => a.completed && !a.claimed);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleRestoreStreak = async () => {
    setActionLoading(true);
    try {
      const rewarded = await AdManager.showAd('rewarded', async () => {
        const updated = await restoreStreak();
        setProfile(updated);
        Alert.alert('Streak Restored', '🔥 Your daily streak has been restored!');
      });
      if (!rewarded) {
        Alert.alert('Ad Error', 'Ad not available or was closed early. Try again later.');
      }
    } catch (err) {
      console.error('Failed to restore streak:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatPlayTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Sync initialTab when route params change
  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getProfile();
      setProfile(p);
      setNewName(p.playerName);

      const m = await getDailyMissions();
      setMissions(m);

      const a = await getAchievements();
      setAchievements(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setActionLoading(true);
    try {
      const updated = { ...profile, playerName: newName.trim() };
      await saveProfile(updated);
      setProfile(updated);
      setEditingName(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save name');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectAvatar = async (avatar) => {
    const isUnlocked = profile.unlockedAvatars.includes(avatar);
    const cost = AVATAR_COSTS[avatar] || 0;

    if (!isUnlocked) {
      Alert.alert(
        'Unlock Avatar',
        `Unlock this avatar for 🪙 ${cost} coins?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unlock',
            onPress: async () => {
              if (profile.coins < cost) {
                Alert.alert('Error', 'Insufficient coins');
                return;
              }
              setActionLoading(true);
              try {
                const success = await unlockAvatar(avatar, cost);
                if (success) {
                  const updated = await getProfile();
                  setProfile(updated);
                } else {
                  Alert.alert('Error', 'Failed to unlock avatar');
                }
              } catch (err) {
                console.error(err);
              } finally {
                setActionLoading(false);
              }
            },
          },
        ]
      );
    } else {
      setActionLoading(true);
      try {
        const updated = { ...profile, avatar };
        await saveProfile(updated);
        setProfile(updated);
        setShowAvatarModal(false);
      } catch (err) {
        console.error(err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleUnlockTheme = async (id, cost) => {
    Alert.alert(
      'Unlock Theme',
      `Unlock ${themes[id].name} for 🪙 ${cost} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            if (profile.coins < cost) {
              Alert.alert('Error', 'Insufficient coins');
              return;
            }
            setActionLoading(true);
            try {
              const success = await unlockTheme(id, cost);
              if (success) {
                await setTheme(id);
                const updated = await getProfile();
                setProfile(updated);
              } else {
                Alert.alert('Error', 'Failed to unlock theme');
              }
            } catch (err) {
              console.error(err);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleApplyTheme = async (id) => {
    setActionLoading(true);
    try {
      await setTheme(id);
      const updated = await getProfile();
      setProfile(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimMission = async (missionId) => {
    setActionLoading(true);
    try {
      const success = await claimMissionReward(missionId);
      if (success) {
        const updated = await getProfile();
        setProfile(updated);
        const m = await getDailyMissions();
        setMissions(m);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimAchievement = async (achId) => {
    setActionLoading(true);
    try {
      const success = await claimAchievementReward(achId);
      if (success) {
        const updated = await getProfile();
        setProfile(updated);
        const a = await getAchievements();
        setAchievements(a);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: '🎮 Play Number Flow - the ultimate puzzle challenge! Connect the numbers and test your logic: https://play.google.com/store/apps/details?id=com.parthbvaishnav.numberflow',
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const rankInfo = getNextRankInfo(profile.xp);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatarModal(true)}
          >
            <Text style={styles.avatarEmoji}>{profile.avatar}</Text>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="pencil" size={12} color="#000" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameRow}>
            {editingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  maxLength={15}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.nameActionBtn}
                  onPress={handleSaveName}
                >
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nameActionBtn}
                  onPress={() => {
                    setEditingName(false);
                    setNewName(profile.playerName);
                  }}
                >
                  <Ionicons name="close" size={20} color="#f87171" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.displayNameRow}>
                <Text style={styles.profileName}>{profile.playerName}</Text>
                <TouchableOpacity
                  style={styles.editPenBtn}
                  onPress={() => setEditingName(true)}
                >
                  <Ionicons name="pencil" size={16} color={theme.muted} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* XP & Rank */}
          <View style={styles.rankSection}>
            <View style={styles.rankRow}>
              <Text style={styles.rankBadge}>{rankInfo.currentRank}</Text>
              <Text style={styles.xpText}>{profile.xp} XP</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${rankInfo.progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.rankSubText}>
              {rankInfo.nextRank === 'Max Rank'
                ? 'Maximum Rank Achieved!'
                : `${rankInfo.xpRemaining} XP to ${rankInfo.nextRank}`}
            </Text>
          </View>
        </View>

        {/* Balance Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statValue}>{profile.coins}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>💡</Text>
            <Text style={styles.statValue}>{profile.hints}</Text>
            <Text style={styles.statLabel}>Hints</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🏁</Text>
            <Text style={styles.statValue}>{profile.levelsCompleted}</Text>
            <Text style={styles.statLabel}>Levels</Text>
          </View>
        </View>

        {/* Streak & Time Stats Row */}
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{profile.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak (Days)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{profile.bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{formatPlayTime(profile.totalPlayTime)}</Text>
            <Text style={styles.statLabel}>Play Time</Text>
          </View>
        </View>

        {/* Streak Broken Alert Banner */}
        {profile.streakBroken && (
          <View style={styles.streakBrokenCard}>
            <View style={styles.streakBrokenLeft}>
              <Text style={styles.streakBrokenIcon}>💔</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakBrokenTitle}>Daily Streak Broken!</Text>
                <Text style={styles.streakBrokenSub}>
                  Your streak of ${profile.currentStreak} day${profile.currentStreak > 1 ? 's' : ''} was broken. Watch a rewarded ad to restore it!
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.restoreStreakBtn}
              onPress={handleRestoreStreak}
              activeOpacity={0.8}
            >
              <Text style={styles.restoreStreakBtnText}>🎥 Restore Streak</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Switcher */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'missions' && styles.tabActiveBtn,
            ]}
            onPress={() => setActiveTab('missions')}
          >
            <View style={styles.tabIconWrapper}>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'missions' && styles.tabActiveLabel,
                ]}
              >
                Missions
              </Text>
              {hasClaimableMissions && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>🪙</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'achievements' && styles.tabActiveBtn,
            ]}
            onPress={() => setActiveTab('achievements')}
          >
            <View style={styles.tabIconWrapper}>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'achievements' && styles.tabActiveLabel,
                ]}
              >
                Achievements
              </Text>
              {hasClaimableAchievements && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>🪙</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'themes' && styles.tabActiveBtn,
            ]}
            onPress={() => setActiveTab('themes')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'themes' && styles.tabActiveLabel,
              ]}
            >
              Themes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content Area */}
        <View style={styles.tabContentContainer}>
          {/* Daily Missions */}
          {activeTab === 'missions' && (
            <View>
              <Text style={styles.tabHeading}>Daily Missions</Text>
              {missions.length === 0 ? (
                <Text style={styles.emptyText}>No missions today.</Text>
              ) : (
                missions.map((item) => {
                  const claimed = profile.claimedMissions.includes(item.id);
                  const complete = item.progress >= item.target;
                  return (
                    <View key={item.id} style={styles.cardItem}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardReward}>🪙 +{item.rewardCoins}</Text>
                      </View>
                      <View style={styles.cardProgressRow}>
                        <View style={styles.miniProgressTrack}>
                          <View
                            style={[
                              styles.miniProgressBar,
                              { width: `${Math.min(100, (item.progress / item.target) * 100)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressNumText}>
                          {item.progress}/{item.target}
                        </Text>
                      </View>

                      {claimed ? (
                        <View style={styles.claimedBadge}>
                          <Text style={styles.claimedBadgeText}>Claimed</Text>
                        </View>
                      ) : complete ? (
                        <TouchableOpacity
                          style={styles.claimBtn}
                          onPress={() => handleClaimMission(item.id)}
                        >
                          <Text style={styles.claimBtnText}>Claim</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.lockedBadge}>
                          <Text style={styles.lockedBadgeText}>In Progress</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Achievements */}
          {activeTab === 'achievements' && (
            <View>
              <Text style={styles.tabHeading}>Achievements</Text>
              {achievements.map((item) => {
                const complete = item.progress >= item.target;
                return (
                  <View key={item.id} style={styles.cardItem}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <Text style={styles.cardReward}>🪙 +{item.rewardCoins}</Text>
                    </View>
                    <View style={styles.cardProgressRow}>
                      <View style={styles.miniProgressTrack}>
                        <View
                          style={[
                            styles.miniProgressBar,
                            { width: `${Math.min(100, (item.progress / item.target) * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressNumText}>
                        {item.progress}/{item.target}
                      </Text>
                    </View>

                    {item.claimed ? (
                      <View style={styles.claimedBadge}>
                        <Text style={styles.claimedBadgeText}>Claimed</Text>
                      </View>
                    ) : complete ? (
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => handleClaimAchievement(item.id)}
                      >
                        <Text style={styles.claimBtnText}>Claim</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <Text style={styles.lockedBadgeText}>Locked</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Themes */}
          {activeTab === 'themes' && (
            <View>
              <Text style={styles.tabHeading}>Unlocks & Themes</Text>
              {Object.keys(themes).map((key) => {
                const t = themes[key];
                const isUnlocked = profile.unlockedThemes.includes(key);
                const isCurrent = themeId === key;
                return (
                  <View key={key} style={styles.themeItem}>
                    <View style={styles.themeLeft}>
                      <Text style={styles.themeIcon}>{t.icon}</Text>
                      <View>
                        <Text style={styles.themeName}>{t.name}</Text>
                        <Text style={styles.themeInfo}>
                          {t.cost > 0 ? `Cost: 🪙 ${t.cost}` : 'Free'}
                        </Text>
                      </View>
                    </View>

                    {isCurrent ? (
                      <View style={[styles.themeBtn, styles.themeActiveBtn]}>
                        <Ionicons name="checkmark-sharp" size={16} color="#000" />
                        <Text style={styles.themeActiveBtnText}>Active</Text>
                      </View>
                    ) : isUnlocked ? (
                      <TouchableOpacity
                        style={[styles.themeBtn, styles.themeApplyBtn]}
                        onPress={() => handleApplyTheme(key)}
                      >
                        <Text style={styles.themeApplyBtnText}>Apply</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.themeBtn, styles.themeBuyBtn]}
                        onPress={() => handleUnlockTheme(key, t.cost)}
                      >
                        <Text style={styles.themeBuyBtnText}>Unlock</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Share App Card */}
        <View style={styles.shareCard}>
          <Text style={styles.shareIcon}>📤</Text>
          <View style={styles.shareRight}>
            <Text style={styles.shareTitle}>Share Number Flow</Text>
            <Text style={styles.shareSub}>Invite friends to test their logic limits!</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareApp}>
              <Text style={styles.shareButtonText}>Share Invite Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={AVATARS}
              keyExtractor={(item) => item}
              numColumns={4}
              contentContainerStyle={styles.avatarList}
              renderItem={({ item }) => {
                const isUnlocked = profile.unlockedAvatars.includes(item);
                const cost = AVATAR_COSTS[item] || 0;
                return (
                  <TouchableOpacity
                    style={[
                      styles.avatarGridItem,
                      isUnlocked ? styles.avatarGridUnlocked : styles.avatarGridLocked,
                    ]}
                    onPress={() => handleSelectAvatar(item)}
                  >
                    <Text style={styles.avatarGridEmoji}>{item}</Text>
                    {!isUnlocked && (
                      <View style={styles.avatarCostBadge}>
                        <Text style={styles.avatarCostText}>🪙{cost}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    headerRight: {
      width: 40,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    profileCard: {
      backgroundColor: theme.surface,
      margin: 16,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 20,
      alignItems: 'center',
    },
    avatarContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.surfaceRaised,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.border,
      position: 'relative',
    },
    avatarEmoji: {
      fontSize: 48,
    },
    avatarEditBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.surface,
    },
    nameRow: {
      marginTop: 14,
      height: 40,
      justifyContent: 'center',
      width: '100%',
    },
    displayNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileName: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    editPenBtn: {
      marginLeft: 8,
      padding: 4,
    },
    editNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    nameInput: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      color: theme.text,
      backgroundColor: theme.surfaceRaised,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    nameActionBtn: {
      marginLeft: 8,
      padding: 8,
    },
    rankSection: {
      width: '100%',
      marginTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 16,
    },
    rankRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    rankBadge: {
      fontSize: 14,
      fontWeight: '800',
      color: '#fff',
      backgroundColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    xpText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    progressTrack: {
      height: 8,
      backgroundColor: theme.surfaceRaised,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 4,
    },
    rankSubText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.muted,
      marginTop: 6,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingVertical: 14,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    statIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.muted,
      marginTop: 2,
      textTransform: 'uppercase',
    },
    tabsRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 4,
      borderWidth: 1.5,
      borderColor: theme.border,
      marginBottom: 16,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 12,
    },
    tabActiveBtn: {
      backgroundColor: theme.surfaceRaised,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.muted,
    },
    tabActiveLabel: {
      color: theme.primary,
    },
    tabContentContainer: {
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    tabHeading: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    emptyText: {
      color: theme.muted,
      textAlign: 'center',
      paddingVertical: 20,
      fontSize: 14,
    },
    cardItem: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    cardDesc: {
      fontSize: 11,
      color: theme.muted,
      marginTop: 2,
    },
    cardReward: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.primary,
    },
    cardProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    miniProgressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: theme.surfaceRaised,
      borderRadius: 3,
      overflow: 'hidden',
    },
    miniProgressBar: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 3,
    },
    progressNumText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.text,
      marginLeft: 8,
    },
    claimedBadge: {
      backgroundColor: theme.surfaceRaised,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: 'center',
      opacity: 0.7,
    },
    claimedBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.muted,
    },
    lockedBadge: {
      backgroundColor: theme.surfaceRaised,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: 'center',
    },
    lockedBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.muted,
    },
    claimBtn: {
      backgroundColor: theme.primary,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: 'center',
    },
    claimBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.background,
    },
    themeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 8,
    },
    themeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    themeName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },
    themeInfo: {
      fontSize: 11,
      color: theme.muted,
      marginTop: 2,
    },
    themeBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 80,
      justifyContent: 'center',
    },
    themeActiveBtn: {
      backgroundColor: theme.primary,
    },
    themeActiveBtnText: {
      fontSize: 12,
      fontWeight: '850',
      color: theme.background,
      marginLeft: 4,
    },
    themeApplyBtn: {
      backgroundColor: theme.surfaceRaised,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    themeApplyBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    themeBuyBtn: {
      backgroundColor: theme.primary,
    },
    themeBuyBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.background,
    },
    shareCard: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 20,
      alignItems: 'center',
    },
    shareIcon: {
      fontSize: 36,
      marginRight: 16,
    },
    shareRight: {
      flex: 1,
    },
    shareTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    shareSub: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 2,
      marginBottom: 10,
    },
    shareButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 8,
      alignItems: 'center',
    },
    shareButtonText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.background,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 24,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    avatarList: {
      paddingBottom: 20,
    },
    avatarGridItem: {
      flex: 1,
      aspectRatio: 1,
      margin: 6,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    avatarGridUnlocked: {
      backgroundColor: theme.surfaceRaised,
    },
    avatarGridLocked: {
      backgroundColor: theme.surfaceRaised,
      opacity: 0.6,
    },
    avatarGridEmoji: {
      fontSize: 28,
    },
    avatarCostBadge: {
      position: 'absolute',
      bottom: 4,
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    avatarCostText: {
      fontSize: 8,
      color: '#fbbf24',
      fontWeight: '700',
    },
    streakBrokenCard: {
      flexDirection: 'row',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1.5,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: 24,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 12,
      alignItems: 'center',
      gap: 12,
    },
    streakBrokenLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    streakBrokenIcon: {
      fontSize: 28,
    },
    streakBrokenTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    streakBrokenSub: {
      fontSize: 11,
      color: theme.muted,
      marginTop: 2,
    },
    restoreStreakBtn: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    restoreStreakBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.background,
    },
    tabIconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tabBadge: {
      backgroundColor: '#FF3B30',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    tabBadgeText: {
      fontSize: 10,
    },
  });
