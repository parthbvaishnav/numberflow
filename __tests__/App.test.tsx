/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { InteractionManager } from 'react-native';

// Synchronously run InteractionManager callbacks in test environment
InteractionManager.runAfterInteractions = (cb) => {
  if (cb) cb();
  return { cancel: () => {} };
};

// Mock react-native-google-mobile-ads
jest.mock('react-native-google-mobile-ads', () => {
  const mockMobileAds = jest.fn(() => ({
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
    initialize: jest.fn(() => Promise.resolve()),
  }));
  mockMobileAds.initialize = jest.fn(() => Promise.resolve());
  mockMobileAds.setRequestConfiguration = jest.fn(() => Promise.resolve());

  return {
    __esModule: true,
    default: mockMobileAds,
    MaxAdContentRating: {
      G: 'G',
      PG: 'PG',
      T: 'T',
      MA: 'MA',
    },
    TestIds: {
      BANNER: 'test-banner',
      INTERSTITIAL: 'test-interstitial',
      REWARDED: 'test-rewarded',
    },
    BannerAd: () => null,
    BannerAdSize: {
      BANNER: 'BANNER',
      LARGE_BANNER: 'LARGE_BANNER',
      MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
      FULL_BANNER: 'FULL_BANNER',
      LEADERBOARD: 'LEADERBOARD',
      ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
    },
    RewardedAd: {
      createForAdRequest: jest.fn(() => ({
        load: jest.fn(),
        onAdEvent: jest.fn(() => () => {}),
        addAdEventListener: jest.fn(() => () => {}),
        removeAllListeners: jest.fn(),
      })),
    },
    InterstitialAd: {
      createForAdRequest: jest.fn(() => ({
        load: jest.fn(),
        onAdEvent: jest.fn(() => () => {}),
        addAdEventListener: jest.fn(() => () => {}),
        removeAllListeners: jest.fn(),
      })),
    },
    AdEventType: {
      LOADED: 'loaded',
      CLOSED: 'closed',
      OPENED: 'opened',
    },
    RewardedAdEventType: {
      LOADED: 'loaded',
      EARNED_REWARD: 'earned_reward',
    },
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock vector icons to bypass binary TTF asset loading issues in Jest
jest.mock('@react-native-vector-icons/ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons', () => ({
  createIconSet: () => 'Icon',
  createIconSetFromIcoMoon: () => 'Icon',
}));
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// Mock react-native-video
jest.mock('react-native-video', () => 'Video');

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-firebase/crashlytics', () => {
  return () => ({
    crash: jest.fn(),
    log: jest.fn(),
    setAttribute: jest.fn(),
    setAttributes: jest.fn(),
    setUserId: jest.fn(),
  });
});

jest.mock('@react-native-firebase/remote-config', () => {
  const mockConfigInstance = {};
  return {
    __esModule: true,
    getRemoteConfig: jest.fn(() => mockConfigInstance),
    setConfigSettings: jest.fn(() => Promise.resolve()),
    setDefaults: jest.fn(() => Promise.resolve()),
    fetchAndActivate: jest.fn(() => Promise.resolve(true)),
    getValue: jest.fn(() => ({
      asString: jest.fn(() => '{}'),
      asBoolean: jest.fn(() => false),
      asNumber: jest.fn(() => 0),
    })),
  };
});



// Mock react-native-onesignal
jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    Notifications: {
      requestPermission: jest.fn(() => Promise.resolve(true)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    User: {
      addTags: jest.fn(),
      removeTags: jest.fn(),
      pushSubscription: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        getId: jest.fn(() => 'mock-push-id'),
        getToken: jest.fn(() => 'mock-push-token'),
        id: 'mock-push-id',
        token: 'mock-push-token',
      },
    },
  },
}));

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
}, 60000);
