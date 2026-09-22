// src/navigation/AppNavigator.js

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import ZipGameScreen from '../screens/ZipGameScreen';
import SpinWheelScreen from '../screens/SpinWheelScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

import RemoteConfigService from '../services/RemoteConfigService';
import AppOpenAdManager from '../ads/Appopenadmanager';
import BannerAdComponent from '../ads/BannerAd';

import { useTheme } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { theme } = useTheme();

  useEffect(() => {
    RemoteConfigService.init().then(() => {
      AppOpenAdManager.init();
    });
    return () => {
      AppOpenAdManager.destroy();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Navigation */}
      <View style={styles.content}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Game" component={ZipGameScreen} />
            <Stack.Screen name="SpinWheel" component={SpinWheelScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
      {/* Bottom Banner */}
      <View style={[styles.banner, { backgroundColor: theme.background }]}>
        <BannerAdComponent />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 4,
    paddingBottom: 2,
    minHeight: 52,
  }
});