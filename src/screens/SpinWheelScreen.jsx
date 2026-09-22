import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SpinWheel from '../components/SpinWheel';
import {
  canSpin,
  recordSpin,
  addCoins,
  addHints,
  getCoins,
  getHints,
  getSpinTimeRemaining,
  formatCountdown,
} from '../utils/CoinManager';
import { useTheme } from '../constants/theme';
import AdManager from '../ads/AdManager';

export default function SpinWheelScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [spinAvailable, setSpinAvailable] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [coins, setCoins] = useState(0);
  const [hints, setHints] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  const refresh = useCallback(async () => {
    const available = await canSpin();
    setSpinAvailable(available);
    setCoins(await getCoins());
    setHints(await getHints());
    if (!available) {
      const remaining = await getSpinTimeRemaining();
      setCountdown(formatCountdown(remaining));
    }
  }, []);

  useEffect(() => {
    refresh();
    AdManager.preloadAd('rewarded');
    const interval = setInterval(async () => {
      const available = await canSpin();
      setSpinAvailable(available);
      if (!available) {
        const remaining = await getSpinTimeRemaining();
        if (remaining <= 0) {
          setSpinAvailable(true);
          setCountdown('');
        } else {
          setCountdown(formatCountdown(remaining));
        }
      } else {
        setCountdown('');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSpinResult = async (segment) => {
    await recordSpin();
    if (segment.type === 'coins') {
      await addCoins(segment.value);
    } else {
      await addHints(segment.value);
    }
    await refresh();
    setResult(segment);

    scaleAnim.setValue(0.7);
    setTimeout(() => {
      setShowResult(true);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80 }).start();
    }, 400);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎡 Spin Wheel</Text>
        <View style={styles.balRow}>
          <Text style={styles.balText}>🪙 {coins}</Text>
          <Text style={styles.balText}>💡 {hints}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Spin once per day to win coins and hints!</Text>

        {!spinAvailable && !!countdown && (
          <View style={styles.countdownBanner}>
            <Text style={styles.countdownLabel}>Next spin in</Text>
            <Text style={styles.countdownValue}>{countdown}</Text>
          </View>
        )}

        <SpinWheel
          onResult={handleSpinResult}
          disabled={!spinAvailable}
        />
      </ScrollView>

      {/* Result modal */}
      <Modal visible={showResult} transparent animationType="none">
        <View style={styles.overlay}>
          <Animated.View style={[styles.resultCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.resultEmoji}>
              {result?.icon || (result?.type === 'coins' ? '🪙' : '💡')}
            </Text>
            <Text style={styles.resultTitle}>You Won!</Text>
            <Text style={styles.resultValue}>{result?.label}</Text>
            <Text style={styles.resultSub}>Added to your balance</Text>
            <TouchableOpacity
              style={styles.resultBtn}
              onPress={() => setShowResult(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.resultBtnText}>Awesome! 🎉</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme) => {
  const warn = theme.warn || '#fbbf24';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceRaised,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnText: {
      fontSize: 22,
      color: theme.text,
      lineHeight: 24,
      marginTop: -2,
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    balRow: {
      flexDirection: 'row',
      gap: 12,
    },
    balText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    scrollBody: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    subtitle: {
      fontSize: 13,
      color: theme.muted,
      textAlign: 'center',
      marginBottom: 14,
    },
    countdownBanner: {
      backgroundColor: 'rgba(251,191,36,0.1)',
      borderWidth: 1.5,
      borderColor: warn,
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignItems: 'center',
      marginBottom: 14,
    },
    countdownLabel: {
      fontSize: 11,
      color: warn,
      letterSpacing: 1,
      fontWeight: '800',
    },
    countdownValue: {
      fontSize: 22,
      fontWeight: '900',
      color: warn,
      marginTop: 2,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(8,3,18,0.88)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    resultCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 32,
      alignItems: 'center',
      width: '100%',
      maxWidth: 340,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    resultEmoji: {
      fontSize: 56,
      marginBottom: 12,
    },
    resultTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.text,
      marginBottom: 8,
    },
    resultValue: {
      fontSize: 20,
      fontWeight: '800',
      color: warn,
      marginBottom: 6,
    },
    resultSub: {
      fontSize: 13,
      color: theme.muted,
      marginBottom: 20,
    },
    resultBtn: {
      backgroundColor: theme.primary,
      borderRadius: 40,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    resultBtnText: {
      color: theme.background,
      fontWeight: '900',
      fontSize: 16,
    },
  });
};