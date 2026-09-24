// src/services/defaultAdsConfig.js
//
// Fallback config used when Firebase Remote Config is unavailable.
// All Google IDs below are production IDs.
//
// ✅ Version is imported from src/constants/appVersion.js
// Sirf appVersion.js me update karo — yahan automatically reflect ho jayega.

import { APP_VERSION, MIN_SUPPORTED_VERSION } from '../constants/appVersion';

export const DEFAULT_ADS_CONFIG = {
  ads: {
    // ── Global kill-switches ──────────────────────────────────────────────────
    is_adsShow: true,       // master switch — false disables ALL ads
    is_adOpenShow: true,    // controls App Open ads specifically
    BannerAds: true,        // controls banner ads specifically

    // ── Per-type strategy ─────────────────────────────────────────────────────
    // Values: e.g. "GFL" | "GLF" | "FLG" | "FGL" | "LFG" | "LGF" | "G" | "F" | "L"
    default: {
      inter: 'G',   // Interstitial (AdMob Mediation with Meta Bidding)
      interReward: 'G',   // Rewarded Interstitial
      rewarded: 'G',   // Rewarded
      open: 'G',   // App Open
      BannerBottom: 'G',   // Bottom Banner

      // ── Google (AdMob) IDs (Meta Audience Network mediated via AdMob) ─────
      G: {
        I: 'ca-app-pub-6026271145988676/9504686665',  // Interstitial
        O: 'ca-app-pub-6026271145988676/2208650573',  // App Open
        R: 'ca-app-pub-6026271145988676/3186893589',  // Rewarded
        IR: 'ca-app-pub-6026271145988676/4392164049',  // Rewarded Interstitial
        BB: 'ca-app-pub-6026271145988676/5318029645',  // Banner
      },
    },
    privacy_policy: 'https://npgamestudio.netlify.app/privacy-policy',
    update_info: {
      latest_version: APP_VERSION,           // ✅ appVersion.js se aata hai
      min_supported_version: MIN_SUPPORTED_VERSION, // ✅ appVersion.js se aata hai
      force_update: false,
      update_url: 'https://play.google.com/store/apps/details?id=com.numberflow.game',
      title: 'Exciting New Update! 🚀',
      message: 'A fresh new update is available with new levels and features!',
      release_notes: [
        '⚡ Faster & smarter ads — instant preloading, no more waiting!',
        '🔔 Smart daily notifications — spin reminders & streak alerts',
        '⚙️ New Settings screen — avatar, stats & profile in one place',
        '🎨 40 unlockable themes with tier filters in Coin Shop',
        '🐛 Performance improvements & bug fixes',
      ],
    },
  },
};
