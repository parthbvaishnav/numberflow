// src/components/AvatarPickerModal.jsx
//
// 100 Dicebear Avatars & Username Customization Modal for Number Flow.
// Fully integrated with dynamic app theme (useTheme).

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  DICEBEAR_AVATARS,
  AVATAR_CATEGORIES,
  DEFAULT_AVATAR,
} from '../constants/avatars';
import {
  updatePlayerName,
  updatePlayerAvatar,
} from '../utils/ProfileManager';
import { useTheme } from '../constants/theme';

export default function AvatarPickerModal({
  visible,
  currentName = 'Flow Solver',
  currentAvatarUrl = DEFAULT_AVATAR.url,
  currentAvatarId = DEFAULT_AVATAR.id,
  onProfileUpdated,
  onClose,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [selectedCategory, setSelectedCategory] = useState('adventurer');
  const [activeAvatarUrl, setActiveAvatarUrl] = useState(currentAvatarUrl);
  const [activeAvatarId, setActiveAvatarId] = useState(currentAvatarId);
  const [nameInput, setNameInput] = useState(currentName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedNotice, setNameSavedNotice] = useState(false);

  useEffect(() => {
    if (visible) {
      setNameInput(currentName);
      setActiveAvatarUrl(currentAvatarUrl);
      setActiveAvatarId(currentAvatarId);
      setNameSavedNotice(false);
    }
  }, [visible, currentName, currentAvatarUrl, currentAvatarId]);

  if (!visible) return null;

  // Filter 25 avatars for current tab
  const categoryAvatars = DICEBEAR_AVATARS.filter(
    (a) => a.category === selectedCategory
  );

  const handleSelectAvatar = async (avatar) => {
    setActiveAvatarUrl(avatar.url);
    setActiveAvatarId(avatar.id);
    await updatePlayerAvatar(avatar.url, avatar.id);
    if (onProfileUpdated) {
      onProfileUpdated({ avatarUrl: avatar.url, avatarId: avatar.id });
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Username cannot be empty.');
      return;
    }
    setIsSavingName(true);
    const updated = await updatePlayerName(trimmed);
    setIsSavingName(false);
    setNameSavedNotice(true);
    setTimeout(() => setNameSavedNotice(false), 2000);

    if (onProfileUpdated) {
      onProfileUpdated({ playerName: updated });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Player Profile & Avatar</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Current Avatar & Name Row */}
          <View style={styles.profileHero}>
            <View style={styles.avatarPreviewRing}>
              <Image
                source={{ uri: activeAvatarUrl }}
                style={styles.avatarPreviewImg}
                resizeMode="cover"
              />
            </View>
            <View style={styles.nameEditBox}>
              <Text style={styles.nameLabel}>YOUR USERNAME:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter Username"
                  placeholderTextColor={theme.textSecondary || theme.muted || '#64748B'}
                  maxLength={20}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.saveNameBtn}
                  onPress={handleSaveName}
                  disabled={isSavingName}
                  activeOpacity={0.8}
                >
                  {isSavingName ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.saveNameText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              {nameSavedNotice && (
                <Text style={styles.savedNoticeText}>✓ Name updated successfully!</Text>
              )}
            </View>
          </View>

          {/* Category Tabs */}
          <View style={styles.tabsRow}>
            {AVATAR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.tabIcon}>{cat.icon}</Text>
                  <Text
                    style={[styles.tabLabel, isSelected && styles.tabLabelActive]}
                  >
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 100 Avatars Grid (25 per category) */}
          <Text style={styles.gridHeading}>
            CHOOSE AN AVATAR (25 in this category):
          </Text>
          <ScrollView
            style={styles.avatarGridScroll}
            contentContainerStyle={styles.avatarGrid}
            showsVerticalScrollIndicator={false}
          >
            {categoryAvatars.map((item) => {
              const isSelected = activeAvatarUrl === item.url || activeAvatarId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.avatarGridItem,
                    isSelected && styles.avatarGridItemSelected,
                  ]}
                  onPress={() => handleSelectAvatar(item)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={styles.avatarGridImg}
                    resizeMode="contain"
                  />
                  {isSelected && (
                    <View style={styles.checkOrb}>
                      <Text style={styles.checkOrbText}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.avatarName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme) {
  const isDark = theme.dark !== false;
  const primary = theme.primary || '#38bdf8';
  const good = theme.good || '#10b981';

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '92%',
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.1)',
      padding: 20,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.5,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeText: {
      color: theme.textSecondary || theme.muted || '#94A3B8',
      fontSize: 16,
      fontWeight: '700',
    },
    profileHero: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.04)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.25)',
      padding: 14,
      marginBottom: 16,
    },
    avatarPreviewRing: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)',
      borderWidth: 2,
      borderColor: primary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginRight: 14,
    },
    avatarPreviewImg: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    nameEditBox: {
      flex: 1,
    },
    nameLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: primary,
      letterSpacing: 1,
      marginBottom: 4,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      backgroundColor: theme.background || 'rgba(0, 0, 0, 0.35)',
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.12)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 7,
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
      marginRight: 8,
    },
    saveNameBtn: {
      backgroundColor: primary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveNameText: {
      color: '#000000',
      fontSize: 13,
      fontWeight: '800',
    },
    savedNoticeText: {
      color: good,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
    },
    tabsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      paddingVertical: 8,
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.03)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.08)',
      marginHorizontal: 3,
    },
    tabBtnActive: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 165, 233, 0.18)',
      borderColor: primary,
    },
    tabIcon: {
      fontSize: 16,
      marginBottom: 2,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSecondary || theme.muted || '#94A3B8',
    },
    tabLabelActive: {
      color: primary,
      fontWeight: '800',
    },
    gridHeading: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.textSecondary || theme.muted || '#64748B',
      letterSpacing: 1,
      marginBottom: 8,
    },
    avatarGridScroll: {
      maxHeight: 220,
      marginBottom: 14,
    },
    avatarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    avatarGridItem: {
      width: '23%',
      aspectRatio: 1,
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.04)',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      position: 'relative',
      padding: 4,
    },
    avatarGridItemSelected: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.2)',
      borderColor: primary,
    },
    avatarGridImg: {
      width: '80%',
      height: '80%',
      borderRadius: 20,
    },
    checkOrb: {
      position: 'absolute',
      top: 3,
      right: 3,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkOrbText: {
      color: '#000000',
      fontSize: 9,
      fontWeight: '900',
    },
    avatarName: {
      fontSize: 8,
      fontWeight: '700',
      color: theme.textSecondary || theme.muted || '#94A3B8',
      textAlign: 'center',
      marginTop: 2,
    },
    doneBtn: {
      width: '100%',
      backgroundColor: primary,
      borderRadius: 16,
      paddingVertical: 13,
      alignItems: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    doneBtnText: {
      color: '#000000',
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 1,
    },
  });
}
