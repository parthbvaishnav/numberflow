// constants/theme.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_v2';

export const COLORS = {
  // Backgrounds
  bg: '#0f1923',          // dark background
  surface: '#16212b',     // card surface

  // Borders
  borderLight: 'rgba(255,255,255,0.1)',

  // Text
  text: '#ffffff',
  muted: '#8fa3b8',

  // Primary Theme (Mining Blue)
  primary: '#4da9ff',
  primaryLight: '#8ecbff',

  // Accent / Glow
  accent: '#4da9ff',
  accentGlow: 'rgba(77,169,255,0.4)',

  // Glass effect
  glass: 'rgba(255,255,255,0.05)',
};

export const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

export const themes = {
  default: {
    id: 'default',
    name: 'Classic Dark',
    icon: '🌑',
    background: '#0f1923',
    surface: '#16212b',
    surfaceRaised: '#1c2d3a',
    border: '#2a3a4a',
    primary: '#4da9ff',
    primaryLight: '#8ecbff',
    text: '#ffffff',
    muted: '#8fa3b8',
    accent: '#4da9ff',
    accentGlow: 'rgba(77,169,255,0.4)',
    cost: 0,
    rankNeeded: 'Bronze'
  },
  dark: {
    id: 'dark',
    name: 'Pure Dark',
    icon: '🕶',
    background: '#050505',
    surface: '#0f0f0f',
    surfaceRaised: '#1a1a1a',
    border: '#262626',
    primary: '#ffffff',
    primaryLight: '#cccccc',
    text: '#ffffff',
    muted: '#777777',
    accent: '#e5e5e5',
    accentGlow: 'rgba(255,255,255,0.2)',
    cost: 399,
    rankNeeded: 'Bronze'
  },
  neon: {
    id: 'neon',
    name: 'Neon Pulse',
    icon: '⚡',
    background: '#0a0a0a',
    surface: '#141414',
    surfaceRaised: '#1e1e1e',
    border: '#2a2a2a',
    primary: '#00FF88',
    primaryLight: '#39FF14',
    text: '#FFFFFF',
    muted: '#888888',
    accent: '#00FF88',
    accentGlow: 'rgba(0,255,136,0.4)',
    cost: 599,
    rankNeeded: 'Bronze'
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Ocean',
    icon: '🌊',
    background: '#021B2B',
    surface: '#032D44',
    surfaceRaised: '#054060',
    border: '#1a5276',
    primary: '#00B4D8',
    primaryLight: '#48CAE4',
    text: '#E0F7FF',
    muted: '#7FB3C8',
    accent: '#00B4D8',
    accentGlow: 'rgba(0,180,216,0.4)',
    cost: 899,
    rankNeeded: 'Bronze'
  },
  purple: {
    id: 'purple',
    name: 'Mystic Purple',
    icon: '🔮',
    background: '#1a0535',
    surface: '#2a0d4d',
    surfaceRaised: '#3b1469',
    border: '#581C87',
    primary: '#9333EA',
    primaryLight: '#C084FC',
    text: '#F3E8FF',
    muted: '#D8B4FE',
    accent: '#9333EA',
    accentGlow: 'rgba(147,51,234,0.4)',
    cost: 1299,
    rankNeeded: 'Silver'
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('default');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val && themes[val]) {
        setThemeId(val);
      }
    });
  }, []);

  const setTheme = async (id) => {
    if (themes[id]) {
      setThemeId(id);
      await AsyncStorage.setItem(THEME_KEY, id);
    }
  };

  const activeTheme = themes[themeId] || themes.default;

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, setTheme, themeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}