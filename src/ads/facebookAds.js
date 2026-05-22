// src/ads/facebookAds.js
//
// Wraps react-native-fbads (Meta Audience Network).
// Each show method resolves to true (shown + rewarded where applicable) or false.
// Note: react-native-fbads does not have a native RewardedInterstitial — we fall
// back to a standard Rewarded Video for that slot.

import {
  InterstitialAdManager,
  RewardedVideoAdManager,
} from 'react-native-fbads';

class FacebookAds {
  // ─── INTERSTITIAL ──────────────────────────────────────────────────────────

  showInterstitial(id) {
    return new Promise((resolve) => {
      InterstitialAdManager.showAd(id)
        .then(() => resolve(true))
        .catch((err) => {
          console.warn('[FacebookAds] Interstitial error:', err);
          resolve(false);
        });
    });
  }

  // ─── REWARDED ──────────────────────────────────────────────────────────────

  showRewarded(id, onReward) {
    return new Promise((resolve) => {
      RewardedVideoAdManager.showAd(id)
        .then((didReward) => {
          if (didReward) {
            onReward && onReward();
            resolve(true);
          } else {
            // Ad was shown but skipped — no reward
            resolve(false);
          }
        })
        .catch((err) => {
          console.warn('[FacebookAds] Rewarded error:', err);
          resolve(false);
        });
    });
  }

  // ─── REWARDED INTERSTITIAL ─────────────────────────────────────────────────
  // Facebook doesn't have a native RewardedInterstitial format; we use
  // Rewarded Video as the closest equivalent.

  showRewardedInterstitial(id, onReward) {
    return this.showRewarded(id, onReward);
  }

  // ─── APP OPEN ──────────────────────────────────────────────────────────────
  // Facebook has no App Open format — returns false so AdManager falls back
  // to the next provider automatically.

  showAppOpen(_id) {
    console.warn('[FacebookAds] App Open not supported by Meta Audience Network.');
    return Promise.resolve(false);
  }
}

export default new FacebookAds();