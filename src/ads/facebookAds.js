import { NativeModules, TurboModuleRegistry } from 'react-native';

let InterstitialAdManager = null;
let RewardedVideoAdManager = null;
let AdSettings = null;

try {
  const isAvailable =
    (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry.get && (TurboModuleRegistry.get('CTKInterstitialAdManager') || TurboModuleRegistry.get('CTKAdSettings'))) ||
    (NativeModules && (NativeModules.CTKInterstitialAdManager || NativeModules.CTKAdSettings));

  if (isAvailable) {
    const FBAds = require('react-native-fbads');
    if (FBAds && FBAds.InterstitialAdManager && NativeModules.CTKInterstitialAdManager) {
      InterstitialAdManager = FBAds.InterstitialAdManager;
    }
    if (FBAds && FBAds.RewardedVideoAdManager && NativeModules.CTKRewardedVideoAdManager) {
      RewardedVideoAdManager = FBAds.RewardedVideoAdManager;
    }
    if (FBAds && FBAds.AdSettings) {
      AdSettings = FBAds.AdSettings;
      // Auto-register current test device hash in development mode
      try {
        if (AdSettings.currentDeviceHash) {
          AdSettings.addTestDevice(AdSettings.currentDeviceHash);
          console.log(`[FacebookAds] Meta Test Device registered hash: ${AdSettings.currentDeviceHash}`);
        }
      } catch (e) {}
    }
  }
} catch (e) {
  console.warn('[FacebookAds] Native module check warning:', e);
}

class FacebookAds {
  // ─── INTERSTITIAL ──────────────────────────────────────────────────────────

  showInterstitial(id) {
    console.log(`[FacebookAds] Requesting Meta Interstitial ad (Placement ID: ${id})…`);
    if (!InterstitialAdManager || !NativeModules.CTKInterstitialAdManager || !id) {
      console.warn('[FacebookAds] Interstitial skipped — FB Native Module unavailable or missing Placement ID.');
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      try {
        InterstitialAdManager.showAd(id)
          .then(() => {
            console.log(`[FacebookAds] Meta Interstitial showed successfully for placement "${id}".`);
            resolve(true);
          })
          .catch((err) => {
            console.warn(
              `[FacebookAds] Meta Interstitial failed for placement "${id}":`,
              err?.message || err
            );
            console.warn(
              '[FacebookAds] Note: Meta returns "No fill" if test device hash is not registered in Meta Monetization Manager or if app is pending review.'
            );
            resolve(false);
          });
      } catch (err) {
        console.warn(`[FacebookAds] Interstitial exception for placement "${id}":`, err);
        resolve(false);
      }
    });
  }

  // ─── REWARDED ──────────────────────────────────────────────────────────────

  showRewarded(id, onReward) {
    console.log(`[FacebookAds] Requesting Meta Rewarded video ad (Placement ID: ${id})…`);
    if (RewardedVideoAdManager && NativeModules.CTKRewardedVideoAdManager && id) {
      return new Promise((resolve) => {
        try {
          RewardedVideoAdManager.showAd(id)
            .then((didReward) => {
              if (didReward) {
                console.log(`[FacebookAds] Meta Rewarded completed & reward earned for placement "${id}".`);
                onReward && onReward();
                resolve(true);
              } else {
                console.log(`[FacebookAds] Meta Rewarded closed early by user without reward for placement "${id}".`);
                resolve(false);
              }
            })
            .catch((err) => {
              console.warn(`[FacebookAds] Meta Rewarded failed for placement "${id}":`, err?.message || err);
              resolve(false);
            });
        } catch (err) {
          console.warn(`[FacebookAds] Rewarded exception for placement "${id}":`, err);
          resolve(false);
        }
      });
    }

    // Fallback: If react-native-fbads has no Native Rewarded module, try Interstitial module with Placement ID
    if (InterstitialAdManager && NativeModules.CTKInterstitialAdManager && id) {
      console.log(`[FacebookAds] Serving Meta Interstitial for Rewarded fallback (Placement ID: ${id})…`);
      return this.showInterstitial(id).then((success) => {
        if (success) {
          onReward && onReward();
          return true;
        }
        return false;
      });
    }

    console.warn('[FacebookAds] Rewarded skipped — FB Native Module unavailable or missing Placement ID.');
    return Promise.resolve(false);
  }

  // ─── REWARDED INTERSTITIAL ─────────────────────────────────────────────────

  showRewardedInterstitial(id, onReward) {
    return this.showRewarded(id, onReward);
  }

  // ─── APP OPEN ──────────────────────────────────────────────────────────────
  // Meta Audience Network doesn't have an App Open format natively.
  // Fallback to Interstitial Ad Placement ID as requested.

  showAppOpen(id) {
    console.log(`[FacebookAds] Serving Meta Interstitial for App Open request (Placement ID: ${id})...`);
    return this.showInterstitial(id);
  }
}

export default new FacebookAds();