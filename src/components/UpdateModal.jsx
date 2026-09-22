// src/components/UpdateModal.jsx
//
// Remote Config Version Update Dialogue for Number Link Puzzle.
// Supports both Force Update (blocking) and Flexible/Optional Update.
// Fully integrated with dynamic app theme (useTheme).

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { useTheme } from '../constants/theme';

/**
 * Compare two semver-like strings (e.g. "1.3" vs "1.7", or "1.0.0" vs "1.4.0")
 */
export function compareVersions(v1 = '0.0.0', v2 = '0.0.0') {
  const clean = (v) => v.replace(/[^0-9.]/g, '');
  const parts1 = clean(v1).split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean(v2).split('.').map((p) => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}

export default function UpdateModal({
  visible,
  updateInfo,
  currentVersion = '1.3.0',
  onClose,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  if (!visible || !updateInfo) return null;

  const {
    latest_version = '1.7',
    min_supported_version = '1.3',
    force_update = false,
    update_url = 'https://play.google.com/store/apps/details?id=com.numberflow.game',
    title = 'Exciting New Update! 🚀',
    message = 'A fresh new update is available with new levels and features!',
    release_notes = [],
  } = updateInfo;

  // Determine if this is a mandatory/forced update
  const isBelowMin = compareVersions(currentVersion, min_supported_version) < 0;
  const isForced = force_update || isBelowMin;

  const handleUpdate = () => {
    if (update_url) {
      Linking.openURL(update_url).catch((err) => {
        console.warn('[UpdateModal] Failed to open update URL:', err);
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isForced && onClose) {
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.rocketCircle}>
            <Text style={{ fontSize: 32 }}>🚀</Text>
          </View>

          {/* Badge */}
          <View style={[styles.badge, isForced ? styles.badgeForce : styles.badgeNew]}>
            <Text style={styles.badgeText}>
              {isForced ? 'MANDATORY UPDATE' : `VERSION ${latest_version} AVAILABLE`}
            </Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Release Notes List */}
          {Array.isArray(release_notes) && release_notes.length > 0 && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesHeader}>WHAT'S NEW:</Text>
              <ScrollView
                style={{ maxHeight: 130 }}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {release_notes.map((note, index) => (
                  <View key={index} style={styles.noteRow}>
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Actions */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={handleUpdate}
              activeOpacity={0.85}
            >
              <Text style={styles.updateBtnText}>UPDATE NOW</Text>
            </TouchableOpacity>

            {!isForced && (
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.laterBtnText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme) {
  const isDark = theme.dark !== false;
  const primary = theme.primary || '#38bdf8';
  const good = theme.good || '#10b981';
  const bad = theme.bad || '#ef4444';

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.1)',
      padding: 24,
      alignItems: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    rocketCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.12)',
      borderWidth: 1.5,
      borderColor: primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 10,
    },
    badgeForce: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: bad,
      borderWidth: 1,
    },
    badgeNew: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: good,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    message: {
      fontSize: 13,
      color: theme.textSecondary || theme.muted || '#94A3B8',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 18,
    },
    notesContainer: {
      width: '100%',
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.04)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.08)',
      padding: 12,
      marginBottom: 20,
    },
    notesHeader: {
      fontSize: 11,
      fontWeight: '800',
      color: primary,
      letterSpacing: 1,
      marginBottom: 8,
    },
    noteRow: {
      paddingVertical: 3,
    },
    noteText: {
      fontSize: 12,
      color: theme.textSecondary || theme.text || '#CBD5E1',
      lineHeight: 17,
    },
    buttonContainer: {
      width: '100%',
      alignItems: 'center',
    },
    updateBtn: {
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
      marginBottom: 8,
    },
    updateBtnText: {
      color: '#000',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 1,
    },
    laterBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    laterBtnText: {
      color: theme.textSecondary || theme.muted || '#94A3B8',
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
