// src/ads/googleAds.js

import {
  InterstitialAd,
  RewardedAd,
  RewardedInterstitialAd,
  AppOpenAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import ConsentManager from '../services/ConsentManager';

// Dynamic request config for all ads based on COPPA & User Consent choices
const getRequestOptions = () => ConsentManager.getAdRequestOptions();

// AdMob ads expire after 60 minutes. We check at 50 min to guarantee freshness.
const AD_EXPIRY_MS = 50 * 60 * 1000;

class GoogleAds {
  // ── Interstitial State ──
  _interAd = null;
  _interLoadedAt = 0;
  _isInterLoading = false;
  _interUnsubs = [];

  // ── Rewarded State ──
  _rewardedAd = null;
  _rewardedLoadedAt = 0;
  _isRewardedLoading = false;
  _rewardedUnsubs = [];

  // ── App Open State ──
  _appOpenAd = null;
  _appOpenLoadedAt = 0;
  _isAppOpenLoading = false;
  _appOpenUnsubs = [];

  // ───────────────── EXPIRY & TEARDOWN HELPERS ─────────────────

  _teardownInter() {
    this._interUnsubs.forEach((u) => { try { u(); } catch (e) {} });
    this._interUnsubs = [];
    this._interAd = null;
    this._interLoadedAt = 0;
    this._isInterLoading = false;
  }

  _isInterValid() {
    if (!this._interAd || !this._interAd.loaded) return false;
    if (this._interLoadedAt > 0 && Date.now() - this._interLoadedAt > AD_EXPIRY_MS) {
      console.log('[GoogleAds] Preloaded interstitial expired after 50m — tearing down.');
      this._teardownInter();
      return false;
    }
    return true;
  }

  _teardownRewarded() {
    this._rewardedUnsubs.forEach((u) => { try { u(); } catch (e) {} });
    this._rewardedUnsubs = [];
    this._rewardedAd = null;
    this._rewardedLoadedAt = 0;
    this._isRewardedLoading = false;
  }

  _isRewardedValid() {
    if (!this._rewardedAd || !this._rewardedAd.loaded) return false;
    if (this._rewardedLoadedAt > 0 && Date.now() - this._rewardedLoadedAt > AD_EXPIRY_MS) {
      console.log('[GoogleAds] Preloaded rewarded ad expired after 50m — tearing down.');
      this._teardownRewarded();
      return false;
    }
    return true;
  }

  _teardownAppOpen() {
    this._appOpenUnsubs.forEach((u) => { try { u(); } catch (e) {} });
    this._appOpenUnsubs = [];
    this._appOpenAd = null;
    this._appOpenLoadedAt = 0;
    this._isAppOpenLoading = false;
  }

  _isAppOpenValid() {
    if (!this._appOpenAd || !this._appOpenAd.loaded) return false;
    if (this._appOpenLoadedAt > 0 && Date.now() - this._appOpenLoadedAt > AD_EXPIRY_MS) {
      console.log('[GoogleAds] Preloaded app open expired after 50m — tearing down.');
      this._teardownAppOpen();
      return false;
    }
    return true;
  }

  // ───────────────── INTERSTITIAL ─────────────────

  preloadInterstitial(id) {
    if (!id || this._isInterValid() || this._isInterLoading) return;
    this._teardownInter();
    this._isInterLoading = true;

    try {
      const ad = InterstitialAd.createForAdRequest(id, getRequestOptions());
      this._interAd = ad;

      const uLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
        this._isInterLoading = false;
        this._interLoadedAt = Date.now();
        console.log('[GoogleAds] Interstitial (Google + Meta) preloaded & ready.');
      });

      const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.warn('[GoogleAds] Preload interstitial error:', err);
        this._teardownInter();
      });

      this._interUnsubs = [uLoad, uErr];
      ad.load();
    } catch (e) {
      this._teardownInter();
    }
  }

  showInterstitial(id) {
    return new Promise((resolve) => {
      // 1. If valid preloaded ad exists, show instantly!
      if (this._isInterValid()) {
        const ad = this._interAd;
        let closed = false;

        const uClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          if (!closed) {
            closed = true;
            this._teardownInter();
            resolve(true);
            // 🚨 Golden Rule: DO NOT immediately reload on CLOSED!
          }
        });

        const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
          console.warn('[GoogleAds] Error showing preloaded interstitial:', err);
          this._teardownInter();
          resolve(false);
        });

        this._interUnsubs.push(uClosed, uErr);
        ad.show().catch((err) => {
          console.warn('[GoogleAds] Failed to show preloaded interstitial:', err);
          this._teardownInter();
          resolve(false);
        });
        return;
      }

      // 2. On-demand load fallback if not preloaded
      this._teardownInter();
      this._isInterLoading = true;
      const ad = InterstitialAd.createForAdRequest(id, getRequestOptions());
      this._interAd = ad;

      let hasTimedOut = false;
      const timer = setTimeout(() => {
        hasTimedOut = true;
        this._teardownInter();
        resolve(false);
      }, 12000);

      const uLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        if (hasTimedOut) return;
        clearTimeout(timer);
        this._isInterLoading = false;
        this._interLoadedAt = Date.now();
        ad.show().catch(() => {
          this._teardownInter();
          resolve(false);
        });
      });

      const uClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        clearTimeout(timer);
        this._teardownInter();
        resolve(true);
      });

      const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        clearTimeout(timer);
        console.warn('[GoogleAds] Interstitial on-demand error:', err);
        this._teardownInter();
        resolve(false);
      });

      this._interUnsubs = [uLoaded, uClosed, uErr];
      ad.load();
    });
  }

  // ───────────────── REWARDED ─────────────────

  preloadRewarded(id) {
    if (!id || this._isRewardedValid() || this._isRewardedLoading) return;
    this._teardownRewarded();
    this._isRewardedLoading = true;

    try {
      const ad = RewardedAd.createForAdRequest(id, getRequestOptions());
      this._rewardedAd = ad;

      const uLoad = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this._isRewardedLoading = false;
        this._rewardedLoadedAt = Date.now();
        console.log('[GoogleAds] Rewarded ad (Google + Meta) preloaded & ready.');
      });

      const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.warn('[GoogleAds] Preload rewarded error:', err);
        this._teardownRewarded();
      });

      this._rewardedUnsubs = [uLoad, uErr];
      ad.load();
    } catch (e) {
      this._teardownRewarded();
    }
  }

  showRewarded(id, onReward) {
    return new Promise((resolve) => {
      let rewarded = false;

      // 1. If valid preloaded rewarded ad exists, show instantly!
      if (this._isRewardedValid()) {
        const ad = this._rewardedAd;
        let closed = false;

        const uReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          rewarded = true;
          onReward?.();
        });

        const uClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          if (!closed) {
            closed = true;
            uReward();
            this._teardownRewarded();
            resolve(rewarded);
            // 🚨 Golden Rule: DO NOT immediately reload on CLOSED!
          }
        });

        const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
          console.warn('[GoogleAds] Error showing preloaded rewarded:', err);
          uReward();
          this._teardownRewarded();
          resolve(false);
        });

        this._rewardedUnsubs.push(uReward, uClosed, uErr);
        ad.show().catch((err) => {
          console.warn('[GoogleAds] Failed to show preloaded rewarded:', err);
          uReward();
          this._teardownRewarded();
          resolve(false);
        });
        return;
      }

      // 2. On-demand load fallback
      this._teardownRewarded();
      this._isRewardedLoading = true;
      const ad = RewardedAd.createForAdRequest(id, getRequestOptions());
      this._rewardedAd = ad;

      let hasTimedOut = false;
      const timer = setTimeout(() => {
        hasTimedOut = true;
        this._teardownRewarded();
        resolve(false);
      }, 14000);

      const uReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewarded = true;
        onReward?.();
      });

      const uLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (hasTimedOut) return;
        clearTimeout(timer);
        this._isRewardedLoading = false;
        this._rewardedLoadedAt = Date.now();
        ad.show().catch(() => {
          this._teardownRewarded();
          resolve(false);
        });
      });

      const uClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        clearTimeout(timer);
        uReward();
        this._teardownRewarded();
        resolve(rewarded);
      });

      const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        clearTimeout(timer);
        console.warn('[GoogleAds] Rewarded on-demand error:', err);
        uReward();
        this._teardownRewarded();
        resolve(false);
      });

      this._rewardedUnsubs = [uReward, uLoaded, uClosed, uErr];
      ad.load();
    });
  }

  // ───────────────── REWARDED INTERSTITIAL ─────────────────

  showRewardedInterstitial(id, onReward) {
    return new Promise((resolve) => {
      const ad = RewardedInterstitialAd.createForAdRequest(id, getRequestOptions());
      let rewarded = false;

      const unsubReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewarded = true;
        onReward?.();
      });

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        ad.show().catch(() => {
          cleanup();
          resolve(false);
        });
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        resolve(rewarded);
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.warn('[GoogleAds] RewardedInterstitial error:', err);
        cleanup();
        resolve(false);
      });

      function cleanup() {
        unsubReward();
        unsubLoaded();
        unsubClosed();
        unsubError();
      }

      ad.load();
    });
  }

  // ───────────────── APP OPEN ─────────────────

  preloadAppOpen(id) {
    if (!id || this._isAppOpenValid() || this._isAppOpenLoading) return;
    this._teardownAppOpen();
    this._isAppOpenLoading = true;

    try {
      const ad = AppOpenAd.createForAdRequest(id, getRequestOptions());
      this._appOpenAd = ad;

      const uLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
        this._isAppOpenLoading = false;
        this._appOpenLoadedAt = Date.now();
        console.log('[GoogleAds] App Open (Google + Meta) preloaded & ready.');
      });

      const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.warn('[GoogleAds] Preload App Open error:', err);
        this._teardownAppOpen();
      });

      this._appOpenUnsubs = [uLoad, uErr];
      ad.load();
    } catch (e) {
      this._teardownAppOpen();
    }
  }

  showAppOpen(id) {
    return new Promise((resolve) => {
      // 1. If valid preloaded app open exists, show instantly!
      if (this._isAppOpenValid()) {
        const ad = this._appOpenAd;
        let closed = false;

        const uClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          if (!closed) {
            closed = true;
            this._teardownAppOpen();
            resolve(true);
            // 🚨 DO NOT immediately reload on CLOSED!
          }
        });

        const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
          console.warn('[GoogleAds] Error showing preloaded app open:', err);
          this._teardownAppOpen();
          resolve(false);
        });

        this._appOpenUnsubs.push(uClosed, uErr);
        ad.show().catch((err) => {
          console.warn('[GoogleAds] Failed to show preloaded app open:', err);
          this._teardownAppOpen();
          resolve(false);
        });
        return;
      }

      // 2. On-demand load fallback
      this._teardownAppOpen();
      this._isAppOpenLoading = true;
      const ad = AppOpenAd.createForAdRequest(id, getRequestOptions());
      this._appOpenAd = ad;

      let hasTimedOut = false;
      const timer = setTimeout(() => {
        hasTimedOut = true;
        this._teardownAppOpen();
        resolve(false);
      }, 9000);

      const uLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
        if (hasTimedOut) return;
        clearTimeout(timer);
        this._isAppOpenLoading = false;
        this._appOpenLoadedAt = Date.now();
        ad.show().catch(() => {
          this._teardownAppOpen();
          resolve(false);
        });
      });

      const uClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        clearTimeout(timer);
        this._teardownAppOpen();
        resolve(true);
      });

      const uErr = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        clearTimeout(timer);
        console.warn('[GoogleAds] AppOpen on-demand error:', err);
        this._teardownAppOpen();
        resolve(false);
      });

      this._appOpenUnsubs = [uLoaded, uClosed, uErr];
      ad.load();
    });
  }
}

export default new GoogleAds();