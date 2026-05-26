// src/screens/SpinWheelScreen.jsx
// Full-screen spin wheel. Shows result modal after spin.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SpinWheel from '../components/SpinWheel';
import {
  canSpin, recordSpin, addCoins, addHints,
  getCoins, getHints, getSpinTimeRemaining, formatCountdown,
} from '../utils/CoinManager';

const COLORS = {
  bg: '#0f1923', surface: '#16212b', surfaceRaised: '#1c2d3a',
  border: '#2a3a4a', text: '#f0f6ff', muted: '#6a8fa8',
  accent: '#4da9ff', good: '#34d399', warn: '#fbbf24',
};

export default function SpinWheelScreen() {
  const navigation = useNavigation();
  const [spinAvailable, setSpinAvailable] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [coins, setCoins] = useState(0);
  const [hints, setHints] = useState(0);
  const scaleAnim = React.useRef(new Animated.Value(0.7)).current;

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
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top bar */}
      <View style={s.topbar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>🎡 Spin Wheel</Text>
        <View style={s.balRow}>
          <Text style={s.balText}>🪙{coins}</Text>
          <Text style={s.balText}>💡{hints}</Text>
        </View>
      </View>

      <View style={s.content}>
        <Text style={s.subtitle}>Spin once per day to win coins and hints!</Text>

        {!spinAvailable && !!countdown && (
          <View style={s.countdownBanner}>
            <Text style={s.countdownLabel}>Next spin in</Text>
            <Text style={s.countdownValue}>{countdown}</Text>
          </View>
        )}

        <SpinWheel
          onResult={handleSpinResult}
          disabled={!spinAvailable}
        />
      </View>

      {/* Result modal */}
      <Modal visible={showResult} transparent animationType="none">
        <View style={s.overlay}>
          <Animated.View style={[s.resultCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={s.resultEmoji}>
              {result?.type === 'coins' ? '🪙' : '💡'}
            </Text>
            <Text style={s.resultTitle}>You Won!</Text>
            <Text style={s.resultValue}>{result?.label}</Text>
            <Text style={s.resultSub}>Added to your balance</Text>
            <TouchableOpacity
              style={s.resultBtn}
              onPress={() => setShowResult(false)}
              activeOpacity={0.85}
            >
              <Text style={s.resultBtnText}>Awesome! 🎉</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surfaceRaised, borderWidth: 1.5,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: COLORS.text, lineHeight: 22 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.text },
  balRow: { flexDirection: 'row', gap: 12 },
  balText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  subtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 16 },
  countdownBanner: {
    backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1.5,
    borderColor: COLORS.warn, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 10,
    alignItems: 'center', marginBottom: 16,
  },
  countdownLabel: { fontSize: 11, color: COLORS.warn, letterSpacing: 1 },
  countdownValue: { fontFamily: 'monospace', fontSize: 22, fontWeight: '700', color: COLORS.warn },
  overlay: {
    flex: 1, backgroundColor: 'rgba(10,18,26,0.88)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  resultCard: {
    backgroundColor: COLORS.surface, borderRadius: 24,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: 32, alignItems: 'center', width: '100%', maxWidth: 340,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  resultValue: { fontSize: 20, fontWeight: '700', color: COLORS.warn, marginBottom: 6 },
  resultSub: { fontSize: 13, color: COLORS.muted, marginBottom: 20 },
  resultBtn: {
    backgroundColor: COLORS.accent, borderRadius: 40,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  resultBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});