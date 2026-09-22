// src/ads/AdManager.js
//
// Central ad dispatcher.  Callers request an ad by type; AdManager resolves
// the ordered provider list via AdSelector and tries each provider in order
// until one succeeds (fallback logic).
//
// Usage examples:
//   // Interstitial (no reward callback needed)
//   await AdManager.showAd('inter');
//
//   // Rewarded — onReward fires only when the user actually earns the reward
//   await AdManager.showAd('rewarded', () => addHints(2));
//
//   // Rewarded Interstitial (skip button)
//   await AdManager.showAd('interReward', () => goNextLevel());
//
//   // App Open
//   await AdManager.showAd('open');
//
// Returns: true if an ad was successfully shown, false otherwise.

import { getAdList } from './AdSelector';
import GoogleAds from './googleAds';
import FacebookAds from './facebookAds';
import AppLovinAds from './appLovinAds';
import RemoteConfigService from '../services/RemoteConfigService';
import ConsentManager from '../services/ConsentManager';
import NetInfo from '@react-native-community/netinfo';

// Prevent overlapping ad requests
let _isShowing = false;

class AdManager {
  /**
   * Show an ad of the given type, trying providers in priority order.
   *
   * @param {'inter'|'interReward'|'rewarded'|'open'} type
   * @param {(() => void) | undefined} onReward  — called when reward is earned
   * @returns {Promise<boolean>}
   */
  async showAd(type, onReward) {
    if (_isShowing) {
      console.log('[AdManager] Ad already showing — skipping request.');
      return false;
    }

    // Safety & COPPA Check
    if (ConsentManager.isChild()) {
      console.log('[AdManager] Child user detected (COPPA) — enforcing non-personalized ad mode.');
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('[AdManager] No internet connection — skipping ad request.');
      return false;
    }

    const config = RemoteConfigService.getAdsConfig();
    const adList = getAdList(type, config);

    if (!adList || adList.length === 0) {
      console.log(`[AdManager] No ad configured for type "${type}".`);
      return false;
    }

    _isShowing = true;
    let shown = false;

    for (const ad of adList) {
      if (!ad.id) continue;

      console.log(`[AdManager] Trying ${ad.provider} for "${type}" (id: ${ad.id})`);

      try {
        shown = await this._dispatch(ad.provider, type, ad.id, onReward);
      } catch (err) {
        console.warn(`[AdManager] ${ad.provider} threw:`, err);
        shown = false;
      }

      if (shown) {
        console.log(`[AdManager] ${ad.provider} showed "${type}" successfully.`);
        try {
          const { incrementMissionProgress } = require('../utils/ProfileManager');
          incrementMissionProgress('ads', 1);
        } catch (e) {
          console.warn('[AdManager] failed to increment ad progress:', e);
        }
        break;
      } else {
        console.log(`[AdManager] ${ad.provider} failed for "${type}" — trying fallback…`);
      }
    }

    _isShowing = false;
    return shown;
  }

  /**
   * Intent-based preloading for Google + Meta mediated ads.
   * Call when user enters a screen with high ad intent (Shop, Spin Wheel, Level Complete).
   *
   * @param {'inter'|'rewarded'|'open'} type
   */
  preloadAd(type) {
    const config = RemoteConfigService.getAdsConfig();
    const adList = getAdList(type, config);
    if (!adList || adList.length === 0) return;
    const primary = adList[0];
    if (primary && primary.provider === 'G' && primary.id) {
      if (type === 'inter') GoogleAds.preloadInterstitial(primary.id);
      if (type === 'rewarded') GoogleAds.preloadRewarded(primary.id);
      if (type === 'open') GoogleAds.preloadAppOpen(primary.id);
    }
  }

  // ─── Internal dispatcher ──────────────────────────────────────────────────

  _dispatch(provider, type, id, onReward) {
    if (provider === 'G') return this._google(type, id, onReward);
    if (provider === 'F') return this._facebook(type, id, onReward);
    if (provider === 'L') return this._applovin(type, id, onReward);
    console.warn(`[AdManager] Unknown provider "${provider}"`);
    return Promise.resolve(false);
  }

  _google(type, id, onReward) {
    switch (type) {
      case 'inter':
        return GoogleAds.showInterstitial(id);
      case 'interReward':
        return GoogleAds.showRewardedInterstitial(id, onReward);
      case 'rewarded':
        return GoogleAds.showRewarded(id, onReward);
      case 'open':
        return GoogleAds.showAppOpen(id);
      default:
        console.warn(`[AdManager] Google has no handler for type "${type}"`);
        return Promise.resolve(false);
    }
  }

  _facebook(type, id, onReward) {
    switch (type) {
      case 'inter':
        return FacebookAds.showInterstitial(id);
      case 'interReward':
        return FacebookAds.showRewardedInterstitial(id, onReward);
      case 'rewarded':
        return FacebookAds.showRewarded(id, onReward);
      case 'open':
        return FacebookAds.showAppOpen(id);
      default:
        console.warn(`[AdManager] Facebook has no handler for type "${type}"`);
        return Promise.resolve(false);
    }
  }

  _applovin(type, id, onReward) {
    switch (type) {
      case 'inter':
        return AppLovinAds.showInterstitial(id);
      case 'interReward':
        return AppLovinAds.showRewardedInterstitial(id, onReward);
      case 'rewarded':
        return AppLovinAds.showRewarded(id, onReward);
      case 'open':
        return AppLovinAds.showAppOpen(id);
      default:
        console.warn(`[AdManager] AppLovin has no handler for type "${type}"`);
        return Promise.resolve(false);
    }
  }
}

export default new AdManager();