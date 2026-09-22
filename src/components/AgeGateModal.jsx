// src/components/AgeGateModal.jsx
//
// First-launch Age Gate & Privacy Consent Dialog for Number Link Puzzle.
// Compliant with COPPA, GDPR, Google AdMob, Meta Audience Network & AppLovin MAX policies.
// Fully integrated with dynamic app theme (useTheme).

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import ConsentManager from '../services/ConsentManager';
import { useTheme } from '../constants/theme';

export const AGE_BRACKETS = [
  { id: '12-15', label: '12 - 15', min: 12, max: 15, defaultAge: 14, isMinor: true, icon: '🎒' },
  { id: '16-17', label: '16 - 17', min: 16, max: 17, defaultAge: 16, isMinor: true, icon: '🎧' },
  { id: '18-20', label: '18 - 20', min: 18, max: 20, defaultAge: 19, isMinor: false, icon: '⚡' },
  { id: '21-25', label: '21 - 25', min: 21, max: 25, defaultAge: 23, isMinor: false, icon: '🚀' },
  { id: '26-30', label: '26 - 30', min: 26, max: 30, defaultAge: 28, isMinor: false, icon: '🌟' },
  { id: '31-40', label: '31 - 40', min: 31, max: 40, defaultAge: 35, isMinor: false, icon: '🎯' },
  { id: '41-45', label: '41 - 45', min: 41, max: 45, defaultAge: 43, isMinor: false, icon: '🏆' },
  { id: '46+',   label: '46+',     min: 46, max: 99, defaultAge: 50, isMinor: false, icon: '👑' },
];

export default function AgeGateModal({ visible, onClose }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [selectedBracketId, setSelectedBracketId] = useState('18-20');
  const [allowPersonalized, setAllowPersonalized] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedBracket = AGE_BRACKETS.find((b) => b.id === selectedBracketId);
  const isMinor = selectedBracket ? selectedBracket.isMinor : false;

  const handleConfirm = async () => {
    if (!selectedBracket) {
      setErrorMsg('Please select your age range to continue.');
      return;
    }

    setErrorMsg('');
    await ConsentManager.saveConsent({
      age: selectedBracket.defaultAge,
      ageGroup: selectedBracket.id,
      allowPersonalized: isMinor ? false : allowPersonalized,
    });

    if (onClose) {
      onClose();
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://npgamestudio.netlify.app/privacy-policy');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Prevent closing modal without age confirmation
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 28 }}>🛡️</Text>
            </View>

            <Text style={styles.title}>Welcome to Number Link Puzzle</Text>
            <Text style={styles.subtitle}>
              Select your age range to personalize your gameplay experience and privacy settings.
            </Text>

            {/* Age Brackets Grid (8 options) */}
            <View style={styles.gridContainer}>
              <Text style={styles.sectionLabel}>SELECT YOUR AGE GROUP:</Text>
              <View style={styles.grid}>
                {AGE_BRACKETS.map((bracket) => {
                  const isSelected = selectedBracketId === bracket.id;
                  return (
                    <TouchableOpacity
                      key={bracket.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => {
                        setSelectedBracketId(bracket.id);
                        setErrorMsg('');
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.chipIcon}>{bracket.icon}</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {bracket.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkIcon}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            {/* COPPA / Minor Protection Notice */}
            {isMinor && (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeTitle}>🛡️ Privacy Protection Active</Text>
                <Text style={styles.noticeBody}>
                  Personalized ad tracking is disabled for your age group to keep your gameplay safe and private.
                </Text>
              </View>
            )}

            {/* Personalized Ads Toggle (Adults only) */}
            {!isMinor && (
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>Allow Tailored Ads</Text>
                  <Text style={styles.toggleDesc}>
                    Enjoy relevant game rewards and hints. You can change this anytime in settings.
                  </Text>
                </View>
                <Switch
                  value={allowPersonalized}
                  onValueChange={setAllowPersonalized}
                  trackColor={{ false: '#334155', true: theme.primary }}
                  thumbColor={allowPersonalized ? '#ffffff' : '#94A3B8'}
                />
              </View>
            )}

            {/* Privacy Policy Link */}
            <TouchableOpacity
              onPress={openPrivacyPolicy}
              activeOpacity={0.7}
              style={styles.privacyLinkBtn}
            >
              <Text style={styles.privacyLinkText}>
                Read our Privacy Policy & Terms ↗
              </Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>CONTINUE PLAYING</Text>
            </TouchableOpacity>
          </ScrollView>
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
      maxWidth: 420,
      maxHeight: '90%',
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    scrollContent: {
      padding: 20,
      alignItems: 'center',
    },
    iconCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.12)',
      borderWidth: 1.5,
      borderColor: primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 21,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary || theme.muted || '#94A3B8',
      textAlign: 'center',
      marginBottom: 18,
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    gridContainer: {
      width: '100%',
      marginBottom: 14,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: primary,
      letterSpacing: 1.2,
      marginBottom: 10,
      textAlign: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      width: '100%',
    },
    chip: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.05)',
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.1)',
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 10,
      position: 'relative',
    },
    chipSelected: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(14, 165, 233, 0.18)',
      borderColor: primary,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    chipIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary || theme.muted || '#94A3B8',
    },
    chipTextSelected: {
      color: theme.text,
      fontWeight: '800',
    },
    checkBadge: {
      position: 'absolute',
      top: 4,
      right: 6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkIcon: {
      color: '#000',
      fontSize: 10,
      fontWeight: '900',
    },
    errorText: {
      color: theme.bad || '#EF4444',
      fontSize: 12,
      marginBottom: 10,
      textAlign: 'center',
    },
    noticeBox: {
      width: '100%',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
      borderColor: good,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
    },
    noticeTitle: {
      color: good,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 4,
    },
    noticeBody: {
      color: theme.textSecondary || theme.muted || '#94A3B8',
      fontSize: 11,
      lineHeight: 16,
    },
    toggleRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.04)',
      borderColor: theme.border || 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
    },
    toggleTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
    },
    toggleDesc: {
      color: theme.textSecondary || theme.muted || '#64748B',
      fontSize: 11,
      lineHeight: 15,
    },
    privacyLinkBtn: {
      paddingVertical: 6,
      marginBottom: 18,
    },
    privacyLinkText: {
      color: primary,
      fontSize: 12,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    submitBtn: {
      width: '100%',
      backgroundColor: primary,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 6,
    },
    submitBtnText: {
      color: '#000',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });
}
