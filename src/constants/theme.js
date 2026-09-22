// src/constants/theme.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_v2';

export const COLORS = {
  bg: '#0f1923',
  surface: '#16212b',
  borderLight: 'rgba(255,255,255,0.1)',
  text: '#ffffff',
  muted: '#8fa3b8',
  primary: '#4da9ff',
  primaryLight: '#8ecbff',
  accent: '#4da9ff',
  accentGlow: 'rgba(77,169,255,0.4)',
  glass: 'rgba(255,255,255,0.05)',
};

export const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

/**
 * 40 Complete Themes:
 * - 1st Theme: Free (0 coins)
 * - 2nd Theme: 999 coins
 * - 3rd Theme: 1,999 coins
 * - 4th Theme: 2,999 coins
 * ...
 * - 40th Theme: 38,999 coins
 */
export const themes = {
  // ── #1 (Free / Default) ──────────────────────────────────────────────────
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
  },

  // ── #2 (999 Coins) ───────────────────────────────────────────────────────
  dark: {
    id: 'dark',
    name: 'Pure Dark',
    icon: '🕶️',
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
    cost: 999,
  },

  // ── #3 (1,999 Coins) ─────────────────────────────────────────────────────
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
    cost: 1999,
  },

  // ── #4 (2,999 Coins) ─────────────────────────────────────────────────────
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
    cost: 2999,
  },

  // ── #5 (3,999 Coins) ─────────────────────────────────────────────────────
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
    cost: 3999,
  },

  // ── #6 (4,999 Coins) ─────────────────────────────────────────────────────
  emerald: {
    id: 'emerald',
    name: 'Emerald Forest',
    icon: '🌲',
    background: '#062016',
    surface: '#0d3324',
    surfaceRaised: '#124531',
    border: '#1b5e43',
    primary: '#10B981',
    primaryLight: '#6EE7B7',
    text: '#ECFDF5',
    muted: '#A7F3D0',
    accent: '#10B981',
    accentGlow: 'rgba(16,185,129,0.4)',
    cost: 4999,
  },

  // ── #7 (5,999 Coins) ─────────────────────────────────────────────────────
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    icon: '🌅',
    background: '#200b14',
    surface: '#331220',
    surfaceRaised: '#471a2d',
    border: '#692542',
    primary: '#F97316',
    primaryLight: '#FDBA74',
    text: '#FFF7ED',
    muted: '#FED7AA',
    accent: '#F97316',
    accentGlow: 'rgba(249,115,22,0.4)',
    cost: 5999,
  },

  // ── #8 (6,999 Coins) ─────────────────────────────────────────────────────
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: '🤖',
    background: '#120526',
    surface: '#200842',
    surfaceRaised: '#2e0e5c',
    border: '#4c1d95',
    primary: '#F43F5E',
    primaryLight: '#FB7185',
    text: '#FFF1F2',
    muted: '#FECDD3',
    accent: '#06B6D4',
    accentGlow: 'rgba(6,182,212,0.4)',
    cost: 6999,
  },

  // ── #9 (7,999 Coins) ─────────────────────────────────────────────────────
  crimson: {
    id: 'crimson',
    name: 'Crimson Night',
    icon: '🩸',
    background: '#1a0505',
    surface: '#2b0909',
    surfaceRaised: '#3d0d0d',
    border: '#5c1414',
    primary: '#EF4444',
    primaryLight: '#F87171',
    text: '#FEF2F2',
    muted: '#FECACA',
    accent: '#EF4444',
    accentGlow: 'rgba(239,68,68,0.4)',
    cost: 7999,
  },

  // ── #10 (8,999 Coins) ────────────────────────────────────────────────────
  midnight: {
    id: 'midnight',
    name: 'Midnight Gold',
    icon: '👑',
    background: '#0f0f14',
    surface: '#1a1a24',
    surfaceRaised: '#252533',
    border: '#3c3c52',
    primary: '#F59E0B',
    primaryLight: '#FCD34D',
    text: '#FFFBEB',
    muted: '#FDE68A',
    accent: '#F59E0B',
    accentGlow: 'rgba(245,158,11,0.4)',
    cost: 8999,
  },

  // ── #11 (9,999 Coins) ────────────────────────────────────────────────────
  aurora: {
    id: 'aurora',
    name: 'Aurora Lights',
    icon: '🌌',
    background: '#041726',
    surface: '#072842',
    surfaceRaised: '#0b395e',
    border: '#135387',
    primary: '#2DD4BF',
    primaryLight: '#5EEAD4',
    text: '#F0FDFA',
    muted: '#99F6E4',
    accent: '#A855F7',
    accentGlow: 'rgba(45,212,191,0.4)',
    cost: 9999,
  },

  // ── #12 (10,999 Coins) ───────────────────────────────────────────────────
  vaporwave: {
    id: 'vaporwave',
    name: 'Vaporwave',
    icon: '🌴',
    background: '#1e082b',
    surface: '#2f0d43',
    surfaceRaised: '#431361',
    border: '#631d8f',
    primary: '#EC4899',
    primaryLight: '#F472B6',
    text: '#FDF2F8',
    muted: '#FBCFE8',
    accent: '#06B6D4',
    accentGlow: 'rgba(236,72,153,0.4)',
    cost: 10999,
  },

  // ── #13 (11,999 Coins) ───────────────────────────────────────────────────
  matrix: {
    id: 'matrix',
    name: 'Matrix Code',
    icon: '💻',
    background: '#020d05',
    surface: '#041c0a',
    surfaceRaised: '#072b10',
    border: '#0d471b',
    primary: '#22C55E',
    primaryLight: '#4ADE80',
    text: '#F0FDF4',
    muted: '#86EFAC',
    accent: '#22C55E',
    accentGlow: 'rgba(34,197,94,0.4)',
    cost: 11999,
  },

  // ── #14 (12,999 Coins) ───────────────────────────────────────────────────
  dracula: {
    id: 'dracula',
    name: 'Royal Dracula',
    icon: '🧛',
    background: '#191622',
    surface: '#211c30',
    surfaceRaised: '#2d2642',
    border: '#41375e',
    primary: '#BD93F9',
    primaryLight: '#D6ACFF',
    text: '#F8F8F2',
    muted: '#6272A4',
    accent: '#FF79C6',
    accentGlow: 'rgba(189,147,249,0.4)',
    cost: 12999,
  },

  // ── #15 (13,999 Coins) ───────────────────────────────────────────────────
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    icon: '☀️',
    background: '#240d04',
    surface: '#3b1607',
    surfaceRaised: '#52200a',
    border: '#783010',
    primary: '#EA580C',
    primaryLight: '#FB923C',
    text: '#FFF7ED',
    muted: '#FDBA74',
    accent: '#EAB308',
    accentGlow: 'rgba(234,88,12,0.4)',
    cost: 13999,
  },

  // ── #16 (14,999 Coins) ───────────────────────────────────────────────────
  ice: {
    id: 'ice',
    name: 'Glacial Ice',
    icon: '❄️',
    background: '#0a1926',
    surface: '#11293d',
    surfaceRaised: '#183854',
    border: '#245078',
    primary: '#38BDF8',
    primaryLight: '#7DD3FC',
    text: '#F0F9FF',
    muted: '#BAE6FD',
    accent: '#38BDF8',
    accentGlow: 'rgba(56,189,248,0.4)',
    cost: 14999,
  },

  // ── #17 (15,999 Coins) ───────────────────────────────────────────────────
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst Gem',
    icon: '💎',
    background: '#1c082e',
    surface: '#2c0d47',
    surfaceRaised: '#3d1263',
    border: '#5c1c94',
    primary: '#A855F7',
    primaryLight: '#C084FC',
    text: '#FAF5FF',
    muted: '#E9D5FF',
    accent: '#EC4899',
    accentGlow: 'rgba(168,85,247,0.4)',
    cost: 15999,
  },

  // ── #18 (16,999 Coins) ───────────────────────────────────────────────────
  sakura: {
    id: 'sakura',
    name: 'Sakura Petal',
    icon: '🌸',
    background: '#240a16',
    surface: '#381023',
    surfaceRaised: '#4d1730',
    border: '#732249',
    primary: '#FB7185',
    primaryLight: '#FDA4AF',
    text: '#FFF1F2',
    muted: '#FECDD3',
    accent: '#F43F5E',
    accentGlow: 'rgba(251,113,133,0.4)',
    cost: 16999,
  },

  // ── #19 (17,999 Coins) ───────────────────────────────────────────────────
  galaxy: {
    id: 'galaxy',
    name: 'Deep Galaxy',
    icon: '🔭',
    background: '#0d0724',
    surface: '#150c38',
    surfaceRaised: '#1e1150',
    border: '#2e1a7a',
    primary: '#818CF8',
    primaryLight: '#A5B4FC',
    text: '#EEF2FF',
    muted: '#C7D2FE',
    accent: '#C084FC',
    accentGlow: 'rgba(129,140,248,0.4)',
    cost: 17999,
  },

  // ── #20 (18,999 Coins) ───────────────────────────────────────────────────
  volcano: {
    id: 'volcano',
    name: 'Molten Lava',
    icon: '🌋',
    background: '#210606',
    surface: '#360a0a',
    surfaceRaised: '#4d0e0e',
    border: '#701515',
    primary: '#DC2626',
    primaryLight: '#F87171',
    text: '#FEF2F2',
    muted: '#FCA5A5',
    accent: '#F97316',
    accentGlow: 'rgba(220,38,38,0.4)',
    cost: 18999,
  },

  // ── #21 (19,999 Coins) ───────────────────────────────────────────────────
  synthwave: {
    id: 'synthwave',
    name: 'Synthwave 80s',
    icon: '🏎️',
    background: '#160224',
    surface: '#24033b',
    surfaceRaised: '#330554',
    border: '#53088a',
    primary: '#D946EF',
    primaryLight: '#E879F9',
    text: '#FDF4FF',
    muted: '#F5D0FE',
    accent: '#06B6D4',
    accentGlow: 'rgba(217,70,239,0.4)',
    cost: 19999,
  },

  // ── #22 (20,999 Coins) ───────────────────────────────────────────────────
  stealth: {
    id: 'stealth',
    name: 'Stealth Matte',
    icon: '🥷',
    background: '#0d0f12',
    surface: '#15181d',
    surfaceRaised: '#1e2229',
    border: '#2d333d',
    primary: '#94A3B8',
    primaryLight: '#CBD5E1',
    text: '#F8FAFC',
    muted: '#64748B',
    accent: '#0EA5E9',
    accentGlow: 'rgba(148,163,184,0.3)',
    cost: 20999,
  },

  // ── #23 (21,999 Coins) ───────────────────────────────────────────────────
  sapphire: {
    id: 'sapphire',
    name: 'Royal Sapphire',
    icon: '💠',
    background: '#051329',
    surface: '#081f42',
    surfaceRaised: '#0c2d61',
    border: '#144694',
    primary: '#2563EB',
    primaryLight: '#60A5FA',
    text: '#EFF6FF',
    muted: '#BFDBFE',
    accent: '#38BDF8',
    accentGlow: 'rgba(37,99,235,0.4)',
    cost: 21999,
  },

  // ── #24 (22,999 Coins) ───────────────────────────────────────────────────
  toxic: {
    id: 'toxic',
    name: 'Toxic Slime',
    icon: '🧪',
    background: '#0d1703',
    surface: '#152405',
    surfaceRaised: '#1d3307',
    border: '#2e4f0c',
    primary: '#84CC16',
    primaryLight: '#A3E635',
    text: '#F7FEE7',
    muted: '#BEF264',
    accent: '#22C55E',
    accentGlow: 'rgba(132,204,22,0.4)',
    cost: 22999,
  },

  // ── #25 (23,999 Coins) ───────────────────────────────────────────────────
  candy: {
    id: 'candy',
    name: 'Cotton Candy',
    icon: '🍭',
    background: '#240b20',
    surface: '#381232',
    surfaceRaised: '#4d1945',
    border: '#732668',
    primary: '#F472B6',
    primaryLight: '#FBCFE8',
    text: '#FDF2F8',
    muted: '#F9A8D4',
    accent: '#38BDF8',
    accentGlow: 'rgba(244,114,182,0.4)',
    cost: 23999,
  },

  // ── #26 (24,999 Coins) ───────────────────────────────────────────────────
  obsidian: {
    id: 'obsidian',
    name: 'Gold Obsidian',
    icon: '🏺',
    background: '#12100e',
    surface: '#1e1a17',
    surfaceRaised: '#2b2520',
    border: '#403730',
    primary: '#D97706',
    primaryLight: '#FBBF24',
    text: '#FFFBEB',
    muted: '#FCD34D',
    accent: '#D97706',
    accentGlow: 'rgba(217,119,6,0.4)',
    cost: 24999,
  },

  // ── #27 (25,999 Coins) ───────────────────────────────────────────────────
  mint: {
    id: 'mint',
    name: 'Fresh Mint',
    icon: '🍃',
    background: '#041a17',
    surface: '#072924',
    surfaceRaised: '#0b3d36',
    border: '#135c52',
    primary: '#14B8A6',
    primaryLight: '#2DD4BF',
    text: '#F0FDFA',
    muted: '#99F6E4',
    accent: '#10B981',
    accentGlow: 'rgba(20,184,166,0.4)',
    cost: 25999,
  },

  // ── #28 (26,999 Coins) ───────────────────────────────────────────────────
  nebula: {
    id: 'nebula',
    name: 'Cosmic Nebula',
    icon: '🌠',
    background: '#140321',
    surface: '#200536',
    surfaceRaised: '#2e074d',
    border: '#460b75',
    primary: '#C084FC',
    primaryLight: '#E9D5FF',
    text: '#FAF5FF',
    muted: '#D8B4FE',
    accent: '#F43F5E',
    accentGlow: 'rgba(192,132,252,0.4)',
    cost: 26999,
  },

  // ── #29 (27,999 Coins) ───────────────────────────────────────────────────
  phantom: {
    id: 'phantom',
    name: 'Phantom Spirit',
    icon: '👻',
    background: '#0b1317',
    surface: '#121f26',
    surfaceRaised: '#192b36',
    border: '#274252',
    primary: '#67E8F9',
    primaryLight: '#A5F3FC',
    text: '#ECFEFF',
    muted: '#CFFAFE',
    accent: '#67E8F9',
    accentGlow: 'rgba(103,232,249,0.4)',
    cost: 27999,
  },

  // ── #30 (28,999 Coins) ───────────────────────────────────────────────────
  autumn: {
    id: 'autumn',
    name: 'Autumn Amber',
    icon: '🍂',
    background: '#210c05',
    surface: '#361408',
    surfaceRaised: '#4d1c0c',
    border: '#702911',
    primary: '#EA580C',
    primaryLight: '#FB923C',
    text: '#FFF7ED',
    muted: '#FDBA74',
    accent: '#CA8A04',
    accentGlow: 'rgba(234,88,12,0.4)',
    cost: 28999,
  },

  // ── #31 (29,999 Coins) ───────────────────────────────────────────────────
  aquamarine: {
    id: 'aquamarine',
    name: 'Aquamarine',
    icon: '🐬',
    background: '#02181c',
    surface: '#04282e',
    surfaceRaised: '#063a42',
    border: '#0a5663',
    primary: '#06B6D4',
    primaryLight: '#22D3EE',
    text: '#ECFEFF',
    muted: '#A5F3FC',
    accent: '#06B6D4',
    accentGlow: 'rgba(6,182,212,0.4)',
    cost: 29999,
  },

  // ── #32 (30,999 Coins) ───────────────────────────────────────────────────
  bloodmoon: {
    id: 'bloodmoon',
    name: 'Blood Moon',
    icon: '🌙',
    background: '#1c0308',
    surface: '#2e050e',
    surfaceRaised: '#420714',
    border: '#630b1e',
    primary: '#E11D48',
    primaryLight: '#FB7185',
    text: '#FFF1F2',
    muted: '#FDA4AF',
    accent: '#E11D48',
    accentGlow: 'rgba(225,29,72,0.4)',
    cost: 30999,
  },

  // ── #33 (31,999 Coins) ───────────────────────────────────────────────────
  zenith: {
    id: 'zenith',
    name: 'Stellar Zenith',
    icon: '⭐',
    background: '#0a0d24',
    surface: '#11163b',
    surfaceRaised: '#181f52',
    border: '#252f7a',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    text: '#EEF2FF',
    muted: '#A5B4FC',
    accent: '#F59E0B',
    accentGlow: 'rgba(99,102,241,0.4)',
    cost: 31999,
  },

  // ── #34 (32,999 Coins) ───────────────────────────────────────────────────
  titanium: {
    id: 'titanium',
    name: 'Titanium Slate',
    icon: '🛡️',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceRaised: '#334155',
    border: '#475569',
    primary: '#38BDF8',
    primaryLight: '#7DD3FC',
    text: '#F8FAFC',
    muted: '#94A3B8',
    accent: '#38BDF8',
    accentGlow: 'rgba(56,189,248,0.4)',
    cost: 32999,
  },

  // ── #35 (33,999 Coins) ───────────────────────────────────────────────────
  starlight: {
    id: 'starlight',
    name: 'Starlight Silver',
    icon: '✨',
    background: '#12141a',
    surface: '#1a1d26',
    surfaceRaised: '#252936',
    border: '#383e52',
    primary: '#E2E8F0',
    primaryLight: '#FFFFFF',
    text: '#FFFFFF',
    muted: '#94A3B8',
    accent: '#A855F7',
    accentGlow: 'rgba(226,232,240,0.4)',
    cost: 33999,
  },

  // ── #36 (34,999 Coins) ───────────────────────────────────────────────────
  supernova: {
    id: 'supernova',
    name: 'Supernova',
    icon: '💥',
    background: '#24061a',
    surface: '#3b0a2a',
    surfaceRaised: '#520e3b',
    border: '#781556',
    primary: '#F43F5E',
    primaryLight: '#FB7185',
    text: '#FFF1F2',
    muted: '#FDA4AF',
    accent: '#EAB308',
    accentGlow: 'rgba(244,63,94,0.4)',
    cost: 34999,
  },

  // ── #37 (35,999 Coins) ───────────────────────────────────────────────────
  hologram: {
    id: 'hologram',
    name: 'Hologram Teal',
    icon: '💠',
    background: '#021a1f',
    surface: '#042a33',
    surfaceRaised: '#063d4a',
    border: '#0a5b6e',
    primary: '#14B8A6',
    primaryLight: '#2DD4BF',
    text: '#F0FDFA',
    muted: '#99F6E4',
    accent: '#EC4899',
    accentGlow: 'rgba(20,184,166,0.4)',
    cost: 35999,
  },

  // ── #38 (36,999 Coins) ───────────────────────────────────────────────────
  abyss: {
    id: 'abyss',
    name: 'Abyssal Void',
    icon: '🕳️',
    background: '#04040a',
    surface: '#080814',
    surfaceRaised: '#0d0d21',
    border: '#171738',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    text: '#EEF2FF',
    muted: '#A5B4FC',
    accent: '#A855F7',
    accentGlow: 'rgba(99,102,241,0.4)',
    cost: 36999,
  },

  // ── #39 (37,999 Coins) ───────────────────────────────────────────────────
  celestial: {
    id: 'celestial',
    name: 'Celestial Angel',
    icon: '🕊️',
    background: '#0c1221',
    surface: '#131c33',
    surfaceRaised: '#1a2747',
    border: '#273a69',
    primary: '#38BDF8',
    primaryLight: '#BAE6FD',
    text: '#F0F9FF',
    muted: '#7DD3FC',
    accent: '#FDE047',
    accentGlow: 'rgba(56,189,248,0.4)',
    cost: 37999,
  },

  // ── #40 (38,999 Coins) ───────────────────────────────────────────────────
  infinity: {
    id: 'infinity',
    name: 'Infinity Gold',
    icon: '♾️',
    background: '#140f02',
    surface: '#241a04',
    surfaceRaised: '#332506',
    border: '#4d3809',
    primary: '#EAB308',
    primaryLight: '#FDE047',
    text: '#FEFCE8',
    muted: '#FEF08A',
    accent: '#EAB308',
    accentGlow: 'rgba(234,179,8,0.4)',
    cost: 38999,
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('default');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
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