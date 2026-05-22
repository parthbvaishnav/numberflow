// src/ads/AppOpenAdManager.js
//
// Handles App Open ads:
//   • On first app launch (call init() from your root component)
//   • When app returns from background (AppState change listener)
//
// Guards:
//   • is_adOpenShow Remote Config flag
//   • 4-hour cooldown between shows so users aren't bombarded
//   • Won't show if another ad is already visible (relies on AdManager lock)

import { AppState } from 'react-native';
import AdManager from './AdManager';
import RemoteConfigService from '../services/RemoteConfigService';

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

class AppOpenAdManager {
  _lastShownAt = 0;
  _appStateSubscription = null;
  _initialized = false;

  /**
   * Call once from your root component (e.g. App.js or AppNavigator) inside
   * a useEffect with an empty deps array.
   */
  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Show on cold launch
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
    if (nextState === 'active') {
      this._maybeShow('foreground');
    }
  };

  async _maybeShow(trigger) {
    const config = RemoteConfigService.getAdsConfig();

    if (!config?.ads?.is_adOpenShow) {
      console.log(`[AppOpenAdManager] App open ads disabled (${trigger}).`);
      return;
    }

    const now = Date.now();
    if (now - this._lastShownAt < COOLDOWN_MS) {
      const secLeft = Math.ceil((COOLDOWN_MS - (now - this._lastShownAt)) / 1000);
      console.log(
        `[AppOpenAdManager] Cooldown active — ${secLeft}s remaining (${trigger}).`,
      );
      return;
    }

    console.log(`[AppOpenAdManager] Showing app open ad (${trigger})…`);
    const shown = await AdManager.showAd('open');
    if (shown) {
      this._lastShownAt = Date.now();
    }
  }
}

export default new AppOpenAdManager();