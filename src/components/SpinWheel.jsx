// src/components/SpinWheel.jsx
// Animated spin wheel for React Native using Animated + SVG math.

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { SPIN_SEGMENTS } from '../utils/CoinManager';
import AdManager from '../ads/AdManager';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W - 48, 300);
const RADIUS = WHEEL_SIZE / 2;
const CENTER = RADIUS;
const SEG_ANGLE = 360 / SPIN_SEGMENTS.length;

function polarToXY(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function segmentPath(index) {
  const startAngle = index * SEG_ANGLE;
  const endAngle = startAngle + SEG_ANGLE;
  const start = polarToXY(startAngle, RADIUS - 2);
  const end = polarToXY(endAngle, RADIUS - 2);
  const mid = polarToXY(startAngle + SEG_ANGLE / 2, RADIUS * 0.62);
  const largeArc = SEG_ANGLE > 180 ? 1 : 0;
  return {
    d: `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS - 2} ${RADIUS - 2} 0 ${largeArc} 1 ${end.x} ${end.y} Z`,
    textX: mid.x,
    textY: mid.y,
    midAngle: startAngle + SEG_ANGLE / 2,
  };
}

export default function SpinWheel({ onResult, disabled, }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [resultIndex, setResultIndex] = useState(null);

  const spin = async () => {
    if (spinning || disabled) return;

    try {
      setSpinning(true);

      // Rewarded show
      const adShown = await AdManager.showAd(
        'rewarded',
        () => {
          console.log('Reward earned');
        }
      );

      // Meta Rewarded Policy: Do not grant rewards if ad skipped or failed
      if (!adShown) {
        setSpinning(false);
        return;
      }

      console.log('Ad result:', adShown);

      // Pick random segment
      const winner = Math.floor(
        Math.random() * SPIN_SEGMENTS.length
      );

      setResultIndex(null);

      const segCenter =
        winner * SEG_ANGLE + SEG_ANGLE / 2;

      const targetOffset =
        360 - segCenter;

      const totalRotation =
        currentRotation.current +
        5 * 360 +
        targetOffset;

      spinAnim.setValue(
        currentRotation.current
      );

      currentRotation.current =
        totalRotation;

      Animated.timing(spinAnim, {
        toValue: totalRotation,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setSpinning(false);
        setResultIndex(winner);

        onResult &&
          onResult(
            SPIN_SEGMENTS[winner]
          );
      });

    } catch (err) {
      console.log(
        'Spin error:',
        err
      );

      setSpinning(false);
    }
  };

  const rotation = spinAnim.interpolate({
    inputRange: [currentRotation.current - 360 * 6, currentRotation.current + 360 * 6],
    outputRange: ['-2160deg', '2160deg'],
    extrapolate: 'clamp',
  });

  // Use a simpler interpolation approach
  const rotateStyle = {
    transform: [{
      rotate: spinAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
        extrapolate: 'extend',
      })
    }]
  };

  return (
    <View style={styles.container}>
      {/* Pointer at top */}
      <View style={styles.pointer} />

      {/* Wheel */}
      <Animated.View style={[styles.wheelWrap, rotateStyle]}>
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
          {SPIN_SEGMENTS.map((seg, i) => {
            const { d, textX, textY, midAngle } = segmentPath(i);
            return (
              <G key={i}>
                <Path d={d} fill={seg.color} stroke="#0f1923" strokeWidth={2} />
                <SvgText
                  x={textX}
                  y={textY}
                  fill="#fff"
                  fontSize={10}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  rotation={midAngle}
                  originX={textX}
                  originY={textY}
                >
                  {seg.label}
                </SvgText>
              </G>
            );
          })}
          {/* Center circle */}
          <Path
            d={`M ${CENTER} ${CENTER} m -18 0 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0`}
            fill="#0f1923"
            stroke="#4da9ff"
            strokeWidth={2.5}
          />
        </Svg>
      </Animated.View>

      {/* Probability Disclosure (Meta Policy Requirement) */}
      <Text style={{ fontSize: 10, color: '#9AA0A6', marginTop: 8, textAlign: 'center' }}>
        Watch Video Ad to Spin (Equal Odds: 1/{SPIN_SEGMENTS.length} per reward)
      </Text>

      {/* Spin button */}
      <TouchableOpacity
        style={[styles.spinBtn, (spinning || disabled) && styles.spinBtnDisabled]}
        onPress={spin}
        disabled={spinning || disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.spinBtnText}>
          {spinning ? 'Spinning…' : disabled ? 'Come Back Soon' : '📺 WATCH AD & SPIN!'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 22,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#f87171',
    marginBottom: -2, zIndex: 10,
  },
  wheelWrap: {
    width: WHEEL_SIZE, height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#2a3a4a',
    shadowColor: '#4da9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  spinBtn: {
    marginTop: 20,
    backgroundColor: '#4da9ff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 40,
    shadowColor: '#4da9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  spinBtnDisabled: { opacity: 0.45 },
  spinBtnText: { color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});