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

export default function BannerAdComponent() {
  const config = RemoteConfigService.getAdsConfig();

  // ── Global kill-switches ─────────────────────────────────────────────────
  if (!config?.ads?.is_adsShow) return null;
  if (!config?.ads?.BannerAds) return null;

  // ── Resolve provider list ─────────────────────────────────────────────────
  const adList = getAdList('BannerBottom', config);
  if (!adList || adList.length === 0) return null;

  // ── Render first available provider ───────────────────────────────────────
  for (const ad of adList) {
    if (!ad.id) continue;

    if (ad.provider === 'G') {
      return (
        <BannerAd
          unitId={ad.id}
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(err) => {
            console.warn('[BannerAd] Google banner failed:', err);
          }}
        />
      );
    }

    // if (ad.provider === 'F') {
    //   return (
    //     <BannerView
    //       placementId={ad.id}
    //       type="standard"
    //       onLoad={() => console.log('[BannerAd] Facebook banner loaded.')}
    //       onError={(err) => console.warn('[BannerAd] Facebook banner failed:', err)}
    //     />
    //   );
    // }
  }

  return null;
}