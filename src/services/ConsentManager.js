// src/services/ConsentManager.js
//
// Central Privacy, COPPA & Ad Consent Manager for Number Flow.
// Ensures strict compliance with AppLovin Policies for Publishers,
// Google AdMob policies, COPPA, GDPR, and CCPA/U.S. Multistate privacy laws.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AGE_GATE_COMPLETED: '@numberflow_age_gate_completed',
  USER_AGE: '@numberflow_user_age',
  ALLOW_PERSONALIZED: '@numberflow_allow_personalized_ads',
};

class ConsentManager {
  _initialized = false;
  _ageGateCompleted = false;
  _userAge = null;
  _allowPersonalizedAds = false;

  /**
   * Load stored consent and age gate values from AsyncStorage.
   */
  async init() {
    try {
      const [completedStr, ageStr, personalizedStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AGE_GATE_COMPLETED),
        AsyncStorage.getItem(STORAGE_KEYS.USER_AGE),
        AsyncStorage.getItem(STORAGE_KEYS.ALLOW_PERSONALIZED),
      ]);

      this._ageGateCompleted = completedStr === 'true';
      this._userAge = ageStr ? parseInt(ageStr, 10) : null;
      this._allowPersonalizedAds = personalizedStr === 'true';
      this._initialized = true;

      console.log('[ConsentManager] Initialized state:', {
        ageGateCompleted: this._ageGateCompleted,
        userAge: this._userAge,
        allowPersonalizedAds: this._allowPersonalizedAds,
        isChild: this.isChild(),
      });

      this.syncAppLovinFlags();
    } catch (err) {
      console.warn('[ConsentManager] Error loading consent state:', err);
      // Safe fallback: treat as underage/non-personalized until user confirms
      this._ageGateCompleted = false;
      this._allowPersonalizedAds = false;
    }
  }

  /**
   * Checks if the user must complete the Age Gate modal.
   * Returns true whenever age gate is incomplete or user age is missing.
   * @returns {boolean}
   */
  isConsentRequired() {
    return !this._ageGateCompleted || this._userAge === null || typeof this._userAge !== 'number' || isNaN(this._userAge);
  }

  /**
   * Checks if user qualifies as a "Child" under COPPA / AppLovin guidelines (< 13 or < 16).
   * @returns {boolean}
   */
  isChild() {
    if (this._userAge === null) return true; // Default safe fallback
    return this._userAge < 13;
  }

  /**
   * Can personalized ads be shown?
   * Returns false if user is a child or opted out.
   * @returns {boolean}
   */
  canShowPersonalizedAds() {
    if (this.isChild()) return false;
    return this._allowPersonalizedAds;
  }

  /**
   * Save user choices from Age Gate or Profile Settings.
   * @param {{ age: number, allowPersonalized: boolean }} data
   */
  async saveConsent({ age, allowPersonalized }) {
    try {
      const parsedAge = parseInt(age, 10);
      const isUnderage = parsedAge < 13;

      // Children are NEVER allowed personalized ads
      const finalPersonalized = isUnderage ? false : !!allowPersonalized;

      this._userAge = parsedAge;
      this._ageGateCompleted = true;
      this._allowPersonalizedAds = finalPersonalized;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AGE_GATE_COMPLETED, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.USER_AGE, parsedAge.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.ALLOW_PERSONALIZED, finalPersonalized ? 'true' : 'false'),
      ]);

      console.log('[ConsentManager] Consent saved successfully:', {
        age: parsedAge,
        allowPersonalized: finalPersonalized,
        isChild: isUnderage,
      });

      this.syncAppLovinFlags();
    } catch (err) {
      console.error('[ConsentManager] Failed to save consent:', err);
    }
  }

  /**
   * Syncs privacy flags with optional AppLovin SDK if installed.
   */
  syncAppLovinFlags() {
    try {
      const { NativeModules, TurboModuleRegistry } = require('react-native');
      const isAvailable =
        (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry.get && TurboModuleRegistry.get('AppLovinMAX')) ||
        (NativeModules && NativeModules.AppLovinMAX);

      if (!isAvailable) return;

      const AppLovinMAX = require('react-native-applovin-max');
      if (AppLovinMAX) {
        const isChild = this.isChild();
        const canPersonalize = this.canShowPersonalizedAds();

        if (AppLovinMAX.setIsAgeRestrictedUser) {
          AppLovinMAX.setIsAgeRestrictedUser(isChild);
        }
        if (AppLovinMAX.setHasUserConsent) {
          AppLovinMAX.setHasUserConsent(canPersonalize);
        }
        if (AppLovinMAX.setDoNotSell) {
          AppLovinMAX.setDoNotSell(!canPersonalize);
        }
        console.log('[ConsentManager] AppLovin MAX privacy flags updated.');
      }
    } catch (e) {
      // AppLovin MAX module not native-linked yet — safe fallback
    }
  }

  /**
   * Returns request options for Google Mobile Ads & AppLovin.
   * Enforces non-personalized ad requests when required by policy.
   */
  getAdRequestOptions() {
    const isPersonalized = this.canShowPersonalizedAds();
    return {
      requestNonPersonalizedAdsOnly: !isPersonalized,
      keywords: ['puzzle', 'brain', 'logic', 'numbers'],
    };
  }

  getUserAge() {
    return this._userAge;
  }

  getAllowPersonalized() {
    return this._allowPersonalizedAds;
  }
}

export default new ConsentManager();
