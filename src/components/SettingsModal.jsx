import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import { useTheme, themes } from '../constants/theme';

export default function SettingsModal({ visible, onClose }) {
  const { theme, themeId, setTheme } = useTheme();
  const [pressedId, setPressedId] = useState(null);

  const handleThemeSelect = async (id) => {
    setPressedId(id);
    await setTheme(id);
    setTimeout(() => setPressedId(null), 300);
  };

  const handleTestCrash = () => {
    Alert.alert(
      'Test Crash',
      'This will crash the app to test Crashlytics integration. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Crash App',
          style: 'destructive',
          onPress: () => {
            crashlytics().log('User triggered a manual test crash.');
            crashlytics().crash();
          },
        },
      ]
    );
  };

  const handleTestLog = () => {
    crashlytics().log('Test event logged from Settings page.');
    crashlytics().setAttribute('test_attribute', 'value_123');
    Alert.alert('Logged', 'Custom attributes and test logs have been sent to Crashlytics.');
  };

  const s = makeStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle bar */}
          <View style={s.handleBar} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>⚙️  Settings</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Theme Section */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>CHOOSE YOUR THEME</Text>
              <Text style={s.sectionSub}>Personalize your game experience</Text>

              <View style={s.themeGrid}>
                {Object.values(themes).map((t) => {
                  const isSelected = themeId === t.id;
                  const isPressed = pressedId === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        s.themeCard,
                        isSelected && { borderColor: t.primary, borderWidth: 2.5 },
                        isPressed && { transform: [{ scale: 0.96 }] },
                      ]}
                      onPress={() => handleThemeSelect(t.id)}
                      activeOpacity={0.8}
                    >
                      {/* Color preview strip */}
                      <View style={[s.themePreview, { backgroundColor: t.background }]}>
                        <View style={[s.previewDot, { backgroundColor: t.primary }]} />
                        <View style={[s.previewDot, { backgroundColor: t.primaryLight, opacity: 0.7 }]} />
                        <View style={[s.previewDot, { backgroundColor: t.surface }]} />
                        {/* Mini board preview */}
                        <View style={[s.miniBoard, { borderColor: t.border }]}>
                          <View style={[s.miniCell, { backgroundColor: t.surface }]} />
                          <View style={[s.miniCell, { backgroundColor: t.primary, opacity: 0.8 }]} />
                          <View style={[s.miniCell, { backgroundColor: t.surface }]} />
                          <View style={[s.miniCell, { backgroundColor: t.primary, opacity: 0.5 }]} />
                        </View>
                      </View>

                      {/* Info row */}
                      <View style={s.themeInfo}>
                        <Text style={s.themeIcon}>{t.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.themeName}>{t.name}</Text>
                        </View>
                        {isSelected && (
                          <View style={[s.checkBadge, { backgroundColor: t.primary }]}>
                            <Text style={s.checkText}>✓</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* About Section */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>ABOUT</Text>

              <TouchableOpacity
                style={s.menuRow}
                activeOpacity={0.7}
                onPress={() =>
                  Linking.openURL('https://friendly-cassata-b8985a.netlify.app/privacy-policy.html')
                }
              >
                <Text style={s.menuRowIcon}>🔐</Text>
                <Text style={s.menuRowText}>Privacy Policy</Text>
                <Text style={s.menuRowArrow}>›</Text>
              </TouchableOpacity>

              <View style={s.menuRow}>
                <Text style={s.menuRowIcon}>🎮</Text>
                <Text style={s.menuRowText}>Number Flow</Text>
                <Text style={[s.menuRowArrow, { color: theme.muted, fontSize: 12 }]}>v1.0.0</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Crashlytics Test Section */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>CRASHLYTICS TESTING</Text>
              
              <TouchableOpacity
                style={s.menuRow}
                activeOpacity={0.7}
                onPress={handleTestLog}
              >
                <Text style={s.menuRowIcon}>📝</Text>
                <Text style={s.menuRowText}>Send Test Log & Attribute</Text>
                <Text style={s.menuRowArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.menuRow}
                activeOpacity={0.7}
                onPress={handleTestCrash}
              >
                <Text style={s.menuRowIcon}>💥</Text>
                <Text style={s.menuRowText}>Trigger Test Crash</Text>
                <Text style={s.menuRowArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      maxHeight: '88%',
      paddingBottom: 10,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.3,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceRaised,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnText: {
      color: theme.muted,
      fontSize: 13,
      fontWeight: '700',
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.muted,
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    sectionSub: {
      fontSize: 13,
      color: theme.muted,
      marginBottom: 16,
      opacity: 0.8,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    themeCard: {
      width: '47%',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.surfaceRaised,
      overflow: 'hidden',
    },
    themePreview: {
      height: 80,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    previewDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: 2,
    },
    miniBoard: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      width: 36,
      height: 36,
      borderRadius: 6,
      borderWidth: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      overflow: 'hidden',
    },
    miniCell: {
      width: '50%',
      height: '50%',
    },
    themeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    themeIcon: {
      fontSize: 18,
    },
    themeName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    checkBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#fff',
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: 20,
      marginTop: 20,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    menuRowIcon: {
      fontSize: 18,
      width: 28,
      textAlign: 'center',
    },
    menuRowText: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      fontWeight: '500',
    },
    menuRowArrow: {
      fontSize: 20,
      color: theme.muted,
    },
  });