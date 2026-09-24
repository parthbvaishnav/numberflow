// src/ads/BannerAd.jsx
//
// Renders the Google AdMob Adaptive Banner component
// (with Meta Audience Network mediation automatically handled by AdMob).
//
// • Respects the global `is_adsShow` and `BannerAds` kill-switches.
// • Returns null (renders nothing) when ads are disabled or no ID is available.

import React from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdList } from './AdSelector';
import RemoteConfigService from '../services/RemoteConfigService';
import ConsentManager from '../services/ConsentManager';

export default function BannerAdComponent() {
  const config = RemoteConfigService.getAdsConfig();

  // ── Global kill-switches ─────────────────────────────────────────────────
  if (!config?.ads?.is_adsShow) return null;
  if (!config?.ads?.BannerAds) return null;

  // ── Resolve provider list ─────────────────────────────────────────────────
  const adList = getAdList('BannerBottom', config);
  if (!adList || adList.length === 0) return null;

  const currentAd = adList[0];
  if (!currentAd || !currentAd.id) return null;

  const consentOpts = ConsentManager.getAdRequestOptions();

  return (
    <BannerAd
      unitId={currentAd.id}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        ...consentOpts,
      }}
      onAdLoaded={() => console.log('[BannerAd] ✅ Google (+ Meta mediation) banner loaded.')}
      onAdFailedToLoad={(err) => console.warn('[BannerAd] ❌ Banner failed to load:', err)}
    />
  );
}