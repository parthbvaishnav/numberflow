// src/components/CoinShopModal.jsx
// Modal for purchasing hints with coins and earning coins/hints via rewarded ads.

import React, { useEffect, useState } from 'react';
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
import AdManager from '../ads/AdManager';
import { useTheme } from '../constants/theme';



export default function CoinShopModal({ visible, onClose, onUpdate }) {
  const { theme } = useTheme();
  const s = getStyles(theme);
  const good = theme.good || '#34d399';
  const warn = theme.warn || '#fbbf24';
  const bad = theme.bad || '#f87171';
  const [coins, setCoinsState] = useState(0);
  const [hints, setHintsState] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);
  const [coinLoading, setCoinLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [toast, setToast] = useState('');

  const refresh = async () => {
    setCoinsState(await getCoins());
    setHintsState(await getHints());
  };

  useEffect(() => { if (visible) refresh(); }, [visible]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleBuyHints = async (plan) => {
    setBuyLoading(true);
    const spent = await spendCoins(plan.coins);
    if (!spent) { showToast('Not enough coins! 🪙'); return; }
    await addHints(plan.hints);
    await refresh();
    onUpdate && onUpdate();
    setBuyLoading(false);
    showToast(`✅ Got ${plan.hints} Hints!`);
  };

  const handleWatchForHint = async () => {
     setHintLoading(true);
    const ok = await AdManager.showAd('rewarded', async () => {
      await addHints(1);
      await refresh();
      onUpdate && onUpdate();
      showToast('💡 +1 Hint earned!');
    });
     setHintLoading(false);
    if (!ok) showToast('Ad not available — try again later.');
  };

  const handleWatchForCoins = async () => {
     setCoinLoading(true);
    const ok = await AdManager.showAd('rewarded', async () => {
      await addCoins(99);
      await refresh();
      onUpdate && onUpdate();
      showToast('🪙 +99 Coins earned!');
    });
    setCoinLoading(false);
    if (!ok) showToast('Ad not available — try again later.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>💰 Coin Shop</Text>
            <TouchableOpacity onPress={onClose} style={s.closeX}>
              <Text style={s.closeXText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Balance row */}
          <View style={s.balanceRow}>
            <View style={s.balancePill}>
              <Text style={s.balanceIcon}>🪙</Text>
              <Text style={s.balanceVal}>{coins}</Text>
            </View>
            <View style={s.balancePill}>
              <Text style={s.balanceIcon}>💡</Text>
              <Text style={s.balanceVal}>{hints}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Watch ads section */}
            <Text style={s.sectionTitle}>Watch Ads & Earn</Text>

            <TouchableOpacity
              style={s.adRow}
              onPress={handleWatchForHint}
              disabled={hintLoading}
              activeOpacity={0.8}
            >
              {hintLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Text style={s.adRowIcon}>📺</Text>
                  <View style={s.adRowMiddle}>
                    <Text style={s.adRowTitle}>Watch Ad → 1 Free Hint</Text>
                    <Text style={s.adRowSub}>Watch a short video to earn a hint</Text>
                  </View>
                  <Text style={s.adRowReward}>💡×1</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.adRow}
              onPress={handleWatchForCoins}
              disabled={coinLoading}
              activeOpacity={0.8}
            >
              {coinLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Text style={s.adRowIcon}>📺</Text>
                  <View style={s.adRowMiddle}>
                    <Text style={s.adRowTitle}>Watch Ad → 99 Coins</Text>
                    <Text style={s.adRowSub}>Watch a short video to earn coins</Text>
                  </View>
                  <Text style={s.adRowReward}>🪙99</Text>
                </>
              )}
            </TouchableOpacity>
            {/* Buy hints with coins */}
            <Text style={s.sectionTitle}>Buy Hints with Coins</Text>
            {HINT_PLANS.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={[s.planRow, coins < plan.coins && s.planRowDisabled]}
                onPress={() => handleBuyHints(plan)}
                disabled={coins < plan.coins || buyLoading}
                activeOpacity={0.8}
              >
                <View style={s.planLeft}>
                  <Text style={s.planHints}>💡 {plan.hints} Hints</Text>
                  <Text style={s.planCost}>🪙 {plan.coins} Coins</Text>
                </View>
                <View style={[s.planBtn, coins < plan.coins && s.planBtnDisabled]}>
                  <Text style={s.planBtnText}>Buy</Text>
                </View>
              </TouchableOpacity>
            ))}            
          </ScrollView>

          {/* Toast */}
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
  const good = theme.good || '#34d399';
  const warn = theme.warn || '#fbbf24';
  const bad = theme.bad || '#f87171';
  return StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(10,18,26,0.88)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: theme.surface, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, borderWidth: 1.5, borderColor: theme.border,
    padding: 24, maxHeight: '85%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: theme.text },
  closeX: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceRaised,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.border,
  },
  closeXText: { color: theme.muted, fontSize: 13, fontWeight: '700' },
  balanceRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  balancePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.surfaceRaised, borderRadius: 14,
    borderWidth: 1.5, borderColor: theme.border, padding: 12,
  },
  balanceIcon: { fontSize: 20 },
  balanceVal: { fontSize: 20, fontWeight: '800', color: theme.text },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: theme.muted,
    letterSpacing: 1.5, marginBottom: 10, marginTop: 4, textTransform: 'uppercase',
  },
  planRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.surfaceRaised, borderRadius: 14,
    borderWidth: 1.5, borderColor: theme.border,
    padding: 14, marginBottom: 8,
  },
  planRowDisabled: { opacity: 0.45 },
  planLeft: {},
  planHints: { fontSize: 16, fontWeight: '700', color: theme.text },
  planCost: { fontSize: 12, color: theme.muted, marginTop: 2 },
  planBtn: {
    backgroundColor: theme.primary, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  planBtnDisabled: { backgroundColor: theme.border },
  planBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
  adRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(77,169,255,0.08)', borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(77,169,255,0.3)',
    padding: 14, marginBottom: 8, minHeight: 64,
    justifyContent: 'center',
  },
  adRowIcon: { fontSize: 22 },
  adRowMiddle: { flex: 1 },
  adRowTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
  adRowSub: { fontSize: 11, color: theme.muted, marginTop: 2 },
  adRowReward: { fontSize: 16, fontWeight: '800', color: warn },
  toast: {
    position: 'absolute', bottom: 24, left: 24, right: 24,
    backgroundColor: theme.surfaceRaised, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border,
    padding: 14, alignItems: 'center',
  },
  toastText: { color: theme.text, fontWeight: '600', fontSize: 14 },
  });
};