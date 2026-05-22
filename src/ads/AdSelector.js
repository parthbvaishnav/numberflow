// src/ads/AdSelector.js
//
// Converts the Remote Config strategy string for a given ad type into an
// ordered array of { provider, id } objects that AdManager iterates through
// with fallback.
//
// Strategy values:
//   ""   → no ad
//   "G"  → Google only
//   "F"  → Facebook only
//   "GF" → Google first, Facebook fallback
//   "FG" → Facebook first, Google fallback
//
// Ad-type → provider key mapping:
//   inter        → I   (Interstitial)
//   interReward  → IR  (Rewarded Interstitial)
//   rewarded     → R   (Rewarded)
//   open         → O   (App Open)
//   BannerBottom → BB  (Banner)

const TYPE_TO_KEY = {
  inter: 'I',
  interReward: 'IR',
  rewarded: 'R',
  open: 'O',
  BannerBottom: 'BB',
};

/**
 * Returns an ordered list of { provider, id } to try, or null if ads are
 * disabled globally or no strategy is set.
 *
 * @param {'inter'|'interReward'|'rewarded'|'open'|'BannerBottom'} type
 * @param {object} config  — the full adsConfig object from RemoteConfigService
 * @returns {{ provider: 'G'|'F', id: string }[] | null}
 */
export function getAdList(type, config) {
  // Global kill-switch
  if (!config?.ads?.is_adsShow) return null;

  const defaultCfg = config?.ads?.default;
  if (!defaultCfg) return null;

  const strategy = defaultCfg[type]; // e.g. "GF", "F", ""
  if (!strategy) return null;        // empty string → disabled

  const adKey = TYPE_TO_KEY[type];
  if (!adKey) return null;

  const makeEntry = (provider) => ({
    provider,
    id: defaultCfg[provider]?.[adKey] ?? null,
  });

  // Single-provider strategies
  if (strategy === 'G') return [makeEntry('G')].filter((e) => e.id);
  if (strategy === 'F') return [makeEntry('F')].filter((e) => e.id);

  // Dual-provider strategies — order matters for fallback
  if (strategy === 'GF') {
    return [makeEntry('G'), makeEntry('F')].filter((e) => e.id);
  }
  if (strategy === 'FG') {
    return [makeEntry('F'), makeEntry('G')].filter((e) => e.id);
  }

  console.warn(`[AdSelector] Unknown strategy "${strategy}" for type "${type}"`);
  return null;
}

/**
 * Convenience helper — returns true if this ad type is configured to show
 * at all, without resolving the full provider list.
 */
export function isAdEnabled(type, config) {
  if (!config?.ads?.is_adsShow) return false;
  const strategy = config?.ads?.default?.[type];
  return typeof strategy === 'string' && strategy.length > 0;
}