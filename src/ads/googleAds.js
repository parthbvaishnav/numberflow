// src/ads/googleAds.js

import {
  InterstitialAd,
  RewardedAd,
  RewardedInterstitialAd,
  AppOpenAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import ConsentManager from '../services/ConsentManager';

// Dynamic request config for all ads based on COPPA & User Consent choices
const getRequestOptions = () => ConsentManager.getAdRequestOptions();

class GoogleAds {
  _interstitial = null;
  _rewarded = null;
  _interRewarded = null;
  _appOpen = null;

  // ───────────────── INTERSTITIAL ─────────────────

  loadInterstitial(id) {
    this._interstitial = InterstitialAd.createForAdRequest(id,getRequestOptions(),);

    this._interstitial.load();

    return this._interstitial;
  }

  showInterstitial(id) {
    return new Promise((resolve) => {

      const ad =
        InterstitialAd.createForAdRequest(
          id,
          getRequestOptions(),
        );

      const unsubLoaded =
        ad.addAdEventListener(
          AdEventType.LOADED,
          () => {
            ad.show();
          },
        );

      const unsubClosed =
        ad.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            cleanup();
            resolve(true);
          },
        );

      const unsubError =
        ad.addAdEventListener(
          AdEventType.ERROR,
          (err) => {
            console.warn(
              '[GoogleAds] Interstitial error:',
              err,
            );

            cleanup();
            resolve(false);
          },
        );

      function cleanup() {
        unsubLoaded();
        unsubClosed();
        unsubError();
      }

      ad.load();
    });
  }

  // ───────────────── REWARDED ─────────────────

  showRewarded(id, onReward) {
    return new Promise((resolve) => {

      const ad =
        RewardedAd.createForAdRequest(
          id,
          getRequestOptions(),
        );

      let rewarded = false;

      const unsubReward =
        ad.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            rewarded = true;

            if (onReward) {
              onReward();
            }
          },
        );

      const unsubLoaded =
        ad.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            ad.show();
          },
        );

      const unsubClosed =
        ad.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            cleanup();
            resolve(rewarded);
          },
        );

      const unsubError =
        ad.addAdEventListener(
          AdEventType.ERROR,
          (err) => {

            console.warn(
              '[GoogleAds] Rewarded error:',
              err,
            );

            cleanup();
            resolve(false);
          },
        );

      function cleanup() {
        unsubReward();
        unsubLoaded();
        unsubClosed();
        unsubError();
      }

      ad.load();
    });
  }

  // ───────────────── REWARDED INTERSTITIAL ─────────────────

  showRewardedInterstitial(id, onReward) {
    return new Promise((resolve) => {

      const ad =
        RewardedInterstitialAd.createForAdRequest(
          id,
          getRequestOptions(),
        );

      let rewarded = false;

      const unsubReward =
        ad.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            rewarded = true;

            if (onReward) {
              onReward();
            }
          },
        );

      const unsubLoaded =
        ad.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            ad.show();
          },
        );

      const unsubClosed =
        ad.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            cleanup();
            resolve(rewarded);
          },
        );

      const unsubError =
        ad.addAdEventListener(
          AdEventType.ERROR,
          (err) => {

            console.warn(
              '[GoogleAds] RewardedInterstitial error:',
              err,
            );

            cleanup();
            resolve(false);
          },
        );

      function cleanup() {
        unsubReward();
        unsubLoaded();
        unsubClosed();
        unsubError();
      }

      ad.load();
    });
  }

  // ───────────────── APP OPEN ─────────────────

  showAppOpen(id) {
    return new Promise((resolve) => {

      const ad =
        AppOpenAd.createForAdRequest(
          id,
          getRequestOptions(),
        );

      const unsubLoaded =
        ad.addAdEventListener(
          AdEventType.LOADED,
          () => {
            ad.show();
          },
        );

      const unsubClosed =
        ad.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            cleanup();
            resolve(true);
          },
        );

      const unsubError =
        ad.addAdEventListener(
          AdEventType.ERROR,
          (err) => {

            console.warn(
              '[GoogleAds] AppOpen error:',
              err,
            );

            cleanup();
            resolve(false);
          },
        );

      function cleanup() {
        unsubLoaded();
        unsubClosed();
        unsubError();
      }

      ad.load();
    });
  }
}

export default new GoogleAds();