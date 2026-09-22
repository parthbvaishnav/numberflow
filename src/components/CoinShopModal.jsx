// src/components/CoinShopModal.jsx
// Complete Game Shop with 40 Purchasable Themes (0 - 38,999 Coins) & Premium Hints/Rewards Store

import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  getCoins,
  getHints,
  spendCoins,
  addHints,
  addCoins,
  HINT_PLANS,
} from '../utils/CoinManager';
import { getProfile, unlockTheme } from '../utils/ProfileManager';
import AdManager from '../ads/AdManager';
import { useTheme, themes } from '../constants/theme';

const BUNDLE_META = {
  h1: { tag: 'STARTER PACK', tagColor: '#38BDF8', tagBg: 'rgba(56,189,248,0.15)', icon: '💡' },
  h2: { tag: '🔥 MOST POPULAR', tagColor: '#F59E0B', tagBg: 'rgba(245,158,11,0.2)', icon: '💡💡' },
  h3: { tag: 'PRO SOLVER', tagColor: '#A855F7', tagBg: 'rgba(168,85,247,0.15)', icon: '💡💡' },
  h4: { tag: '⚡ MEGA VALUE', tagColor: '#EC4899', tagBg: 'rgba(236,72,153,0.15)', icon: '💡💡💡' },
  h5: { tag: '👑 ULTIMATE PACK', tagColor: '#EAB308', tagBg: 'rgba(234,179,8,0.2)', icon: '💡💡💡💡' },
};

export default function CoinShopModal({ visible, onClose, onUpdate }) {
  const { theme, setTheme, themeId } = useTheme();
  const s = getStyles(theme);

  // Tab State: 'themes' | 'hints'
  const [activeTab, setActiveTab] = useState('themes');
  // Tier Filter: 'all' | 'under_5k' | '5k_15k' | '15k_25k' | '25k_plus'
  const [tierFilter, setTierFilter] = useState('all');

  const [coins, setCoinsState] = useState(0);
  const [hints, setHintsState] = useState(0);
  const [unlockedThemes, setUnlockedThemes] = useState(['default']);

  const [hintLoading, setHintLoading] = useState(false);
  const [coinLoading, setCoinLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  const refresh = async () => {
    try {
      const [c, h, prof] = await Promise.all([
        getCoins(),
        getHints(),
        getProfile(),
      ]);
      setCoinsState(c);
      setHintsState(h);
      if (prof?.unlockedThemes) {
        setUnlockedThemes(prof.unlockedThemes);
      }
    } catch (e) {
      console.warn('[CoinShopModal] Failed to refresh:', e);
    }
  };

  useEffect(() => {
    if (visible) {
      refresh();
      AdManager.preloadAd('rewarded');
    }
  }, [visible]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  // ── Equip Theme ─────────────────────────────────────────────────────────
  const handleEquipTheme = async (id, name) => {
    await setTheme(id);
    showToast(`⚡ Equipped "${name}"!`);
  };

  // ── Buy / Unlock Theme ──────────────────────────────────────────────────
  const handleBuyTheme = async (t) => {
    if (coins < t.cost) {
      showToast(`❌ Need 🪙 ${(t.cost - coins).toLocaleString()} more coins!`);
      return;
    }

    setActionLoading(true);
    try {
      const success = await unlockTheme(t.id, t.cost);
      if (success) {
        await setTheme(t.id);
        await refresh();
        if (onUpdate) onUpdate();
        showToast(`🎉 "${t.name}" unlocked & equipped!`);
      } else {
        showToast('Purchase failed. Check coin balance.');
      }
    } catch (e) {
      console.error('[CoinShopModal] Buy error:', e);
      showToast('Error completing purchase.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Buy Hints ───────────────────────────────────────────────────────────
  const handleBuyHints = async (plan) => {
    setActionLoading(true);
    const spent = await spendCoins(plan.coins);
    if (!spent) {
      showToast('❌ Not enough coins! 🪙');
      setActionLoading(false);
      return;
    }
    await addHints(plan.hints);
    await refresh();
    if (onUpdate) onUpdate();
    setActionLoading(false);
    showToast(`✅ Got ${plan.hints} Hints!`);
  };

  // ── Watch Ads ───────────────────────────────────────────────────────────
  const handleWatchForHint = async () => {
    setHintLoading(true);
    const ok = await AdManager.showAd('rewarded', async () => {
      await addHints(1);
      await refresh();
      if (onUpdate) onUpdate();
      showToast('💡 +1 Hint earned!');
    });
    setHintLoading(false);
    if (!ok) showToast('Ad not available — try again later.');
  };

  const handleWatchForCoins = async () => {
    setCoinLoading(true);
    const ok = await AdManager.showAd('rewarded', async () => {
      await addCoins(50);
      await refresh();
      if (onUpdate) onUpdate();
      showToast('🪙 +50 Coins earned!');
    });
    setCoinLoading(false);
    if (!ok) showToast('Ad not available — try again later.');
  };

  // ── Filtered Theme List ─────────────────────────────────────────────────
  const themeList = useMemo(() => {
    const list = Object.values(themes);
    if (tierFilter === 'all') return list;
    if (tierFilter === 'under_5k') return list.filter((t) => t.cost <= 4999);
    if (tierFilter === '5k_15k') return list.filter((t) => t.cost >= 5000 && t.cost <= 14999);
    if (tierFilter === '15k_25k') return list.filter((t) => t.cost >= 15000 && t.cost <= 24999);
    if (tierFilter === '25k_plus') return list.filter((t) => t.cost >= 25000);
    return list;
  }, [tierFilter]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Top Handle Bar */}
          <View style={s.handleBar} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>🛍️ Game Shop</Text>
            <TouchableOpacity onPress={onClose} style={s.closeX} activeOpacity={0.7}>
              <Text style={s.closeXText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Row */}
          <View style={s.balanceRow}>
            <View style={s.balancePill}>
              <Text style={s.balanceIcon}>🪙</Text>
              <View>
                <Text style={s.balanceLabel}>YOUR COINS</Text>
                <Text style={s.balanceVal}>{coins.toLocaleString()}</Text>
              </View>
            </View>
            <View style={s.balancePill}>
              <Text style={s.balanceIcon}>💡</Text>
              <View>
                <Text style={s.balanceLabel}>YOUR HINTS</Text>
                <Text style={s.balanceVal}>{hints}</Text>
              </View>
            </View>
          </View>

          {/* Segmented Tabs */}
          <View style={s.tabBar}>
            <TouchableOpacity
              style={[s.tabItem, activeTab === 'themes' && s.tabItemActive]}
              onPress={() => setActiveTab('themes')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, activeTab === 'themes' && s.tabTextActive]}>
                🎨 Themes (40)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.tabItem, activeTab === 'hints' && s.tabItemActive]}
              onPress={() => setActiveTab('hints')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, activeTab === 'hints' && s.tabTextActive]}>
                💡 Hints & Rewards
              </Text>
            </TouchableOpacity>
          </View>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* Tab 1: Themes (40)                                              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'themes' && (
            <View style={{ flex: 1 }}>
              {/* Tier Filter Chips */}
              <View style={s.filterRow}>
                <TouchableOpacity
                  style={[s.filterChip, tierFilter === 'all' && s.filterChipActive]}
                  onPress={() => setTierFilter('all')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.filterText, tierFilter === 'all' && s.filterTextActive]}>
                    All (40)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.filterChip, tierFilter === 'under_5k' && s.filterChipActive]}
                  onPress={() => setTierFilter('under_5k')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.filterText, tierFilter === 'under_5k' && s.filterTextActive]}>
                    &lt; 5K (Starter)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.filterChip, tierFilter === '5k_15k' && s.filterChipActive]}
                  onPress={() => setTierFilter('5k_15k')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.filterText, tierFilter === '5k_15k' && s.filterTextActive]}>
                    5K - 15K
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.filterChip, tierFilter === '15k_25k' && s.filterChipActive]}
                  onPress={() => setTierFilter('15k_25k')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.filterText, tierFilter === '15k_25k' && s.filterTextActive]}>
                    15K - 25K
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.filterChip, tierFilter === '25k_plus' && s.filterChipActive]}
                  onPress={() => setTierFilter('25k_plus')}
                  activeOpacity={0.75}
                >
                  <Text style={[s.filterText, tierFilter === '25k_plus' && s.filterTextActive]}>
                    25K - 39K
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Theme Cards List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 28 }}
              >
                {themeList.map((t, index) => {
                  const isEquipped = themeId === t.id;
                  const isUnlocked = unlockedThemes.includes(t.id) || t.cost === 0;

                  return (
                    <View
                      key={t.id}
                      style={[
                        s.themeCard,
                        isEquipped && s.themeCardEquipped,
                      ]}
                    >
                      {/* Left: Icon & Info */}
                      <View style={s.themeInfoCol}>
                        <View style={s.themeHeaderRow}>
                          <Text style={s.themeIcon}>{t.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={s.themeName} numberOfLines={1}>
                              {t.name}
                            </Text>
                            <View style={s.badgeRow}>
                              {t.cost === 0 ? (
                                <View style={s.freeBadge}>
                                  <Text style={s.freeBadgeText}>FREE (CLASSIC)</Text>
                                </View>
                              ) : (
                                <View style={s.costBadge}>
                                  <Text style={s.costBadgeText}>🪙 {t.cost.toLocaleString()}</Text>
                                </View>
                              )}
                              {isEquipped && (
                                <View style={s.activeBadge}>
                                  <Text style={s.activeBadgeText}>ACTIVE</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Color Palette Preview Swatches */}
                        <View style={s.paletteRow}>
                          <Text style={s.paletteLabel}>Colors:</Text>
                          <View
                            style={[
                              s.colorDot,
                              { backgroundColor: t.background, borderColor: '#4a5568' },
                            ]}
                          />
                          <View
                            style={[
                              s.colorDot,
                              { backgroundColor: t.surface, borderColor: '#4a5568' },
                            ]}
                          />
                          <View
                            style={[
                              s.colorDot,
                              { backgroundColor: t.primary, borderColor: '#fff' },
                            ]}
                          />
                          <View
                            style={[
                              s.colorDot,
                              { backgroundColor: t.accent, borderColor: '#fff' },
                            ]}
                          />
                          {/* Mini Sample Preview Chip */}
                          <View
                            style={[
                              s.miniPreview,
                              {
                                backgroundColor: t.surface,
                                borderColor: t.primary,
                              },
                            ]}
                          >
                            <Text style={[s.miniPreviewText, { color: t.primary }]}>
                              Preview
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Right: Action Button */}
                      <View style={s.themeActionCol}>
                        {isEquipped ? (
                          <View style={s.equippedBtn}>
                            <Text style={s.equippedBtnText}>✓ ON</Text>
                          </View>
                        ) : isUnlocked ? (
                          <TouchableOpacity
                            style={s.equipBtn}
                            activeOpacity={0.8}
                            onPress={() => handleEquipTheme(t.id, t.name)}
                          >
                            <Text style={s.equipBtnText}>EQUIP</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[
                              s.unlockBtn,
                              coins < t.cost && s.unlockBtnDisabled,
                            ]}
                            activeOpacity={0.8}
                            disabled={actionLoading}
                            onPress={() => handleBuyTheme(t)}
                          >
                            <Text style={s.unlockBtnText}>BUY</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* Tab 2: Hints & Rewards (Premium Redesigned)                     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'hints' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Hero Banner */}
              <View style={s.heroBanner}>
                <View style={s.heroIconOrb}>
                  <Text style={s.heroIconText}>⚡</Text>
                </View>
                <View style={s.heroContent}>
                  <View style={s.heroBadge}>
                    <Text style={s.heroBadgeText}>PUZZLE POWER-UPS</Text>
                  </View>
                  <Text style={s.heroTitle}>Never Get Stuck!</Text>
                  <Text style={s.heroSub}>
                    Get instant hints to reveal tricky links or watch quick videos to earn free coins!
                  </Text>
                </View>
              </View>

              {/* ── Section 1: Free Video Rewards ──────────────────────── */}
              <View style={s.sectionHeaderRow}>
                <Text style={s.sectionTitle}>🎁 FREE VIDEO REWARDS</Text>
                <Text style={s.sectionSubBadge}>UNLIMITED</Text>
              </View>

              {/* Reward Card 1: 1 Free Hint */}
              <View style={[s.rewardCard, { borderColor: 'rgba(56, 189, 248, 0.4)' }]}>
                <View style={[s.rewardIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' }]}>
                  <Text style={s.rewardIconEmoji}>💡</Text>
                </View>

                <View style={s.rewardInfo}>
                  <View style={s.rewardTitleRow}>
                    <Text style={s.rewardTitle}>Free Hint Boost</Text>
                    <View style={[s.freeRewardTag, { backgroundColor: 'rgba(56, 189, 248, 0.2)', borderColor: '#38BDF8' }]}>
                      <Text style={[s.freeRewardTagText, { color: '#38BDF8' }]}>+1 HINT</Text>
                    </View>
                  </View>
                  <Text style={s.rewardSub}>Watch 1 short sponsor video</Text>
                </View>

                <TouchableOpacity
                  style={[s.watchBtn, { backgroundColor: '#38BDF8' }]}
                  onPress={handleWatchForHint}
                  disabled={hintLoading}
                  activeOpacity={0.8}
                >
                  {hintLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={s.watchBtnText}>📺 WATCH</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Reward Card 2: 50 Free Coins */}
              <View style={[s.rewardCard, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                <View style={[s.rewardIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}>
                  <Text style={s.rewardIconEmoji}>🪙</Text>
                </View>

                <View style={s.rewardInfo}>
                  <View style={s.rewardTitleRow}>
                    <Text style={s.rewardTitle}>Coin Bonus Stash</Text>
                    <View style={[s.freeRewardTag, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }]}>
                      <Text style={[s.freeRewardTagText, { color: '#F59E0B' }]}>+50 COINS</Text>
                    </View>
                  </View>
                  <Text style={s.rewardSub}>Watch 1 short sponsor video</Text>
                </View>

                <TouchableOpacity
                  style={[s.watchBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={handleWatchForCoins}
                  disabled={coinLoading}
                  activeOpacity={0.8}
                >
                  {coinLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={s.watchBtnText}>📺 WATCH</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* ── Section 2: Buy Hint Bundles with Coins ───────────────── */}
              <View style={[s.sectionHeaderRow, { marginTop: 18 }]}>
                <Text style={s.sectionTitle}>💡 HINT BUNDLE STORE</Text>
                <Text style={s.sectionSubBadge}>INSTANT UNLOCK</Text>
              </View>

              {HINT_PLANS.map((plan) => {
                const meta = BUNDLE_META[plan.id] || {
                  tag: 'HINT PACK',
                  tagColor: '#38BDF8',
                  tagBg: 'rgba(56,189,248,0.15)',
                  icon: '💡',
                };
                const canAfford = coins >= plan.coins;

                return (
                  <View
                    key={plan.id}
                    style={[
                      s.bundleCard,
                      plan.id === 'h2' && s.bundleCardPopular,
                    ]}
                  >
                    {/* Left Icon Orb */}
                    <View style={s.bundleIconOrb}>
                      <Text style={s.bundleIconEmoji}>{meta.icon}</Text>
                    </View>

                    {/* Middle Info */}
                    <View style={s.bundleDetails}>
                      <View style={s.bundleHeader}>
                        <View style={[s.bundleTag, { backgroundColor: meta.tagBg, borderColor: meta.tagColor }]}>
                          <Text style={[s.bundleTagText, { color: meta.tagColor }]}>
                            {meta.tag}
                          </Text>
                        </View>
                      </View>

                      <Text style={s.bundleHintsCount}>
                        {plan.hints} Hints Bundle
                      </Text>

                      <View style={s.bundlePriceRow}>
                        <Text style={s.bundlePriceIcon}>🪙</Text>
                        <Text style={s.bundlePriceText}>
                          {plan.coins.toLocaleString()} Coins
                        </Text>
                      </View>
                    </View>

                    {/* Right Buy Button */}
                    <TouchableOpacity
                      style={[
                        s.bundleBuyBtn,
                        !canAfford && s.bundleBuyBtnDisabled,
                      ]}
                      onPress={() => handleBuyHints(plan)}
                      disabled={!canAfford || actionLoading}
                      activeOpacity={0.8}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={[s.bundleBuyBtnText, !canAfford && s.bundleBuyBtnTextDisabled]}>
                          {canAfford ? 'BUY' : 'NEED COINS'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Toast Notification */}
          {!!toast && (
            <View style={s.toast}>
              <Text style={s.toastText}>{toast}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme) => {
  const good = theme.good || '#10B981';
  const warn = theme.warn || '#F59E0B';
  const primary = theme.primary || '#38BDF8';

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(5, 10, 18, 0.88)',
      justifyContent: 'flex-end',
    },
    card: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
      height: '90%',
    },
    handleBar: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: 'center',
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.5,
    },
    closeX: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    closeXText: {
      color: theme.muted,
      fontSize: 14,
      fontWeight: '700',
    },
    balanceRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    balancePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.04)',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    balanceIcon: {
      fontSize: 24,
    },
    balanceLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.muted,
      letterSpacing: 0.8,
    },
    balanceVal: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.04)',
      borderRadius: 14,
      padding: 4,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    tabItemActive: {
      backgroundColor: '#8B5CF6',
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.muted,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.04)',
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: {
      backgroundColor: 'rgba(139, 92, 246, 0.25)',
      borderColor: '#8B5CF6',
    },
    filterText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.muted,
    },
    filterTextActive: {
      color: '#A78BFA',
      fontWeight: '800',
    },
    themeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.04)',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 12,
      marginBottom: 10,
    },
    themeCardEquipped: {
      borderColor: good,
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    themeInfoCol: {
      flex: 1,
      marginRight: 10,
    },
    themeHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    themeIcon: {
      fontSize: 24,
    },
    themeName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    freeBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: good,
    },
    freeBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: good,
      letterSpacing: 0.5,
    },
    costBadge: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: warn,
    },
    costBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: warn,
    },
    activeBadge: {
      backgroundColor: good,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    activeBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#000000',
    },
    paletteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    paletteLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.muted,
      marginRight: 2,
    },
    colorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
    },
    miniPreview: {
      paddingHorizontal: 7,
      paddingVertical: 1,
      borderRadius: 6,
      borderWidth: 1,
      marginLeft: 4,
    },
    miniPreviewText: {
      fontSize: 9,
      fontWeight: '700',
    },
    themeActionCol: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    equippedBtn: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: good,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
    },
    equippedBtnText: {
      color: good,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    equipBtn: {
      backgroundColor: primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 14,
      elevation: 2,
    },
    equipBtnText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    unlockBtn: {
      backgroundColor: '#8B5CF6',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 14,
      elevation: 2,
    },
    unlockBtnDisabled: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      opacity: 0.6,
    },
    unlockBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    // ── Hints & Rewards Styles ─────────────────────────────────────────────
    heroBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      padding: 14,
      marginBottom: 16,
    },
    heroIconOrb: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(139, 92, 246, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: '#8B5CF6',
    },
    heroIconText: {
      fontSize: 22,
    },
    heroContent: {
      flex: 1,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#8B5CF6',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
      marginBottom: 3,
    },
    heroBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 2,
    },
    heroSub: {
      color: theme.muted,
      fontSize: 11,
      lineHeight: 15,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#A78BFA',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    sectionSubBadge: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.muted,
      letterSpacing: 0.5,
    },
    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.04)',
      borderRadius: 18,
      borderWidth: 1.5,
      padding: 12,
      marginBottom: 10,
    },
    rewardIconBox: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rewardIconEmoji: {
      fontSize: 22,
    },
    rewardInfo: {
      flex: 1,
    },
    rewardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    rewardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    freeRewardTag: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 5,
      borderWidth: 1,
    },
    freeRewardTagText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    rewardSub: {
      fontSize: 11,
      color: theme.muted,
    },
    watchBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      elevation: 2,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 92,
    },
    watchBtnText: {
      color: '#000000',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    // ── Bundle Cards Styles ────────────────────────────────────────────────
    bundleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceRaised || 'rgba(255,255,255,0.04)',
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 12,
      marginBottom: 10,
    },
    bundleCardPopular: {
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
    },
    bundleIconOrb: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    bundleIconEmoji: {
      fontSize: 18,
    },
    bundleDetails: {
      flex: 1,
    },
    bundleHeader: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    bundleTag: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
      borderWidth: 1,
    },
    bundleTagText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    bundleHintsCount: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 3,
    },
    bundlePriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    bundlePriceIcon: {
      fontSize: 13,
    },
    bundlePriceText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#F59E0B',
    },
    bundleBuyBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 12,
      elevation: 2,
      minWidth: 88,
      alignItems: 'center',
    },
    bundleBuyBtnDisabled: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      elevation: 0,
    },
    bundleBuyBtnText: {
      color: '#000000',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    bundleBuyBtnTextDisabled: {
      color: theme.muted,
      fontSize: 9.5,
    },

    toast: {
      position: 'absolute',
      bottom: 24,
      left: 20,
      right: 20,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      elevation: 6,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
    },
    toastText: {
      color: theme.text,
      fontWeight: '800',
      fontSize: 13,
      textAlign: 'center',
    },
  });
};
