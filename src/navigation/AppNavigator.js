// src/navigation/AppNavigator.js
//
// Root navigator.
// • Initialises RemoteConfigService and AppOpenAdManager on mount.
// • Renders the persistent bottom banner outside the navigation stack so it
//   remains visible across screens.
// • AppOpenAdManager handles both cold-launch and foreground-return ads.

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import ZipGameScreen from '../screens/ZipGameScreen';

import RemoteConfigService from '../services/RemoteConfigService';
import AppOpenAdManager from '../ads/Appopenadmanager';
import BannerAdComponent from '../ads/BannerAd';
import { SafeAreaView } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  useEffect(() => {
    // 1. Fetch remote config first so all ad decisions use fresh values.
    // 2. Then initialise App Open ads (which will attempt to show immediately
    //    on launch if conditions are met).
    RemoteConfigService.init().then(() => {
      AppOpenAdManager.init();
    });

    return () => {
      AppOpenAdManager.destroy();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Navigation stack ─────────────────────────────────────────────── */}
      <View style={styles.content}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Game" component={ZipGameScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>

      {/* ── Persistent bottom banner ─────────────────────────────────────── */}
      {/* BannerAdComponent returns null when ads are disabled — safe to render always */}
      <View style={styles.banner}>
        <BannerAdComponent />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1923', // match game background so it blends if empty
  },
});