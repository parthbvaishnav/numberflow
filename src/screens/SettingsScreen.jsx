// src/screens/SettingsScreen.jsx
// Dedicated Full-Screen Settings with Profile Customization, Player Stats Grid & Support Links

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../constants/theme';
import { getProfile } from '../utils/ProfileManager';
import { getCoins, getHints } from '../utils/CoinManager';
import { DEFAULT_AVATAR } from '../constants/avatars';
import AvatarPickerModal from '../components/AvatarPickerModal';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [playerName, setPlayerName] = useState('Flow Solver');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR.url);
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR.id);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Player Stats
  const [coins, setCoins] = useState(0);
  const [hints, setHints] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(1);
  const [bestStreak, setBestStreak] = useState(1);
  const [totalPlayTime, setTotalPlayTime] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [c, h, p, currentLevelStr] = await Promise.all([
        getCoins(),
        getHints(),
        getProfile(),
        AsyncStorage.getItem('zipCurrentLevel'),
      ]);

      setCoins(c);
      setHints(h);

      if (currentLevelStr) {
        const lvl = parseInt(currentLevelStr, 10);
        if (!isNaN(lvl) && lvl > 0) setLevel(lvl);
      }

      if (p) {
        if (p.playerName) setPlayerName(p.playerName);
        if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
        if (p.avatarId) setAvatarId(p.avatarId);
        if (p.currentStreak) setCurrentStreak(p.currentStreak);
        if (p.bestStreak) setBestStreak(p.bestStreak);
        if (p.totalPlayTime) setTotalPlayTime(p.totalPlayTime);
      }
    } catch (e) {
      console.warn('[SettingsScreen] Failed to load data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const formatPlayTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleRateApp = async () => {
    const playStoreUrl = 'market://details?id=com.numberflow.game';
    const fallbackUrl = 'https://play.google.com/store/apps/details?id=com.numberflow.game';
    try {
      const supported = await Linking.canOpenURL(playStoreUrl);
      if (supported) {
        await Linking.openURL(playStoreUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch {
      Linking.openURL(fallbackUrl);
    }
  };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* ── Top Header ──────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>⚙️ Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: Player Profile Card ─────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PLAYER PROFILE</Text>
          <TouchableOpacity
            style={s.profileCard}
            activeOpacity={0.85}
            onPress={() => setShowAvatarPicker(true)}
          >
            <View style={s.avatarFrame}>
              <Image source={{ uri: avatarUrl }} style={s.avatarImg} resizeMode="cover" />
            </View>

            <View style={s.profileDetails}>
              <Text style={s.playerName} numberOfLines={1}>
                {playerName}
              </Text>
              <Text style={s.profileHintText}>Tap to change avatar & username ✏️</Text>
            </View>

            <View style={s.editBadge}>
              <Text style={s.editBadgeText}>EDIT</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Section 2: Player Stats Grid ───────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PLAYER STATS</Text>
          <View style={s.statsGrid}>
            {/* Coin */}
            <View style={s.statTile}>
              <Text style={s.statIcon}>🪙</Text>
              <Text style={s.statValue}>{coins.toLocaleString()}</Text>
              <Text style={s.statTitle}>COIN</Text>
            </View>

            {/* Hint */}
            <View style={s.statTile}>
              <Text style={s.statIcon}>💡</Text>
              <Text style={s.statValue}>{hints}</Text>
              <Text style={s.statTitle}>HINT</Text>
            </View>

            {/* Level */}
            <View style={s.statTile}>
              <Text style={s.statIcon}>🏆</Text>
              <Text style={s.statValue}>{level}</Text>
              <Text style={s.statTitle}>LEVEL</Text>
            </View>

            {/* Streak */}
            <View style={s.statTile}>
              <Text style={s.statIcon}>🔥</Text>
              <Text style={s.statValue}>{currentStreak}d</Text>
              <Text style={s.statTitle}>STREAK (DAYS)</Text>
            </View>

            {/* Best Streak */}
            <View style={s.statTile}>
              <Text style={s.statIcon}>⭐</Text>
              <Text style={s.statValue}>{bestStreak}d</Text>
              <Text style={s.statTitle}>BEST STREAK</Text>
            </View>

            {/* Play Time */}
            <View style={s.statTile}>
              <Text style={s.statIcon}>⏱️</Text>
              <Text style={s.statValue}>{formatPlayTime(totalPlayTime)}</Text>
              <Text style={s.statTitle}>PLAY TIME</Text>
            </View>
          </View>
        </View>

        {/* ── Section 3: Support & About ──────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>SUPPORT & ABOUT</Text>

          {/* Rate & Review Us */}
          <TouchableOpacity
            style={s.menuRow}
            activeOpacity={0.7}
            onPress={handleRateApp}
          >
            <Text style={s.menuRowIcon}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.menuRowText}>Rate & Review Us</Text>
              <Text style={s.menuRowSub}>Support us with 5 stars on Google Play</Text>
            </View>
            <Text style={s.menuRowArrow}>›</Text>
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={s.menuRow}
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL('https://npgamestudio.netlify.app/privacy-policy')
            }
          >
            <Text style={s.menuRowIcon}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.menuRowText}>Privacy Policy</Text>
              <Text style={s.menuRowSub}>Read our player data & privacy terms</Text>
            </View>
            <Text style={s.menuRowArrow}>›</Text>
          </TouchableOpacity>

          {/* App Version */}
          <View style={[s.menuRow, { borderBottomWidth: 0 }]}>
            <Text style={s.menuRowIcon}>🎮</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.menuRowText}>Number Link Puzzle Game</Text>
              <Text style={s.menuRowSub}>Version 1.7 • All Systems Online</Text>
            </View>
            <View style={s.versionPill}>
              <Text style={s.versionPillText}>v1.7</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Avatar & Username Modal */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentName={playerName}
        currentAvatarUrl={avatarUrl}
        currentAvatarId={avatarId}
        onProfileUpdated={({ playerName: newName, avatarUrl: newUrl, avatarId: newId }) => {
          if (newName) setPlayerName(newName);
          if (newUrl) setAvatarUrl(newUrl);
          if (newId) setAvatarId(newId);
          loadData();
        }}
        onClose={() => setShowAvatarPicker(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    backBtnText: {
      fontSize: 22,
      color: theme.text,
      fontWeight: '700',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.5,
    },
    scrollBody: {
      paddingHorizontal: 18,
      paddingTop: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.primary || '#38BDF8',
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.primary ? `${theme.primary}50` : 'rgba(56, 189, 248, 0.4)',
      padding: 14,
    },
    avatarFrame: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.06)',
      borderWidth: 2,
      borderColor: theme.primary || '#38BDF8',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginRight: 14,
    },
    avatarImg: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    profileDetails: {
      flex: 1,
    },
    playerName: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
    },
    profileHintText: {
      fontSize: 12,
      color: theme.muted,
      fontWeight: '600',
    },
    editBadge: {
      backgroundColor: theme.primary || '#38BDF8',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      elevation: 3,
    },
    editBadgeText: {
      color: '#000000',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    // ── Stats Grid ────────────────────────────────────────────────────────
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statTile: {
      width: '31%',
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 2,
      textAlign: 'center',
    },
    statTitle: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.muted,
      letterSpacing: 0.5,
      textAlign: 'center',
    },

    // ── Menu Rows ─────────────────────────────────────────────────────────
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
    },
    menuRowIcon: {
      fontSize: 22,
      marginRight: 14,
    },
    menuRowText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    menuRowSub: {
      fontSize: 11,
      color: theme.muted,
    },
    menuRowArrow: {
      fontSize: 20,
      color: theme.muted,
      fontWeight: '300',
      marginLeft: 8,
    },
    versionPill: {
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.06)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    versionPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.muted,
    },
  });
