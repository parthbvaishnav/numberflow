// src/services/defaultAdsConfig.js
//
// Fallback config used when Firebase Remote Config is unavailable.
// All Google IDs below are AdMob TEST IDs — safe to use during development.
// Replace with your production IDs in the Remote Config dashboard.

export const DEFAULT_ADS_CONFIG = {
  ads: {
    // ── Global kill-switches ──────────────────────────────────────────────────
    is_adsShow: true,       // master switch — false disables ALL ads
    is_adOpenShow: true,    // controls App Open ads specifically
    BannerAds: true,        // controls banner ads specifically

    // ── Per-type strategy ─────────────────────────────────────────────────────
    // Values: "" | "G" | "F" | "GF" | "FG"
    default: {
      inter:        'G',   // Interstitial       → Google first, Facebook fallback
      interReward:  'G',   // Rewarded Interstitial
      rewarded:     'G',   // Rewarded
      open:         'G',    // App Open           → Google only (Facebook unsupported)
      BannerBottom: 'G',   // Bottom Banner

      // ── Google (AdMob) test IDs ─────────────────────────────────────────────
      G: {
        I:  'ca-app-pub-6026271145988676/9504686665',  // Interstitial
        O:  'ca-app-pub-6026271145988676/2208650573',  // App Open
        R:  'ca-app-pub-6026271145988676/3186893589',  // Rewarded
        IR: 'ca-app-pub-6026271145988676/4392164049',  // Rewarded Interstitial
        BB: 'ca-app-pub-6026271145988676/5318029645',  // Banner
      },

      // ── Facebook (Meta Audience Network) test placement IDs ────────────────
      // Replace with your real Placement IDs from the Meta dashboard.
      F: {
        I:  'IMG_16_9_LINK#YOUR_PLACEMENT_ID',
        O:  'IMG_16_9_LINK#YOUR_PLACEMENT_ID',         // not used (unsupported)
        R:  'VID_HD_9_16_39S_APP_INSTALL#YOUR_PLACEMENT_ID',
        IR: 'VID_HD_9_16_39S_APP_INSTALL#YOUR_PLACEMENT_ID',
        BB: 'VID_HD_9_16_39S_APP_INSTALL#YOUR_PLACEMENT_ID',
      },
    },
  },
};