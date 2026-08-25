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
    // Values: e.g. "GFL" | "GLF" | "FLG" | "FGL" | "LFG" | "LGF" | "G" | "F" | "L"
    default: {
      inter: 'FGL',   // Interstitial
      interReward: 'FGL',   // Rewarded Interstitial
      rewarded: 'FGL',   // Rewarded
      open: 'FGL',   // App Open
      BannerBottom: 'FGL',   // Bottom Banner

      // ── Google (AdMob) IDs ──────────────────────────────────────────────────
      G: {
        I: 'ca-app-pub-6026271145988676/9504686665',  // Interstitial
        O: 'ca-app-pub-6026271145988676/2208650573',  // App Open
        R: 'ca-app-pub-6026271145988676/3186893589',  // Rewarded
        IR: 'ca-app-pub-6026271145988676/4392164049',  // Rewarded Interstitial
        BB: 'ca-app-pub-6026271145988676/5318029645',  // Banner
      },

      // ── Facebook (Meta Audience Network) IDs ───────────────────────────────
      F: {
        I: '1758887168477062_1758888465143599',  // Interstitial
        O: '1758887168477062_1758888465143599',  // Open Ad uses Interstitial Placement
        R: '1758887168477062_1758888458476933',  // Rewarded
        IR: '1758887168477062_1758888455143600',  // Rewarded Interstitial
        BB: '1758887168477062_1758888461810266',  // Banner
      },

      // ── AppLovin MAX Test IDs ───────────────────────────────────────────────
      L: {
        I: 'YOUR_APPLOVIN_INTERSTITIAL_AD_UNIT_ID',
        O: 'YOUR_APPLOVIN_APP_OPEN_AD_UNIT_ID',
        R: 'YOUR_APPLOVIN_REWARDED_AD_UNIT_ID',
        IR: 'YOUR_APPLOVIN_REWARDED_INTERSTITIAL_AD_UNIT_ID',
        BB: 'YOUR_APPLOVIN_BANNER_AD_UNIT_ID',
      },
    },
  },
};