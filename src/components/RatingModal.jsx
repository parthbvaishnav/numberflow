// src/components/RatingModal.jsx
// Dynamic Theme-Integrated In-App Rating & Review Dialogue

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../constants/theme';

const { width } = Dimensions.get('window');

const RATING_SUBMITTED_KEY = 'RATING_SUBMITTED';
const RATING_LAST_SHOWN_KEY = 'RATING_LAST_SHOWN';
const APP_OPEN_COUNT_KEY = 'APP_OPEN_COUNT';

const DAYS_DELAY = 3;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export default function RatingModal() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [visible, setVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    checkRatingStatus();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const checkRatingStatus = async () => {
    try {
      const submitted = await AsyncStorage.getItem(RATING_SUBMITTED_KEY);
      if (submitted === 'true') {
        return;
      }

      let openCount = parseInt((await AsyncStorage.getItem(APP_OPEN_COUNT_KEY)) || '0', 10);
      openCount++;
      await AsyncStorage.setItem(APP_OPEN_COUNT_KEY, String(openCount));

      // Don't show on very first open
      if (openCount === 1) {
        return;
      }

      const lastShown = await AsyncStorage.getItem(RATING_LAST_SHOWN_KEY);
      const now = Date.now();

      if (!lastShown) {
        setVisible(true);
        await AsyncStorage.setItem(RATING_LAST_SHOWN_KEY, String(now));
        return;
      }

      const timePassed = now - parseInt(lastShown, 10);
      if (timePassed > DAYS_DELAY * MS_IN_DAY) {
        setVisible(true);
        await AsyncStorage.setItem(RATING_LAST_SHOWN_KEY, String(now));
      }
    } catch (e) {
      console.log('Rating check error:', e);
    }
  };

  const handleStarPress = (rating) => {
    setSelectedRating(rating);
  };

  const handleRateNow = async () => {
    try {
      await AsyncStorage.setItem(RATING_SUBMITTED_KEY, 'true');
      setVisible(false);

      const url =
        Platform.OS === 'android'
          ? 'market://details?id=com.numberflow.game'
          : 'itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review';

      const fallbackUrl =
        Platform.OS === 'android'
          ? 'https://play.google.com/store/apps/details?id=com.numberflow.game'
          : 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review';

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(fallbackUrl);
      }
    } catch (e) {
      console.log('Rating submit error:', e);
    }
  };

  const handleRemindLater = () => {
    setVisible(false);
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleRemindLater}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Enjoying the Game?</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleStarPress(star)} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.star,
                    { color: star <= selectedRating ? (theme.warn || '#FFD54F') : '#4B5563' },
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>Thanks for playing Number Link Puzzle!</Text>
          <Text style={styles.description}>
            Your feedback helps us make the game better. Rate us on Google Play Store!
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.laterBtn} onPress={handleRemindLater} activeOpacity={0.75}>
              <Text style={styles.laterText}>Maybe Later</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rateButton} onPress={handleRateNow} activeOpacity={0.85}>
              <Text style={styles.rateButtonText}>Rate Us 🌟</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function getStyles(theme) {
  const primary = theme.primary || '#38bdf8';
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      width: Math.min(width * 0.88, 380),
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.12)',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 10,
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 16,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 26,
      color: theme.textSecondary || theme.muted || '#94a3b8',
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginTop: 4,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    description: {
      fontSize: 13,
      color: theme.textSecondary || theme.muted || '#94a3b8',
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
      paddingHorizontal: 8,
    },
    starsContainer: {
      flexDirection: 'row',
      marginVertical: 12,
    },
    star: {
      fontSize: 36,
      marginHorizontal: 4,
    },
    buttonsRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 10,
    },
    laterBtn: {
      flex: 1,
      backgroundColor: theme.surfaceAlt || 'rgba(255, 255, 255, 0.08)',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border || 'rgba(255, 255, 255, 0.08)',
    },
    laterText: {
      color: theme.textSecondary || theme.text || '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    rateButton: {
      flex: 1.2,
      backgroundColor: primary,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    rateButtonText: {
      color: '#000',
      fontWeight: '800',
      fontSize: 15,
      letterSpacing: 0.3,
    },
  });
}