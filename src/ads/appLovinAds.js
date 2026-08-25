import { NativeModules, TurboModuleRegistry } from 'react-native';

let AppLovinMAX = null;

try {
  const isAvailable =
    (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry.get && TurboModuleRegistry.get('AppLovinMAX')) ||
    (NativeModules && NativeModules.AppLovinMAX);

  if (isAvailable) {
    AppLovinMAX = require('react-native-applovin-max');
    console.log('[AppLovinAds] AppLovin MAX module detected & ready.');
  }
} catch (e) {
  console.warn('[AppLovinAds] Native module check warning:', e);
}

class AppLovinAds {
  showInterstitial(id) {
    console.log(`[AppLovinAds] Requesting AppLovin Interstitial ad (Ad Unit ID: ${id})…`);
    if (!AppLovinMAX || !id || id.includes('YOUR_APPLOVIN')) {
      console.warn('[AppLovinAds] Interstitial skipped — AppLovin MAX SDK uninitialized or test ID placeholder used.');
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      try {
        if (AppLovinMAX.isInterstitialReady(id)) {
          console.log(`[AppLovinAds] AppLovin Interstitial ready. Displaying ad unit "${id}"…`);
          AppLovinMAX.showInterstitial(id);
          resolve(true);
        } else {
          console.log(`[AppLovinAds] AppLovin Interstitial not ready yet. Preloading ad unit "${id}"…`);
          AppLovinMAX.loadInterstitial(id);
          resolve(false);
        }
      } catch (err) {
        console.warn(`[AppLovinAds] AppLovin Interstitial exception for ad unit "${id}":`, err);
        resolve(false);
      }
    });
  }

  showRewarded(id, onReward) {
    console.log(`[AppLovinAds] Requesting AppLovin Rewarded ad (Ad Unit ID: ${id})…`);
    if (!AppLovinMAX || !id || id.includes('YOUR_APPLOVIN')) {
      console.warn('[AppLovinAds] Rewarded skipped — AppLovin MAX SDK uninitialized or test ID placeholder used.');
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      try {
        if (AppLovinMAX.isRewardedAdReady(id)) {
          console.log(`[AppLovinAds] AppLovin Rewarded ready. Displaying ad unit "${id}"…`);
          AppLovinMAX.showRewardedAd(id);
          onReward && onReward();
          resolve(true);
        } else {
          console.log(`[AppLovinAds] AppLovin Rewarded not ready yet. Preloading ad unit "${id}"…`);
          AppLovinMAX.loadRewardedAd(id);
          resolve(false);
        }
      } catch (err) {
        console.warn(`[AppLovinAds] AppLovin Rewarded exception for ad unit "${id}":`, err);
        resolve(false);
      }
    });
  }

  showRewardedInterstitial(id, onReward) {
    return this.showRewarded(id, onReward);
  }

  showAppOpen(id) {
    console.log(`[AppLovinAds] Requesting AppLovin App Open ad (Ad Unit ID: ${id})…`);
    if (!AppLovinMAX || !id || id.includes('YOUR_APPLOVIN')) {
      console.warn('[AppLovinAds] App Open skipped — AppLovin MAX SDK uninitialized or test ID placeholder used.');
      return Promise.resolve(false);
    }
    return this.showInterstitial(id);
  }
}

export default new AppLovinAds();
