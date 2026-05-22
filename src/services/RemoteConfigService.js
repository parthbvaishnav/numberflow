// src/services/RemoteConfigService.js

import NetInfo from '@react-native-community/netinfo';

import { getApp } from '@react-native-firebase/app';

import {
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
  fetchAndActivate,
  getValue,
} from '@react-native-firebase/remote-config';

import { DEFAULT_ADS_CONFIG } from './defaultAdsConfig';

class RemoteConfigService {

  _config = DEFAULT_ADS_CONFIG;

  _initialized = false;

  constructor() {

    const app = getApp();

    this.remoteConfig =
      getRemoteConfig(app);
  }

  async init() {

    if (this._initialized) return;

    try {

      // Check internet
      const netState =
        await NetInfo.fetch();

      if (!netState.isConnected) {

        console.log(
          '[RemoteConfig] No internet connection — using defaults.'
        );

        this._initialized = true;

        return;
      }

      // Config settings
      await setConfigSettings(
        this.remoteConfig,
        {
          minimumFetchIntervalMillis:
            __DEV__
              ? 0
              : 2 * 60 * 1000,
        }
      );

      // Default values
      await setDefaults(
        this.remoteConfig,
        {
          ads_config: JSON.stringify(
            DEFAULT_ADS_CONFIG
          ),
        }
      );

      // Fetch latest values
      const activated =
        await fetchAndActivate(
          this.remoteConfig
        );

      console.log(
        `[RemoteConfig] fetchAndActivate → ${activated}`
      );

      // Read config
      const raw =
        getValue(
          this.remoteConfig,
          'ads_config'
        ).asString();

      if (raw) {

        const parsed =
          JSON.parse(raw);

        this._config = parsed;

        console.log(
          '[RemoteConfig] Config loaded from remote.'
        );
      }

    } catch (e) {

      console.warn(
        '[RemoteConfig] Error — using defaults:',
        e
      );

      this._config =
        DEFAULT_ADS_CONFIG;
    }

    this._initialized = true;
  }

  // Get current config
  getAdsConfig() {

    return this._config;
  }
}

export default new RemoteConfigService();