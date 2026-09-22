const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'google-ads', 'html', 'playables_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const themeColors = {
  default: { primary: '#4da9ff', bg: '#0f1923', badge: '#1e3a8a' },
  neon: { primary: '#00FF88', bg: '#0a0a0a', badge: '#064e3b' },
  ocean: { primary: '#00B4D8', bg: '#021B2B', badge: '#164e63' },
  purple: { primary: '#9333EA', bg: '#1a0535', badge: '#581c87' },
  dark: { primary: '#ffffff', bg: '#050505', badge: '#27272a' }
};

const playablesHtml = manifest.map((p, idx) => {
  const colors = themeColors[p.theme] || themeColors.default;
  return `
    <div class="playable-card" data-theme="${p.theme}" id="card-lv${p.lv}">
      <div class="card-header">
        <div class="lv-badge" style="border-color: ${colors.primary}; color: ${colors.primary};">
          LEVEL ${p.lv.toString().padStart(2, '0')}
        </div>
        <span class="theme-pill" style="background: ${colors.badge}; color: ${colors.primary};">
          ${p.themeName}
        </span>
      </div>
      <div class="card-body">
        <div class="card-stat"><span>Grid Size:</span> <strong>${p.size} × ${p.size}</strong></div>
        <div class="card-stat"><span>Number Pairs:</span> <strong>${p.nodeCount} Pairs</strong></div>
        <div class="card-stat"><span>ZIP Package:</span> <strong>${p.sizeKb} KB</strong></div>
        <div class="card-stat"><span>ExitApi:</span> <strong style="color:#10b981;">Verified</strong></div>
      </div>
      <div class="card-footer">
        <button class="btn-preview" onclick="loadPlayable('${p.folderName}', ${p.lv}, '${p.themeName}', '${p.size}x${p.size}', ${p.nodeCount}, '${p.zipName}')">
          🎮 Preview
        </button>
        <a href="playables_zip/${p.zipName}" download class="btn-dl-zip" title="Download Google Ads ZIP package">
          📥 .ZIP
        </a>
      </div>
    </div>
  `;
}).join('\n');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Number Link Puzzle — Google Ads Creative Master Hub (20 Playables • 5 Videos • 10 Images)</title>
  <style>
    :root {
      --bg: #070d18;
      --card-bg: #0e1726;
      --card-alt: #131f33;
      --border: #1e293b;
      --border-bright: #334155;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-purple: #c084fc;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 60px;
    }
    a { color: var(--accent); text-decoration: none; }
    
    /* Sticky Top Nav */
    .top-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(7, 13, 24, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-brand {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }
    .nav-links {
      display: flex;
      gap: 18px;
    }
    .nav-links a {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      transition: color 0.2s;
    }
    .nav-links a:hover { color: var(--accent); }
    .nav-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 2px 10px rgba(14,165,233,0.3);
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px;
    }

    /* Hero Banner */
    .hero {
      background: linear-gradient(135deg, #0d1e38 0%, #081120 100%);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px 32px;
      margin-bottom: 40px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }
    .hero::after {
      content: '';
      position: absolute;
      top: -80px;
      right: -80px;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .badge-hub {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(14, 165, 233, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: 0.5px;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    .hero h1 {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      color: #fff;
    }
    .hero p {
      color: var(--text-muted);
      font-size: 15px;
      max-width: 820px;
      margin-bottom: 24px;
    }
    .stats-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .stat-box {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border);
      padding: 10px 18px;
      border-radius: 12px;
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .stat-val {
      font-size: 18px;
      font-weight: 900;
      color: var(--accent);
    }
    .stat-lbl {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Section Headings */
    .section-title {
      font-size: 22px;
      font-weight: 900;
      margin-bottom: 22px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
    }
    .section-title span {
      background: var(--accent);
      color: #070d18;
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 800;
    }

    /* Interactive Playable Studio */
    .studio-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 30px;
      margin-bottom: 50px;
      align-items: start;
    }
    @media (max-width: 980px) {
      .studio-layout { grid-template-columns: 1fr; }
    }

    /* Phone Device Simulator */
    .simulator-panel {
      position: sticky;
      top: 80px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .phone-bezel {
      width: 320px;
      height: 480px;
      background: #000;
      border: 8px solid #1e293b;
      border-radius: 28px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(56, 189, 248, 0.15);
    }
    .phone-bezel iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    .sim-controls {
      width: 100%;
      margin-top: 16px;
    }
    .sim-info {
      background: var(--card-alt);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .sim-info-title {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .sim-info-sub {
      font-size: 11px;
      color: var(--text-muted);
    }
    .sim-actions {
      display: flex;
      gap: 8px;
    }
    .sim-btn {
      flex: 1;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid var(--border);
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .sim-btn-restart {
      background: rgba(255,255,255,0.05);
      color: var(--text);
    }
    .sim-btn-restart:hover {
      background: rgba(255,255,255,0.15);
    }
    .sim-btn-dl {
      background: var(--accent);
      color: #070d18;
      border-color: var(--accent);
    }
    .sim-btn-dl:hover {
      background: #7dd3fc;
    }

    /* Playable Gallery Grid */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
    }
    .filter-btn {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { color: #fff; border-color: var(--border-bright); }
    .filter-btn.active {
      background: var(--accent);
      color: #070d18;
      border-color: var(--accent);
    }

    .playables-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .playable-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .playable-card:hover {
      transform: translateY(-3px);
      border-color: var(--accent);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    .playable-card.active-card {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .lv-badge {
      font-size: 11px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid;
      letter-spacing: 0.5px;
    }
    .theme-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
      text-transform: capitalize;
    }
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    .card-stat {
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
    }
    .card-stat strong { color: var(--text); }
    .card-footer {
      display: flex;
      gap: 8px;
    }
    .btn-preview {
      flex: 1;
      padding: 7px 10px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid var(--accent);
      color: var(--accent);
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .btn-preview:hover {
      background: var(--accent);
      color: #070d18;
    }
    .btn-dl-zip {
      padding: 7px 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border);
      color: #fff;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      transition: all 0.2s;
    }
    .btn-dl-zip:hover {
      background: rgba(255,255,255,0.15);
      border-color: #fff;
    }

    /* Standard Responsive Playables Bar */
    .standard-playables {
      background: var(--card-alt);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px 20px;
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
    }
    .std-info h4 { font-size: 14px; font-weight: 800; color: #fff; }
    .std-info p { font-size: 12px; color: var(--text-muted); }
    .std-btns { display: flex; gap: 10px; }

    /* Videos Section */
    .videos-section {
      margin-bottom: 50px;
    }
    .video-grid-vert {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 30px;
    }
    .video-grid-horiz {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    .video-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
    }
    .video-wrapper-vert {
      width: 240px;
      height: 426px;
      background: #000;
      border: 5px solid #1e293b;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      margin: 0 auto 16px;
    }
    .video-wrapper-horiz {
      width: 100%;
      aspect-ratio: 16/9;
      background: #000;
      border: 5px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      margin-bottom: 16px;
    }
    .video-grid-sq {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    .video-wrapper-sq {
      width: 240px;
      height: 240px;
      aspect-ratio: 1/1;
      background: #000;
      border: 5px solid #1e293b;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      margin: 0 auto 16px;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .video-tag {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 8px;
    }
    .video-title {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }
    .video-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
      margin-bottom: 14px;
      flex: 1;
    }

    /* Images Section */
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 22px;
      margin-bottom: 50px;
    }
    .image-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    .image-preview {
      background: #050a12;
      padding: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 240px;
    }
    .image-preview img {
      max-width: 100%;
      max-height: 360px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      transition: transform 0.2s;
    }
    .image-preview img:hover { transform: scale(1.02); }
    .image-info {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
    }
    .image-details h4 {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 3px;
    }
    .image-details p {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Copywriting Section */
    .copy-section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 26px;
      margin-bottom: 50px;
    }
    .copy-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 800px) { .copy-grid { grid-template-columns: 1fr; } }
    .copy-group h3 {
      font-size: 14px;
      font-weight: 800;
      color: var(--accent);
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .copy-item {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .copy-text {
      font-size: 13px;
      color: #f1f5f9;
      font-family: monospace;
    }
    .copy-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .char-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: #1e293b;
      border-radius: 4px;
      color: #94a3b8;
      font-family: monospace;
    }
    .copy-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--accent);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      background: var(--accent);
      color: #000;
    }

    /* Toast Notification */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #000;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 800;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s;
      pointer-events: none;
      z-index: 1000;
    }
    #toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    footer {
      text-align: center;
      padding-top: 30px;
      color: var(--text-muted);
      font-size: 13px;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>

  <!-- Navigation Bar -->
  <nav class="top-nav">
    <div class="nav-brand">
      <span style="font-size: 20px;">🧩</span>
      <span>Number Link Puzzle — Creative Master Hub</span>
    </div>
    <div class="nav-links">
      <a href="#playables">Playables (20)</a>
      <a href="#videos">Videos (5)</a>
      <a href="#images">Banners (10)</a>
      <a href="#copywriting">Ad Copy</a>
    </div>
    <a href="https://play.google.com/store/apps/details?id=com.numberflow.game" target="_blank" class="nav-cta">
      Play Store ↗
    </a>
  </nav>

  <div class="container">

    <!-- Hero Header -->
    <header class="hero">
      <div class="badge-hub">⚡ Google Ads ACi Ready • Official Asset Master Suite</div>
      <h1>Number Link Puzzle — Campaign Creatives Hub</h1>
      <p>
        Production-ready creative suite for Google App Campaigns for Installs (ACi). Features <strong>20 interactive HTML5 playable ads</strong> across all 5 app themes with deterministic level generation, <strong>5 high-converting video ads</strong> with authentic React Native win modals, <strong>10 multi-level display banners</strong>, and character-compliant copywriting.
      </p>
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-val">20</div>
          <div class="stat-lbl">HTML5 Playables (Levels 1–20)</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">5</div>
          <div class="stat-lbl">Video Ads (9:16 + 16:9)</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">10</div>
          <div class="stat-lbl">Banner Formats (All Sizes)</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">5.8 KB</div>
          <div class="stat-lbl">Avg Playable ZIP Size</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">ExitApi</div>
          <div class="stat-lbl">100% Policy Compliant</div>
        </div>
      </div>
    </header>

    <!-- SECTION 1: 20 INTERACTIVE PLAYABLES -->
    <section id="playables" style="margin-bottom: 50px;">
      <div class="section-title">
        🕹️ Interactive HTML5 Playables Studio <span>20 Levels • 5 Themes • ExitApi Verified</span>
      </div>

      <div class="studio-layout">
        <!-- Simulator Column -->
        <div class="simulator-panel">
          <div class="phone-bezel">
            <iframe id="previewIframe" src="playables/playable_lv01_default/index.html" scrolling="no"></iframe>
          </div>
          <div class="sim-controls">
            <div class="sim-info">
              <div class="sim-info-title">
                <span id="simLevelTitle">Level 01 • Classic Dark</span>
                <span id="simGridBadge" style="color: var(--accent);">5 × 5</span>
              </div>
              <div class="sim-info-sub" id="simSubDetails">3 Number Pairs • 5.8 KB ZIP Package</div>
            </div>
            <div class="sim-actions">
              <button class="sim-btn sim-btn-restart" onclick="restartPlayable()">↺ Restart</button>
              <a id="simDlBtn" href="playables_zip/playable_lv01_default.zip" download class="sim-btn sim-btn-dl">📥 Download ZIP</a>
            </div>
          </div>
        </div>

        <!-- Levels Catalog Column -->
        <div>
          <!-- Theme Filters -->
          <div class="filter-bar">
            <button class="filter-btn active" onclick="filterPlayables('all', this)">All (20)</button>
            <button class="filter-btn" onclick="filterPlayables('default', this)">Classic Dark (4)</button>
            <button class="filter-btn" onclick="filterPlayables('neon', this)">Neon Pulse (4)</button>
            <button class="filter-btn" onclick="filterPlayables('ocean', this)">Deep Ocean (4)</button>
            <button class="filter-btn" onclick="filterPlayables('purple', this)">Mystic Purple (4)</button>
            <button class="filter-btn" onclick="filterPlayables('dark', this)">Pure Dark (4)</button>
          </div>

          <!-- 20 Level Cards Grid -->
          <div class="playables-cards-grid" id="playablesGrid">
            ${playablesHtml}
          </div>

          <!-- Standard AdMob Responsive Formats -->
          <div class="standard-playables">
            <div class="std-info">
              <h4>📦 Standard AdMob Responsive Packages</h4>
              <p>Fixed responsive canvas packages for standard interstitial slots.</p>
            </div>
            <div class="std-btns">
              <a href="playable_320x480.zip" download class="btn-dl-zip" style="padding: 8px 16px;">📥 320x480 Portrait (5.5 KB)</a>
              <a href="playable_480x320.zip" download class="btn-dl-zip" style="padding: 8px 16px;">📥 480x320 Landscape (5.2 KB)</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: 20 VIDEO ADS -->
    <section id="videos" class="videos-section">
      <div class="section-title">
        🎬 Ready-To-Upload Video Ads <span>20 Finished MP4 Videos • Vertical (9:16), Landscape (16:9) & Square (1:1 / 5:5)</span>
      </div>

      <!-- Vertical 9:16 -->
      <h3 style="font-size: 15px; font-weight: 800; color: var(--accent); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
        📱 Vertical Videos (9:16 — 1080x1920) for YouTube Shorts, Reels & Interstitials (8 Videos)
      </h3>
      <div class="video-grid-vert">
        <!-- V1 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_01_hook_challenge_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(56,189,248,0.15); color: #38bdf8;">V1 • Level 6 • 15s • 1.21 MB</span>
            <div class="video-title">Near-Miss Hook: Can You Reach Node 4?</div>
            <div class="video-desc">Starts with red wall blocking error ❌, rapid reset, outer corridor path solve, and instant Level Complete popup.</div>
            <a href="../video/video_01_hook_challenge_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V1 MP4</a>
          </div>
        </div>

        <!-- V2 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_02_asmr_flow_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(16,185,129,0.15); color: #10b981;">V2 • Level 1 ➔ 6 • 15s • 0.88 MB</span>
            <div class="video-title">Satisfying Multi-Level ASMR Flow</div>
            <div class="video-desc">Fast 5x5 solve in 4s -> seamless transition to Level 6 with authentic in-game completion modal (+75 Coins, Next/Retry).</div>
            <a href="../video/video_02_asmr_flow_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V2 MP4</a>
          </div>
        </div>

        <!-- V3 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_03_hard_iq_level15_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(245,158,11,0.15); color: #f59e0b;">V3 • Level 15 • 15s • 0.90 MB</span>
            <div class="video-title">Expert IQ Challenge (7 Nodes on 6x6)</div>
            <div class="video-desc">High-IQ brain hook featuring pure 7-node maze routing, tense countdown, and real ZipGameScreen completion modal.</div>
            <a href="../video/video_03_hard_iq_level15_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V3 MP4</a>
          </div>
        </div>

        <!-- V6 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_06_neon_speedrun_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(0,255,136,0.15); color: #00ff88;">V6 • Level 2 Neon • 14s • 0.81 MB</span>
            <div class="video-title">5-Second Speedrun Neon Flow</div>
            <div class="video-desc">Fast-paced cyber neon drawing, rapid line physics, upbeat rhythmic clicks, and instant Level Cleared card.</div>
            <a href="../video/video_06_neon_speedrun_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V6 MP4</a>
          </div>
        </div>

        <!-- V7 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_07_ocean_calm_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(0,180,216,0.15); color: #00b4d8;">V7 • Level 3 Ocean • 14s • 0.80 MB</span>
            <div class="video-title">Anti-Stress Ocean Calm</div>
            <div class="video-desc">Zero stress, zero pressure timers. Tranquil aqua glow, ambient water drop synth, and soothing ASMR.</div>
            <a href="../video/video_07_ocean_calm_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V7 MP4</a>
          </div>
        </div>

        <!-- V8 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_08_purple_mystery_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(168,85,247,0.15); color: #a855f7;">V8 • Level 4 Purple • 14s • 0.77 MB</span>
            <div class="video-title">Mystic Logic Maze (Connect 1 to 4)</div>
            <div class="video-desc">Don't trap yourself! Tricky 4-pair handcrafted grid, tactile click sounds, and celebratory win modal.</div>
            <a href="../video/video_08_purple_mystery_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V8 MP4</a>
          </div>
        </div>

        <!-- V9 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_09_hard_maze_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(248,113,113,0.15); color: #f87171;">V9 • Level 7 Neon • 14s • 0.71 MB</span>
            <div class="video-title">95% Fail Stage (Wall Barrier Test)</div>
            <div class="video-desc">Challenging 6x6 grid with maze walls and 5 nodes. Tense heartbeat audio, outer solve, and IQ badge.</div>
            <a href="../video/video_09_hard_maze_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V9 MP4</a>
          </div>
        </div>

        <!-- V10 -->
        <div class="video-card">
          <div class="video-wrapper-vert">
            <video controls preload="metadata">
              <source src="../video/video_10_expert_level20_1080x1920.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(255,255,255,0.15); color: #ffffff;">V10 • Level 20 Dark • 14s • 0.61 MB</span>
            <div class="video-title">Grand Master Level 20 Final Test</div>
            <div class="video-desc">The ultimate 7-node pure dark logic workout. Intense pacing, dramatic full-board solve, and grand victory fanfare.</div>
            <a href="../video/video_10_expert_level20_1080x1920.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V10 MP4</a>
          </div>
        </div>
      </div>

      <!-- Horizontal 16:9 -->
      <h3 style="font-size: 15px; font-weight: 800; color: var(--accent); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
        🖥️ Landscape Videos (16:9 — 1920x1080) for YouTube In-Stream & Desktop (7 Videos)
      </h3>
      <div class="video-grid-horiz">
        <!-- V4 -->
        <div class="video-card">
          <div class="video-wrapper-horiz">
            <video controls preload="metadata">
              <source src="../video/video_04_progression_1920x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(56,189,248,0.15); color: #38bdf8;">V4 • Level 1 vs Level 15 • 20s • 1.78 MB</span>
            <div class="video-title">Progression: Starter 5x5 vs Master 6x6</div>
            <div class="video-desc">Split-screen comparison showing intuitive beginner flow scaling up to intricate master puzzles, ending with authentic victory screen.</div>
            <a href="../video/video_04_progression_1920x1080.mp4" download class="btn-preview" style="display:inline-block; padding:8px 24px;">📥 Download V4 MP4</a>
          </div>
        </div>

        <!-- V5 -->
        <div class="video-card">
          <div class="video-wrapper-horiz">
            <video controls preload="metadata">
              <source src="../video/video_05_zen_widescreen_1920x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(16,185,129,0.15); color: #10b981;">V5 • Level 6 Zen • 15s • 0.57 MB</span>
            <div class="video-title">Widescreen Zen & Focus Logic</div>
            <div class="video-desc">Calming ambient logic showcase with floating cyberpunk grid, satisfying line connection physics, and store install CTA.</div>
            <a href="../video/video_05_zen_widescreen_1920x1080.mp4" download class="btn-preview" style="display:inline-block; padding:8px 24px;">📥 Download V5 MP4</a>
          </div>
        </div>

        <!-- V11 -->
        <div class="video-card">
          <div class="video-wrapper-horiz">
            <video controls preload="metadata">
              <source src="../video/video_11_split_neon_ocean_1920x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(0,255,136,0.15); color: #00ff88;">V11 • Neon vs Ocean • 15s • 1.07 MB</span>
            <div class="video-title">Theme Battle: Neon Pulse vs Deep Ocean</div>
            <div class="video-desc">Side-by-side dual screen showcasing diverse themes: vibrant cyberpunk green vs calming oceanic cyan, highlighting game customization.</div>
            <a href="../video/video_11_split_neon_ocean_1920x1080.mp4" download class="btn-preview" style="display:inline-block; padding:8px 24px;">📥 Download V11 MP4</a>
          </div>
        </div>

        <!-- V12 -->
        <div class="video-card">
          <div class="video-wrapper-horiz">
            <video controls preload="metadata">
              <source src="../video/video_12_iq_showcase_1920x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(0,180,216,0.15); color: #00b4d8;">V12 • Level 8 Ocean • 15s • 1.29 MB</span>
            <div class="video-title">Sharpen Your Mind Daily (IQ Workout)</div>
            <div class="video-desc">Brain training angle highlighting spatial memory stimulation, clean typography, 4.9 rating social proof, and store install CTA.</div>
            <a href="../video/video_12_iq_showcase_1920x1080.mp4" download class="btn-preview" style="display:inline-block; padding:8px 24px;">📥 Download V12 MP4</a>
          </div>
        </div>

        <!-- V13 -->
        <div class="video-card">
          <div class="video-wrapper-horiz">
            <video controls preload="metadata">
              <source src="../video/video_13_darkmode_zen_1920x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(168,85,247,0.15); color: #a855f7;">V13 • Level 9 Purple • 15s • 1.23 MB</span>
            <div class="video-title">Soothing Bedtime Puzzle (OLED Dark Mode)</div>
            <div class="video-desc">Night-time relaxing logic aesthetic. Zero stressful timers, pure zen problem solving, and ambient soundscapes.</div>
            <a href="../video/video_13_darkmode_zen_1920x1080.mp4" download class="btn-preview" style="display:inline-block; padding:8px 24px;">📥 Download V13 MP4</a>
          </div>
        </div>

        <!-- V14 -->
        <div class="video-card">
          <div class="video-wrapper-horiz">
            <video controls preload="metadata">
              <source src="../video/video_14_progression_level4_level12_1920x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(56,189,248,0.15); color: #38bdf8;">V14 • Level 4 vs Level 12 • 15s • 1.16 MB</span>
            <div class="video-title">Player Progression: Casual 5x5 to Expert 6x6</div>
            <div class="video-desc">Dual board comparison showing fast casual completion scaling into intricate multi-wall navigation, finishing with victory card.</div>
            <a href="../video/video_14_progression_level4_level12_1920x1080.mp4" download class="btn-preview" style="display:inline-block; padding:8px 24px;">📥 Download V14 MP4</a>
          </div>
        </div>

        <!-- V15 -->
        <div class="video-card">
          <div class="video-wrapper-horiz">
            <video controls preload="metadata">
              <source src="../video/video_15_satisfying_asmr_1920x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(16,185,129,0.15); color: #10b981;">V15 • Level 16 Flow • 15s • 1.17 MB</span>
            <div class="video-title">Perfect Unbroken Flow (Tactile ASMR)</div>
            <div class="video-desc">Continuous hypnotic solving of a 7-node dense 6x6 grid. Synchronized click audio, clean solve, and Play Store install callout.</div>
            <a href="../video/video_15_satisfying_asmr_1920x1080.mp4" download class="btn-preview" style="display:inline-block; padding:8px 24px;">📥 Download V15 MP4</a>
          </div>
        </div>
      </div>

      <!-- Square 1:1 / 5:5 -->
      <h3 style="font-size: 15px; font-weight: 800; color: var(--accent); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
        ⏹️ Square Videos (1:1 / 5:5 — 1080x1080) for Google Display & In-Feed (5 Videos)
      </h3>
      <div class="video-grid-sq">
        <!-- V16 -->
        <div class="video-card">
          <div class="video-wrapper-sq">
            <video controls preload="metadata">
              <source src="../video/video_16_square_quick_puzzle_1080x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(56,189,248,0.15); color: #38bdf8;">V16 • Level 1 Classic • 13s • 0.74 MB</span>
            <div class="video-title">Quick Logic Challenge (Can You Solve in 3s?)</div>
            <div class="video-desc">Fast 3-second hook connecting 1 -> 2 -> 3 with zero crossing lines. Centered square frame with authentic win modal.</div>
            <a href="../video/video_16_square_quick_puzzle_1080x1080.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V16 MP4</a>
          </div>
        </div>

        <!-- V17 -->
        <div class="video-card">
          <div class="video-wrapper-sq">
            <video controls preload="metadata">
              <source src="../video/video_17_square_neon_pulse_1080x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(0,255,136,0.15); color: #00ff88;">V17 • Level 2 Neon • 13s • 0.74 MB</span>
            <div class="video-title">Satisfying Neon ASMR Flow</div>
            <div class="video-desc">Cyber green glowing line physics with rhythmic tactile clicks. Perfectly optimized for 1:1 mobile feed view.</div>
            <a href="../video/video_17_square_neon_pulse_1080x1080.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V17 MP4</a>
          </div>
        </div>

        <!-- V18 -->
        <div class="video-card">
          <div class="video-wrapper-sq">
            <video controls preload="metadata">
              <source src="../video/video_18_square_hard_iq_1080x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(168,85,247,0.15); color: #a855f7;">V18 • Level 10 Purple • 13s • 0.65 MB</span>
            <div class="video-title">Level 10 Maze Test (Only 3% Clear)</div>
            <div class="video-desc">Tense 6-node maze routing through obstacle barriers. Heartbeat audio, 36/36 cells complete, and IQ 135+ badge.</div>
            <a href="../video/video_18_square_hard_iq_1080x1080.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V18 MP4</a>
          </div>
        </div>

        <!-- V19 -->
        <div class="video-card">
          <div class="video-wrapper-sq">
            <video controls preload="metadata">
              <source src="../video/video_19_square_ocean_zen_1080x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(0,180,216,0.15); color: #00b4d8;">V19 • Level 5 Ocean • 13s • 0.81 MB</span>
            <div class="video-title">Calm Your Mind (Anti-Stress Zen)</div>
            <div class="video-desc">Tranquil deep ocean cyan theme with smooth glide path. 100% offline ready callout and soothing chords.</div>
            <a href="../video/video_19_square_ocean_zen_1080x1080.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V19 MP4</a>
          </div>
        </div>

        <!-- V20 -->
        <div class="video-card">
          <div class="video-wrapper-sq">
            <video controls preload="metadata">
              <source src="../video/video_20_square_grand_master_1080x1080.mp4" type="video/mp4">
            </video>
          </div>
          <div>
            <span class="video-tag" style="background: rgba(255,255,255,0.15); color: #ffffff;">V20 • Level 15 Master • 13s • 0.58 MB</span>
            <div class="video-title">Grand Master IQ 140+ Workout</div>
            <div class="video-desc">Dense 7-node complete grid fill on 6x6. Dramatic golden sparks, celebratory win modal, and Google Play button.</div>
            <a href="../video/video_20_square_grand_master_1080x1080.mp4" download class="btn-preview" style="display:block; text-align:center;">📥 Download V20 MP4</a>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: 10 IMAGE CREATIVES -->
    <section id="images" style="margin-bottom: 50px;">
      <div class="section-title">
        🖼️ High-Converting Display Banners <span>10 Verified Formats • Multi-Level & Multi-Theme</span>
      </div>

      <div class="images-grid">
        <!-- 1 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_landscape_1200x628_01_challenge.png" alt="Landscape 1200x628">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Landscape 1.91:1 — Near-Miss Hook</h4>
              <p>1200 × 628 • Level 6 (Neon Pulse) • Google Discover / YouTube</p>
            </div>
            <a href="../images/ad_landscape_1200x628_01_challenge.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 2 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_landscape_1200x628_02_relax.png" alt="Landscape 1200x628">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Landscape 1.91:1 — Zen Dark Mode</h4>
              <p>1200 × 628 • Level 3 (Deep Ocean) • GDN / Gmail Ads</p>
            </div>
            <a href="../images/ad_landscape_1200x628_02_relax.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 3 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_square_1200x1200_01_gameplay.png" alt="Square 1200x1200">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Square 1:1 — Pure Gameplay</h4>
              <p>1200 × 1200 • Level 1 (Classic Dark) • Mobile In-Feed Cards</p>
            </div>
            <a href="../images/ad_square_1200x1200_01_gameplay.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 4 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_square_1200x1200_02_iq_hook.png" alt="Square 1200x1200">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Square 1:1 — Brain IQ Challenge</h4>
              <p>1200 × 1200 • Level 15 (Pure Dark) • Interstitial Native Display</p>
            </div>
            <a href="../images/ad_square_1200x1200_02_iq_hook.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 5 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_portrait_1080x1920_01_hero.png" alt="Portrait 1080x1920" style="max-height:280px;">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Tall Portrait 9:16 — Cyberpunk Hero</h4>
              <p>1080 × 1920 • Level 7 (Mystic Purple) • YouTube Shorts</p>
            </div>
            <a href="../images/ad_portrait_1080x1920_01_hero.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 6 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_portrait_1080x1920_02_progression.png" alt="Portrait 1080x1920" style="max-height:280px;">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Tall Portrait 9:16 — Progression Hook</h4>
              <p>1080 × 1920 • Level 1 vs 15 (Classic & Neon) • App Interstitials</p>
            </div>
            <a href="../images/ad_portrait_1080x1920_02_progression.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 7 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_portrait_1200x1500_01_satisfying.png" alt="Portrait 1200x1500" style="max-height:260px;">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Portrait 4:5 — Satisfying Flow</h4>
              <p>1200 × 1500 • Level 9 (Neon Pulse) • Social & Mobile Feeds</p>
            </div>
            <a href="../images/ad_portrait_1200x1500_01_satisfying.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 8 -->
        <div class="image-card">
          <div class="image-preview">
            <img src="../images/ad_portrait_1200x1500_02_brain_workout.png" alt="Portrait 1200x1500" style="max-height:260px;">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>Portrait 4:5 — Mental Workout</h4>
              <p>1200 × 1500 • Level 13 (Classic Dark) • Social & Mobile Feeds</p>
            </div>
            <a href="../images/ad_portrait_1200x1500_02_brain_workout.png" download class="copy-btn">Save</a>
          </div>
        </div>

        <!-- 9 & 10 -->
        <div class="image-card">
          <div class="image-preview" style="gap: 16px;">
            <img src="../images/ad_banner_300x300.png" alt="300x300" style="max-height:140px;">
            <img src="../images/ad_card_282x280.png" alt="282x280" style="max-height:140px;">
          </div>
          <div class="image-info">
            <div class="image-details">
              <h4>In-App Icons & Small Banners</h4>
              <p>300 × 300 (Lv 20 Deep Ocean) & 282 × 280 (Lv 1 Neon Pulse)</p>
            </div>
            <a href="../images/ad_banner_300x300.png" download class="copy-btn">Save</a>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 4: COPYWRITING -->
    <section id="copywriting" class="copy-section">
      <div class="section-title" style="margin-bottom: 16px;">
        ✍️ Verified Text Assets <span>Headlines ≤ 30 Chars | Descriptions ≤ 90 Chars</span>
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
        All text assets are strictly checked against Google Ads limits and optimized for high click-through rates.
      </p>

      <div class="copy-grid">
        <!-- Headlines -->
        <div class="copy-group">
          <h3>5 Headlines (Max 30 Chars)</h3>
          <div class="copy-item">
            <span class="copy-text">Number Link Puzzle Game</span>
            <div class="copy-meta">
              <span class="char-badge">23/30</span>
              <button class="copy-btn" onclick="copyText('Number Link Puzzle Game')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Connect Numbers & Relax</span>
            <div class="copy-meta">
              <span class="char-badge">23/30</span>
              <button class="copy-btn" onclick="copyText('Connect Numbers & Relax')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Can You Link All Pairs?</span>
            <div class="copy-meta">
              <span class="char-badge">23/30</span>
              <button class="copy-btn" onclick="copyText('Can You Link All Pairs?')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Daily Brain Logic Workout</span>
            <div class="copy-meta">
              <span class="char-badge">25/30</span>
              <button class="copy-btn" onclick="copyText('Daily Brain Logic Workout')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Simple Rules, Deep Logic</span>
            <div class="copy-meta">
              <span class="char-badge">24/30</span>
              <button class="copy-btn" onclick="copyText('Simple Rules, Deep Logic')">Copy</button>
            </div>
          </div>
        </div>

        <!-- Descriptions -->
        <div class="copy-group">
          <h3>5 Descriptions (Max 90 Chars)</h3>
          <div class="copy-item">
            <span class="copy-text">Connect matching numbers across the grid without crossing lines. 100% free & offline!</span>
            <div class="copy-meta">
              <span class="char-badge">87/90</span>
              <button class="copy-btn" onclick="copyText('Connect matching numbers across the grid without crossing lines. 100% free & offline!')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Train your mind with hundreds of relaxing neon logic puzzles. Pure focus, zero stress!</span>
            <div class="copy-meta">
              <span class="char-badge">87/90</span>
              <button class="copy-btn" onclick="copyText('Train your mind with hundreds of relaxing neon logic puzzles. Pure focus, zero stress!')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Sharpen your brain daily. Handcrafted grids from 5x5 to 10x10. Download and play now!</span>
            <div class="copy-meta">
              <span class="char-badge">86/90</span>
              <button class="copy-btn" onclick="copyText('Sharpen your brain daily. Handcrafted grids from 5x5 to 10x10. Download and play now!')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Enjoy soothing dark mode visuals, smooth haptics, and satisfying number link puzzles!</span>
            <div class="copy-meta">
              <span class="char-badge">86/90</span>
              <button class="copy-btn" onclick="copyText('Enjoy soothing dark mode visuals, smooth haptics, and satisfying number link puzzles!')">Copy</button>
            </div>
          </div>
          <div class="copy-item">
            <span class="copy-text">Join thousands of puzzle solvers. Easy to learn, deeply satisfying to master today!</span>
            <div class="copy-meta">
              <span class="char-badge">85/90</span>
              <button class="copy-btn" onclick="copyText('Join thousands of puzzle solvers. Easy to learn, deeply satisfying to master today!')">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer>
      Number Link Puzzle (com.numberflow.game) • Official Google Ads Campaign Creative Hub • Built for Maximum ROAS & Growth
    </footer>

  </div>

  <!-- Toast Element -->
  <div id="toast">Copied to clipboard!</div>

  <script>
    // Playable preview switcher
    function loadPlayable(folderName, lv, themeName, gridSize, nodeCount, zipName) {
      const iframe = document.getElementById('previewIframe');
      iframe.src = 'playables/' + folderName + '/index.html';

      document.getElementById('simLevelTitle').textContent = 'Level ' + lv.toString().padStart(2, '0') + ' • ' + themeName;
      document.getElementById('simGridBadge').textContent = gridSize;
      document.getElementById('simSubDetails').textContent = nodeCount + ' Number Pairs • ExitApi Ready';
      document.getElementById('simDlBtn').href = 'playables_zip/' + zipName;

      // Update card highlighting
      document.querySelectorAll('.playable-card').forEach(c => c.classList.remove('active-card'));
      const activeCard = document.getElementById('card-lv' + lv);
      if (activeCard) activeCard.classList.add('active-card');

      // Scroll simulator into view on mobile
      if (window.innerWidth < 980) {
        document.querySelector('.simulator-panel').scrollIntoView({ behavior: 'smooth' });
      }
    }

    function restartPlayable() {
      const iframe = document.getElementById('previewIframe');
      iframe.src = iframe.src;
    }

    // Theme filter
    function filterPlayables(theme, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cards = document.querySelectorAll('.playable-card');
      cards.forEach(card => {
        if (theme === 'all' || card.getAttribute('data-theme') === theme) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    // Toast copy
    function copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        toast.textContent = 'Copied: "' + text + '"';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
      });
    }

    // Initialize first card active
    document.addEventListener('DOMContentLoaded', () => {
      const firstCard = document.getElementById('card-lv1');
      if (firstCard) firstCard.classList.add('active-card');
    });
  </script>
</body>
</html>
`;

const outputPath = path.join(__dirname, '..', 'google-ads', 'html', 'index_gallery.html');
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log('✅ Successfully compiled and written index_gallery.html (' + htmlContent.length + ' bytes)');
