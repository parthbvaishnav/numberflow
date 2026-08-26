import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { SPIN_SEGMENTS } from '../utils/CoinManager';
import AdManager from '../ads/AdManager';
import { useTheme } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const WHEEL_SIZE = Math.max(200, Math.min(280, SCREEN_W - 64, SCREEN_H * 0.36));

const R = 100;
const CX = 100;
const CY = 100;
const SECTOR_ANGLE = 360 / SPIN_SEGMENTS.length;

const pointOnCircle = (angleDeg, radius) => {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  };
};

function sectorPath(index) {
  const a0 = index * SECTOR_ANGLE;
  const a1 = a0 + SECTOR_ANGLE;
  const p0 = pointOnCircle(a0, R);
  const p1 = pointOnCircle(a1, R);
  const largeArc = SECTOR_ANGLE > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${largeArc} 1 ${p1.x} ${p1.y} Z`;
}

function rotationForPrize(index, currentRotation) {
  const centre = (index + 0.5) * SECTOR_ANGLE;
  const mod = (360 - (centre % 360)) % 360;
  const minimum = currentRotation + 360 * 5;
  let target = Math.ceil((minimum - mod) / 360) * 360 + mod;
  if (target <= minimum) target += 360;
  return target;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static Wheel Face Component
// ─────────────────────────────────────────────────────────────────────────────
const WheelFace = React.memo(({ bulbPhase }) => (
  <View style={styles.wheelFace}>
    <Svg width="100%" height="100%" viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#fff7d6" stopOpacity="1" />
          <Stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      {/* Pie sectors */}
      {SPIN_SEGMENTS.map((s, i) => (
        <Path
          key={s.id ?? i}
          d={sectorPath(i)}
          fill={s.color}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={0.8}
        />
      ))}

      {/* Inner shading rings for 3D depth */}
      <Circle cx={CX} cy={CY} r={R * 0.995} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={2} />
      <Circle cx={CX} cy={CY} r={R * 0.62} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

      {/* Center Hub */}
      <Circle cx={CX} cy={CY} r={19} fill="url(#hubGlow)" />
      <Circle cx={CX} cy={CY} r={19} fill="none" stroke="#7c2d12" strokeWidth={1.5} />
    </Svg>

    {/* Sector Icon and Text Labels */}
    <View style={styles.labelLayer} pointerEvents="none">
      {SPIN_SEGMENTS.map((s, i) => {
        const centre = (i + 0.5) * SECTOR_ANGLE;
        return (
          <View
            key={s.id ?? i}
            style={[
              styles.labelAnchor,
              {
                transform: [
                  { rotate: `${centre}deg` },
                  { translateY: -WHEEL_SIZE * 0.315 },
                ],
              },
            ]}
          >
            <Text style={styles.sectorIcon}>{s.icon || '🪙'}</Text>
            <Text style={styles.sectorText}>{s.short || s.label}</Text>
          </View>
        );
      })}
    </View>

    {/* Blinking Rim Bulbs (Out of Phase) */}
    <View style={styles.labelLayer} pointerEvents="none">
      {Array.from({ length: 16 }, (_, i) => {
        const angle = i * (360 / 16);
        const odd = i % 2 === 1;
        return (
          <Animated.View
            key={`bulb-${i}`}
            style={[
              styles.bulb,
              {
                opacity: bulbPhase.interpolate({
                  inputRange: [0, 1],
                  outputRange: odd ? [1, 0.35] : [0.35, 1],
                }),
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: -WHEEL_SIZE * 0.5 + 7 },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  </View>
));

// ─────────────────────────────────────────────────────────────────────────────
// SpinWheel Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SpinWheel({ onResult, disabled }) {
  const { theme } = useTheme();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef(0);
  const bulbPhase = useRef(new Animated.Value(0)).current;
  const prizePop = useRef(new Animated.Value(0)).current;
  const hubPulse = useRef(new Animated.Value(1)).current;

  const [spinning, setSpinning] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);

  // Blinking Bulbs Loop
  useEffect(() => {
    const bulbs = Animated.loop(
      Animated.sequence([
        Animated.timing(bulbPhase, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(bulbPhase, { toValue: 0, duration: 520, useNativeDriver: true }),
      ])
    );
    bulbs.start();
    return () => bulbs.stop();
  }, [bulbPhase]);

  // Hub Pulse Animation when idle
  useEffect(() => {
    if (spinning || disabled) {
      hubPulse.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(hubPulse, {
          toValue: 1.08,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hubPulse, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [spinning, disabled, hubPulse]);

  const spin = async () => {
    if (spinning || disabled || adLoading) return;

    try {
      setAdLoading(true);
      setWonPrize(null);
      prizePop.setValue(0);

      // Rewarded Ad Show
      const adShown = await AdManager.showAd('rewarded');
      setAdLoading(false);

      if (!adShown) return;

      setSpinning(true);

      const winnerIndex = Math.floor(Math.random() * SPIN_SEGMENTS.length);
      const targetRotation = rotationForPrize(winnerIndex, rotationRef.current);
      rotationRef.current = targetRotation;

      Animated.timing(spinAnim, {
        toValue: targetRotation,
        duration: 4200,
        easing: Easing.bezier(0.15, 0.9, 0.15, 1),
        useNativeDriver: true,
      }).start(({ finished }) => {
        setSpinning(false);
        if (!finished) return;

        const prize = SPIN_SEGMENTS[winnerIndex];
        setWonPrize(prize);

        Animated.spring(prizePop, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 12,
        }).start();

        onResult && onResult(prize);
      });
    } catch (err) {
      console.log('Spin error:', err);
      setAdLoading(false);
      setSpinning(false);
    }
  };

  const rotate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const isBusy = spinning || adLoading;

  return (
    <View style={styles.container}>
      {/* ── Wheel Stage ────────────────────────────────────────────────── */}
      <View style={styles.wheelStage}>
        <View style={[styles.glowRing, { backgroundColor: `${theme.primary}1f` }]} />

        <View style={[styles.wheelRim, { borderColor: theme.warn || '#fbbf24' }]}>
          <Animated.View style={[styles.wheelSpinner, { transform: [{ rotate }] }]}>
            <WheelFace bulbPhase={bulbPhase} />
          </Animated.View>
        </View>

        {/* Top Pointer at 12 o'clock */}
        <View style={styles.pointerWrap} pointerEvents="none">
          <View style={styles.pointerShadow} />
          <View style={[styles.pointer, { borderTopColor: theme.warn || '#fbbf24' }]} />
        </View>

        {/* Center Hub Tap Target */}
        <Animated.View style={[styles.hubWrap, { transform: [{ scale: hubPulse }] }]}>
          <TouchableOpacity
            style={[styles.hub, (isBusy || disabled) && styles.hubDisabled]}
            activeOpacity={0.85}
            disabled={isBusy || disabled}
            onPress={spin}
          >
            {adLoading ? (
              <ActivityIndicator size="small" color="#7c2d12" />
            ) : (
              <Text style={styles.hubText}>
                {spinning ? '•••' : 'SPIN'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Result Slot ────────────────────────────────────────────────── */}
      <View style={styles.resultSlot}>
        {wonPrize ? (
          <Animated.View
            style={[
              styles.prizeCard,
              {
                backgroundColor: 'rgba(52,211,153,0.14)',
                borderColor: theme.good || '#34d399',
                opacity: prizePop,
                transform: [
                  { scale: prizePop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                ],
              },
            ]}
          >
            <Text style={styles.prizeIcon}>{wonPrize.icon || '🪙'}</Text>
            <View>
              <Text style={[styles.prizeLabel, { color: theme.good || '#34d399' }]}>YOU WON</Text>
              <Text style={[styles.prizeValue, { color: theme.text }]}>{wonPrize.label}</Text>
            </View>
          </Animated.View>
        ) : (
          <Text style={[styles.hintText, { color: theme.muted }]}>
            {spinning
              ? 'Good luck…'
              : disabled
              ? 'Come back soon for your next spin'
              : 'Watch Video Ad to Spin (Equal Odds 1/8)'}
          </Text>
        )}
      </View>

      {/* ── Main Action Button ─────────────────────────────────────────── */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: theme.primary },
          (isBusy || disabled) && styles.actionBtnDisabled,
        ]}
        onPress={spin}
        disabled={isBusy || disabled}
        activeOpacity={0.85}
      >
        <Text style={[styles.actionText, { color: theme.background }]}>
          {adLoading
            ? 'LOADING AD…'
            : spinning
            ? 'SPINNING…'
            : disabled
            ? 'COME BACK SOON'
            : '📺 WATCH AD & SPIN!'}
        </Text>
      </TouchableOpacity>

      {/* ── Prize Legend Chips ────────────────────────────────────────── */}
      <View style={styles.legend}>
        {SPIN_SEGMENTS.map((s, i) => (
          <View
            key={s.id ?? i}
            style={[
              styles.legendChip,
              { backgroundColor: theme.surface, borderColor: `${s.color}aa` },
            ]}
          >
            <View style={[styles.legendSwatch, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: theme.text }]}>
              {s.icon} {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  wheelStage: {
    width: WHEEL_SIZE + 26,
    height: WHEEL_SIZE + 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  glowRing: {
    position: 'absolute',
    width: WHEEL_SIZE + 22,
    height: WHEEL_SIZE + 22,
    borderRadius: (WHEEL_SIZE + 22) / 2,
  },
  wheelRim: {
    width: WHEEL_SIZE + 14,
    height: WHEEL_SIZE + 14,
    borderRadius: (WHEEL_SIZE + 14) / 2,
    backgroundColor: '#170a2e',
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  wheelSpinner: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
  },
  wheelFace: {
    width: '100%',
    height: '100%',
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
  },
  labelLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  sectorIcon: {
    fontSize: 18,
  },
  sectorText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bulb: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff7d6',
  },
  pointerWrap: {
    position: 'absolute',
    top: -2,
    alignItems: 'center',
    zIndex: 20,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pointerShadow: {
    position: 'absolute',
    top: 3,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0,0,0,0.45)',
  },
  hubWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  hub: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: '#fff7d6',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  hubDisabled: {
    backgroundColor: '#8c7a4a',
    borderColor: '#b9a97f',
    opacity: 0.6,
  },
  hubText: {
    color: '#7c2d12',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  resultSlot: {
    minHeight: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  prizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  prizeIcon: {
    fontSize: 26,
  },
  prizeLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  prizeValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtn: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionText: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
  },
});