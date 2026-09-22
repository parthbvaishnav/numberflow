// src/ads/AppOpenAdManager.js
//
// Handles App Open ads:
//   • On first app launch (call init() from your root component)
//   • When app returns from background (AppState change listener)
//
// Guards:
//   • is_adOpenShow Remote Config flag
//   • 4-hour persistent cooldown between successful shows (AsyncStorage)
//   • 15-minute backoff after failed attempts (prevents AdMob spam & preserves Match Rate)
//   • Minimum 15s in background required before triggering on foreground
//   • Won't show if another ad is already visible (relies on AdManager lock)

import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdManager from './AdManager';
import RemoteConfigService from '../services/RemoteConfigService';

const STORAGE_KEY_LAST_SHOWN = '@app_open_last_shown_time';
const STORAGE_KEY_LAST_ATTEMPT = '@app_open_last_attempt_time';

const SUCCESS_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const RETRY_BACKOFF_MS = 15 * 60 * 1000;        // 15 minutes
const MIN_BACKGROUND_TIME_MS = 15 * 1000;       // 15 seconds

class AppOpenAdManager {
  _lastShownAt = 0;
  _lastAttemptAt = 0;
  _backgroundEnteredAt = 0;
  _appStateSubscription = null;
  _initialized = false;
  _isAttempting = false;

  /**
   * Call once from your root component inside useEffect with empty deps.
   */
  async init() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      const [shownVal, attemptVal] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_LAST_SHOWN),
        AsyncStorage.getItem(STORAGE_KEY_LAST_ATTEMPT),
      ]);
      if (shownVal) this._lastShownAt = parseInt(shownVal, 10) || 0;
      if (attemptVal) this._lastAttemptAt = parseInt(attemptVal, 10) || 0;
    } catch (e) {
      console.warn('[AppOpenAdManager] Error reading timestamps from storage:', e);
    }

    // Show on cold launch if cooldown allows
    this._maybeShow('launch');

    // Listen for foreground returns
    this._appStateSubscription = AppState.addEventListener(
      'change',
      this._handleAppStateChange,
    );
  }

  destroy() {
    this._appStateSubscription?.remove();
    this._initialized = false;
  }

  _handleAppStateChange = (nextState) => {
    if (nextState === 'background' || nextState === 'inactive') {
      this._backgroundEnteredAt = Date.now();
    } else if (nextState === 'active') {
      if (this._backgroundEnteredAt > 0) {
        const timeInBackground = Date.now() - this._backgroundEnteredAt;
        if (timeInBackground < MIN_BACKGROUND_TIME_MS) {
          console.log(
            `[AppOpenAdManager] Background duration too short (${Math.round(timeInBackground / 1000)}s) — skipping.`,
          );
          return;
        }
      }
      this._maybeShow('foreground');
    }
  };

  async _maybeShow(trigger) {
    if (this._isAttempting) return;

    const config = RemoteConfigService.getAdsConfig();
    if (!config?.ads?.is_adOpenShow) {
      console.log(`[AppOpenAdManager] App open ads disabled (${trigger}).`);
      return;
    }

    const now = Date.now();

    // 1. Success Cooldown (4 hours)
    if (now - this._lastShownAt < SUCCESS_COOLDOWN_MS) {
      const minLeft = Math.ceil((SUCCESS_COOLDOWN_MS - (now - this._lastShownAt)) / 60000);
      console.log(
        `[AppOpenAdManager] Cooldown active — ${minLeft}m remaining (${trigger}).`,
      );
      return;
    }

    // 2. Failure Backoff (15 mins) to prevent AdMob spamming
    if (now - this._lastAttemptAt < RETRY_BACKOFF_MS) {
      const minLeft = Math.ceil((RETRY_BACKOFF_MS - (now - this._lastAttemptAt)) / 60000);
      console.log(
        `[AppOpenAdManager] Retry backoff active — ${minLeft}m remaining (${trigger}).`,
      );
      return;
    }

    this._isAttempting = true;
    this._lastAttemptAt = now;
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LAST_ATTEMPT, String(now));
    } catch (e) {}

    console.log(`[AppOpenAdManager] Showing app open ad (${trigger})…`);
    const shown = await AdManager.showAd('open');

    if (shown) {
      this._lastShownAt = Date.now();
      try {
        await AsyncStorage.setItem(STORAGE_KEY_LAST_SHOWN, String(this._lastShownAt));
      } catch (e) {}
    }

    this._isAttempting = false;
  }
}

export default new AppOpenAdManager();