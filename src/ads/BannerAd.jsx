// src/ads/BannerAd.js
//
// Renders the correct banner component (Google AdMob or Meta Audience Network)
// based on the Remote Config `BannerBottom` strategy and provider ids.
//
// • Respects the global `is_adsShow` and `BannerAds` kill-switches.
// • Tries the primary provider first; if its id is missing it falls through to
//   the secondary automatically (Facebook banner uses a different component).
// • Returns null (renders nothing) when ads are disabled or no id is available.

import React from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdList } from './AdSelector';
import RemoteConfigService from '../services/RemoteConfigService';

import { NativeModules, TurboModuleRegistry } from 'react-native';

let FBBannerView = null;
try {
  const isFB =
    (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry.get && TurboModuleRegistry.get('CTKAdSettings')) ||
    (NativeModules && (NativeModules.CTKAdSettings || NativeModules.CTKInterstitialAdManager));
  if (isFB) {
    FBBannerView = require('react-native-fbads').BannerView;
  }
} catch (e) {}

let AppLovinAdView = null;
try {
  const isAL =
    (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry.get && TurboModuleRegistry.get('AppLovinMAX')) ||
    (NativeModules && NativeModules.AppLovinMAX);
  if (isAL) {
    AppLovinAdView = require('react-native-applovin-max').AdView;
  }
} catch (e) {}

export default function BannerAdComponent() {
  const [providerIndex, setProviderIndex] = React.useState(0);
  const config = RemoteConfigService.getAdsConfig();

  // ── Global kill-switches ─────────────────────────────────────────────────
  if (!config?.ads?.is_adsShow) return null;
  if (!config?.ads?.BannerAds) return null;

  // ── Resolve provider list ─────────────────────────────────────────────────
  const adList = getAdList('BannerBottom', config);
  if (!adList || adList.length === 0 || providerIndex >= adList.length) return null;

  const currentAd = adList[providerIndex];
  if (!currentAd || !currentAd.id) return null;

  const handleNextFallback = (providerName, err) => {
    console.warn(`[BannerAd] ${providerName} banner failed (trying fallback):`, err);
    setProviderIndex((prev) => prev + 1);
  };

  if (currentAd.provider === 'G') {
    return (
      <BannerAd
        unitId={currentAd.id}
        size={BannerAdSize.FULL_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(err) => handleNextFallback('Google', err)}
      />
    );
  }

  if (currentAd.provider === 'F' && FBBannerView) {
    return (
      <FBBannerView
        placementId={currentAd.id}
        type="standard"
        onLoad={() => console.log('[BannerAd] Facebook banner loaded.')}
        onError={(err) =>
          handleNextFallback(
            'Facebook',
            err?.nativeEvent?.errorMessage || err?.nativeEvent || err
          )
        }
      />
    );
  }

  if (currentAd.provider === 'L' && AppLovinAdView && !currentAd.id.includes('YOUR_APPLOVIN')) {
    return (
      <AppLovinAdView
        adUnitId={currentAd.id}
        adFormat={require('react-native-applovin-max').AdFormat.BANNER}
        onAdLoaded={() => console.log('[BannerAd] AppLovin banner loaded.')}
        onAdLoadFailed={(err) => handleNextFallback('AppLovin', err)}
      />
    );
  }

  return null;
}