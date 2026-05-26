// src/components/DailyRewardModal.jsx

import React, { useEffect, useState } from 'react';

import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';

import {
  getDailyRewardStatus,
  claimDailyReward,
  DAILY_REWARDS,
  formatCountdown,
} from '../utils/CoinManager';

const COLORS = {
  bg: '#0f1923',
  surface: '#16212b',
  border: '#2a3a4a',
  text: '#f0f6ff',
  muted: '#6a8fa8',
  accent: '#4da9ff',
  good: '#34d399',
  warn: '#fbbf24',
};

export default function DailyRewardModal({
  visible,
  onClose,
  onClaimed,
}) {
  const [status, setStatus] = useState(null);
  const [claimed, setClaimed] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (visible) {
      checkReward();
    }
  }, [visible]);

  useEffect(() => {
    let interval;

    if (
      status &&
      !status.canClaim &&
      status.timeUntilNext > 0
    ) {
      setCountdown(
        formatCountdown(status.timeUntilNext)
      );

      interval = setInterval(() => {
        setStatus((prev) => {
          if (!prev) return prev;

          const remaining =
            prev.timeUntilNext - 1000;

          if (remaining <= 0) {
            clearInterval(interval);

            return {
              ...prev,
              canClaim: true,
              timeUntilNext: 0,
            };
          }

          setCountdown(
            formatCountdown(remaining)
          );

          return {
            ...prev,
            timeUntilNext: remaining,
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status]);

  const checkReward = async () => {
    const s = await getDailyRewardStatus();
    setStatus(s);
  };

  const handleClaim = async () => {
    const result = await claimDailyReward();

    if (result) {
      setClaimed(result);

      onClaimed && onClaimed(result);

      setTimeout(() => {
        setClaimed(null);
        onClose && onClose();
      }, 2200);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {claimed ? (
            <View style={styles.claimedView}>
              <Text style={styles.claimedEmoji}>
                🎉
              </Text>

              <Text style={styles.claimedTitle}>
                Reward Claimed!
              </Text>

              {claimed.coins > 0 && (
                <Text style={styles.claimedLine}>
                  🪙 +{claimed.coins} Coins
                </Text>
              )}

              {claimed.hints > 0 && (
                <Text style={styles.claimedLine}>
                  💡 +{claimed.hints} Hint
                </Text>
              )}
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.title}> 🎁 Daily Reward </Text>
                  <Text style={styles.subTitle}>Come every day and collect rewards</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={COLORS.accent}
                      style={styles.topIcon}
                    />
                </TouchableOpacity>
              </View>

              {/* Reward Grid */}
              <View style={styles.grid}>
                {DAILY_REWARDS.map((r, index) => {
                  const isToday =
                    r.day === status?.nextDay;

                  const isPast =
                    r.day <
                    (status?.nextDay || 1);

                  const isLocked =
                    r.day >
                    (status?.nextDay || 1);

                  return (
                    <LinearGradient
                      key={r.day}
                      colors={[
                        '#0B132B',
                        '#060B1A',
                      ]}
                      style={[
                        styles.rewardCard,
                        isToday &&
                          styles.activeCard,
                        isPast &&
                          styles.pastCard,
                      ]}
                    >
                      {/* Top Icon */}
                      {isPast && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.good}
                          style={styles.topIcon}
                        />
                      )}

                      {isLocked && (
                        <Ionicons
                          name="lock-closed-outline"
                          size={16}
                          color={COLORS.accent}
                          style={styles.topIcon}
                        />
                      )}

                      {/* Coin */}
                      <Text style={styles.coinEmoji}>
                        🪙
                      </Text>

                      {/* Reward */}
                      <Text style={styles.amount}>
                        {r.coins || r.hints}
                      </Text>

                      <Text style={styles.label}>
                        {r.coins > 0
                          ? 'Coins'
                          : 'Hints'}
                      </Text>

                      <Text style={styles.dayText}>
                        Day {r.day}
                      </Text>

                      {/* Button */}
                      {isPast ? (
                        <View
                          style={
                            styles.collectedBtn
                          }
                        >
                          <Text
                            style={
                              styles.collectedText
                            }
                          >
                            Collected
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          disabled={
                            !isToday ||
                            !status?.canClaim
                          }
                          onPress={handleClaim}
                          style={[
                            styles.collectBtn,
                            (!isToday ||
                              !status?.canClaim) &&
                              styles.disabledBtn,
                          ]}
                        >
                          <Text
                            style={[
                              styles.collectText,
                              (!isToday ||
                                !status?.canClaim) &&
                                styles.disabledText,
                            ]}
                          >
                            {status?.canClaim
                              ? 'Collect'
                              : 'Wait'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </LinearGradient>
                  );
                })}
              </View>

              {/* Countdown */}
              {!status?.canClaim && (
                <View style={styles.countdownWrap}>
                  <Text
                    style={styles.countdownLabel}
                  >
                    Next reward in
                  </Text>

                  <Text style={styles.countdown}>
                    {countdown}
                  </Text>
                </View>
              )}

              {/* Close Button */}
              {/* <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
              >
                <Text style={styles.closeBtnText}>
                  Close
                </Text>
              </TouchableOpacity> */}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },

  container: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4da9ff40',

    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    // textAlign: 'center',
  },

  subTitle: {
    fontSize: 13,
    color: COLORS.muted,
    // textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  rewardCard: {
    width: '31%',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4da9ff60',
    marginBottom: 12,
  },

  activeCard: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },

  pastCard: {
    opacity: 0.6,
  },

  topIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  coinEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },

  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  label: {
    fontSize: 10,
    color: COLORS.muted,
  },

  dayText: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 2,
    // marginTop: 4,
  },

  collectBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  collectText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  disabledBtn: {
    backgroundColor: '#3A3F47',
  },

  disabledText: {
    color: '#9AA0A6',
  },

  collectedBtn: {
    backgroundColor: '#4A4F57',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  collectedText: {
    color: '#C7CCD1',
    fontSize: 10,
    fontWeight: '600',
  },

  countdownWrap: {
    alignItems: 'center',
    marginTop: 10,
  },

  countdownLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },

  countdown: {
    color: COLORS.warn,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },

  closeBtn: {
    marginTop: 18,
    alignItems: 'center',
  },

  closeBtnText: {
    color: COLORS.muted,
    fontSize: 14,
  },

  claimedView: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  claimedEmoji: {
    fontSize: 54,
    marginBottom: 10,
  },

  claimedTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },

  claimedLine: {
    color: COLORS.good,
    fontSize: 20,
    marginTop: 6,
    fontWeight: '700',
  },
});