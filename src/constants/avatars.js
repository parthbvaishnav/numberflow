// src/constants/avatars.js
//
// 100 Curated Avatars powered by the official Dicebear API (PNG format).
// Categories: Adventurers, Bottts (Robots), Fun Emoji, Lorelei (Characters).

const BASE_URL = 'https://api.dicebear.com/9.x';

// 25 Adventurers
const ADVENTURER_SEEDS = [
  'Jack', 'Luna', 'Leo', 'Milo', 'Zara', 'Felix', 'Maya', 'Finn', 'Nova', 'Oscar',
  'Aria', 'Jasper', 'Iris', 'Kai', 'Chloe', 'Ezra', 'Cleo', 'Rowan', 'Daisy', 'Silas',
  'Freya', 'Asher', 'Sage', 'Hugo', 'Piper'
];

// 25 Robots / Bottts
const BOTTTS_SEEDS = [
  'Gizmo', 'Sparky', 'Bolt', 'Byte', 'Pixel', 'Turbo', 'Neon', 'Circuit', 'Glitch', 'Echo',
  'Titan', 'Robo', 'Cyber', 'Matrix', 'Cosmo', 'Alpha', 'Beta', 'Omega', 'Vortex', 'Quark',
  'Rusty', 'Nano', 'Radar', 'Zenith', 'Chrono'
];

// 25 Fun Emoji / Cartoons
const FUN_EMOJI_SEEDS = [
  'Smiley', 'Wink', 'Cool', 'Giggle', 'Cheeky', 'Sunny', 'Zany', 'Happy', 'Blink', 'Chuckle',
  'Jolly', 'Peppy', 'Breezy', 'Spark', 'Dizzy', 'Twinkle', 'Glee', 'Bubbly', 'Snicker', 'Grin',
  'Beam', 'Chirp', 'Perky', 'Dapper', 'Bounce'
];

// 25 Lorelei / Modern Characters
const LORELEI_SEEDS = [
  'Elena', 'Alexander', 'Sophia', 'Liam', 'Olivia', 'Ethan', 'Ava', 'Lucas', 'Mia', 'Mason',
  'Isabella', 'Noah', 'Amelia', 'Oliver', 'Harper', 'Elijah', 'Evelyn', 'James', 'Abigail', 'Benjamin',
  'Emily', 'Henry', 'Charlotte', 'Sebastian', 'Scarlett'
];

export const AVATAR_CATEGORIES = [
  { id: 'adventurer', title: 'Adventurers', icon: '⚔️' },
  { id: 'bottts', title: 'Robots', icon: '🤖' },
  { id: 'fun-emoji', title: 'Emojis', icon: '😄' },
  { id: 'lorelei', title: 'Characters', icon: '✨' },
];

/**
 * Full catalog of 100 Dicebear Avatars
 */
export const DICEBEAR_AVATARS = [
  // 1. Adventurers (25)
  ...ADVENTURER_SEEDS.map((seed, index) => ({
    id: `adv_${index + 1}`,
    category: 'adventurer',
    name: seed,
    url: `${BASE_URL}/adventurer/png?seed=${seed}&size=128`,
  })),

  // 2. Robots (25)
  ...BOTTTS_SEEDS.map((seed, index) => ({
    id: `bot_${index + 1}`,
    category: 'bottts',
    name: seed,
    url: `${BASE_URL}/bottts/png?seed=${seed}&size=128`,
  })),

  // 3. Fun Emoji (25)
  ...FUN_EMOJI_SEEDS.map((seed, index) => ({
    id: `emoji_${index + 1}`,
    category: 'fun-emoji',
    name: seed,
    url: `${BASE_URL}/fun-emoji/png?seed=${seed}&size=128`,
  })),

  // 4. Lorelei Characters (25)
  ...LORELEI_SEEDS.map((seed, index) => ({
    id: `lor_${index + 1}`,
    category: 'lorelei',
    name: seed,
    url: `${BASE_URL}/lorelei/png?seed=${seed}&size=128`,
  })),
];

export const DEFAULT_AVATAR = DICEBEAR_AVATARS[0]; // Jack / adv_1
