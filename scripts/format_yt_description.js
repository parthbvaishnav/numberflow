const fs = require('fs');

const desc = `Welcome to NP Game Studio! 🎮

We craft addictive, minimalist, and satisfying logic & brain puzzle games designed for pure focus and relaxation.

🧩 FEATURED GAME: Number Link Puzzle
Connect matching numbered pairs across the grid without crossing lines! Handcrafted with smooth neon visuals, soothing dark mode, and progressive brain challenges.

⭐ Highlights:
• 100% Free & Offline — No Wi-Fi needed
• Pure Logic — Zero timers, zero pressure
• Handcrafted Grids — 5x5 starter to 10x10 mazes
• Relaxing Dark Mode & smooth haptics

📲 Download on Google Play:
https://play.google.com/store/apps/details?id=com.numberflow.game

📺 Channel Content:
• Official game trailers & level walkthroughs
• Speed-solve challenges & logic IQ shorts
• New puzzle releases & hints

🔔 Subscribe to train your brain with daily puzzle challenges!

Contact: contact@npgamestudio.com
© NP Game Studio`;

console.log('Total characters (including spaces & newlines):', desc.length);
if (desc.length <= 1000) {
  console.log(`✅ Perfectly compliant! (${desc.length}/1000 characters, ${1000 - desc.length} characters remaining)`);
} else {
  console.log(`❌ Over limit by ${desc.length - 1000} characters!`);
}

module.exports = desc;
