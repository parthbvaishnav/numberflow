// constants/theme.js

import { Platform } from 'react-native';

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