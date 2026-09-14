import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = r'd:\PC\RN\numberflow'
UPLOADED_DIR = r'C:\Users\Parth\.gemini\antigravity-ide\brain\74ac4e83-410d-4ed5-a5d1-694d76f560b7\.user_uploaded'
OUT_DIR = os.path.join(BASE_DIR, 'screenImages')

PORTRAIT_DIR = os.path.join(OUT_DIR, 'portrait_9_16')
LANDSCAPE_DIR = os.path.join(OUT_DIR, 'landscape_16_9')
BANNER_DIR = os.path.join(OUT_DIR, 'banner')

for d in [PORTRAIT_DIR, LANDSCAPE_DIR, BANNER_DIR]:
    os.makedirs(d, exist_ok=True)

MAPPING = {
    'home': 'media_1789360004221.png',
    'game': 'media_1789360000833.png',
    'spin': 'media_1789359988182.png',
    'profile': 'media_1789359994320.png',
    'shop': 'media_1789359997641.png'
}

def get_font(name, size):
    candidates = [
        f'C:/Windows/Fonts/{name}',
        'C:/Windows/Fonts/segoeuib.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
        'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_star(draw, cx, cy, r_outer, r_inner, fill, outline=None):
    points = []
    for i in range(10):
        angle = i * math.pi / 5 - math.pi / 2
        r = r_outer if i % 2 == 0 else r_inner
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=fill, outline=outline)

def get_clean_screenshot(key):
    fname = MAPPING[key]
    path = os.path.join(UPLOADED_DIR, fname)
    with Image.open(path) as img:
        img = img.convert('RGBA')
        # Clean crop: remove top status bar (y=0..54) and bottom ad banner (y=938..1024)
        cropped = img.crop((0, 54, 472, 938))
        return cropped

def create_gradient_bg(width, height, top_color, bottom_color, center_glow_color=(20, 60, 110), glow_radius=500, glow_cy=0.45):
    base = Image.new('RGBA', (width, height), top_color)
    draw = ImageDraw.Draw(base)
    
    r1, g1, b1 = top_color[:3]
    r2, g2, b2 = bottom_color[:3]
    for y in range(height):
        ratio = y / float(height)
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        
    if center_glow_color:
        glow_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_layer)
        cx, cy = width // 2, int(height * glow_cy)
        gr, gg, gb = center_glow_color[:3]
        for rad in range(glow_radius, 0, -12):
            alpha = int(45 * (1 - rad / glow_radius))
            gdraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(gr, gg, gb, alpha))
        base = Image.alpha_composite(base, glow_layer)
        
    # Add subtle puzzle network background pattern
    pat_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pat_layer)
    
    nodes = [
        (int(width * 0.12), int(height * 0.14)),
        (int(width * 0.88), int(height * 0.16)),
        (int(width * 0.08), int(height * 0.85)),
        (int(width * 0.92), int(height * 0.80)),
    ]
    for nx, ny in nodes:
        pdraw.ellipse([nx - 14, ny - 14, nx + 14, ny + 14], fill=(56, 189, 248, 16), outline=(56, 189, 248, 40), width=1)
        pdraw.ellipse([nx - 4, ny - 4, nx + 4, ny + 4], fill=(56, 189, 248, 80))
        
    base = Image.alpha_composite(base, pat_layer)
    return base

def draw_device_mockup(screen_img, screen_w, screen_h, corner_r=38):
    bezel = 15
    outer_w = screen_w + bezel * 2
    outer_h = screen_h + bezel * 2
    
    resized_screen = screen_img.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    
    screen_mask = Image.new('L', (screen_w, screen_h), 0)
    sdraw = ImageDraw.Draw(screen_mask)
    sdraw.rounded_rectangle([0, 0, screen_w, screen_h], radius=corner_r - 6, fill=255)
    
    device_img = Image.new('RGBA', (outer_w, outer_h), (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(device_img)
    
    # Outer chassis
    ddraw.rounded_rectangle([0, 0, outer_w, outer_h], radius=corner_r, fill=(17, 24, 34, 255), outline=(56, 189, 248, 130), width=2)
    # Inner border
    ddraw.rounded_rectangle([bezel - 1, bezel - 1, outer_w - bezel + 1, outer_h - bezel + 1], radius=corner_r - 4, outline=(15, 23, 42, 220), width=2)
    
    # Screen paste
    device_img.paste(resized_screen, (bezel, bezel), screen_mask)
    
    # Top dynamic notch
    notch_w = int(outer_w * 0.24)
    notch_h = 10
    notch_x = (outer_w - notch_w) // 2
    notch_y = bezel // 2
    ddraw.rounded_rectangle([notch_x, notch_y, notch_x + notch_w, notch_y + notch_h], radius=5, fill=(6, 10, 16, 245))
    ddraw.ellipse([notch_x + notch_w - 20, notch_y + 2, notch_x + notch_w - 14, notch_y + 8], fill=(30, 48, 70, 255))
    
    # Drop shadow
    pad = 60
    canvas_w = outer_w + pad * 2
    canvas_h = outer_h + pad * 2
    shadow_layer = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    sdraw2 = ImageDraw.Draw(shadow_layer)
    sdraw2.rounded_rectangle([pad, pad + 18, pad + outer_w, pad + outer_h + 18], radius=corner_r + 4, fill=(0, 0, 0, 180))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(30))
    
    shadow_layer.paste(device_img, (pad, pad), device_img)
    return shadow_layer, pad

# ─────────────────────────────────────────────────────────────────────────────
# 1. BUILD PORTRAIT SCREENSHOTS (9:16 -> 1080 x 1920)
# ─────────────────────────────────────────────────────────────────────────────
def build_portrait_screenshots():
    print('Generating 9:16 Portrait Screenshots (1080 x 1920)...')
    
    font_badge = get_font('segoeuib.ttf', 24)
    font_title = get_font('segoeuib.ttf', 60)
    font_sub = get_font('segoeui.ttf', 32)
    
    configs = [
        {
            'name': 'screenshot_1_home_1080x1920.png',
            'screen': 'home',
            'badge': 'PURE LOGIC PUZZLE',
            'title': 'NUMBER LINK PUZZLE',
            'sub': 'Clean Minimal Dark Mode • Smooth & Addictive'
        },
        {
            'name': 'screenshot_2_gameplay_1080x1920.png',
            'screen': 'game',
            'badge': 'CONNECT THE PAIRS',
            'title': 'SATISFYING PATH FLOW',
            'sub': 'Draw Seamless Lines Across The Entire Board'
        },
        {
            'name': 'screenshot_3_spinwheel_1080x1920.png',
            'screen': 'spin',
            'badge': 'DAILY REWARDS',
            'title': 'SPIN & WIN FREE PRIZES',
            'sub': 'Earn Daily Coins & Bonus Hints Every Day'
        },
        {
            'name': 'screenshot_4_profile_1080x1920.png',
            'screen': 'profile',
            'badge': 'RANK & PROGRESSION',
            'title': 'LEVEL UP YOUR SKILLS',
            'sub': 'Earn XP, Complete Quests & Build Streaks'
        },
        {
            'name': 'screenshot_5_shop_1080x1920.png',
            'screen': 'shop',
            'badge': 'BOOSTS & POWER-UPS',
            'title': 'FREE COINS & HINTS',
            'sub': 'Never Stay Stuck On Challenging Levels'
        }
    ]
    
    W, H = 1080, 1920
    screen_target_w = 800
    screen_target_h = int(screen_target_w * (884 / 472)) # ~1498px
    
    for cfg in configs:
        bg = create_gradient_bg(W, H, (10, 18, 28), (5, 9, 15), center_glow_color=(20, 65, 115), glow_radius=550, glow_cy=0.48)
        draw = ImageDraw.Draw(bg)
        
        # 1. Badge Pill
        badge_text = cfg['badge']
        bbox_b = font_badge.getbbox(badge_text)
        bw = (bbox_b[2] - bbox_b[0]) + 40
        bh = 46
        bx = (W - bw) // 2
        by = 75
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=23, fill=(15, 30, 48, 220), outline=(56, 189, 248, 140), width=1)
        draw.text((bx + 20, by + 9), badge_text, font=font_badge, fill=(56, 189, 248, 255))
        
        # 2. Main Title (with shadow)
        title_text = cfg['title']
        bbox_t = font_title.getbbox(title_text)
        tw = bbox_t[2] - bbox_t[0]
        tx = (W - tw) // 2
        ty = 145
        draw.text((tx + 2, ty + 3), title_text, font=font_title, fill=(0, 0, 0, 160))
        draw.text((tx, ty), title_text, font=font_title, fill=(255, 255, 255, 255))
        
        # 3. Subtitle
        sub_text = cfg['sub']
        bbox_s = font_sub.getbbox(sub_text)
        sw = bbox_s[2] - bbox_s[0]
        sx = (W - sw) // 2
        sy = 228
        draw.text((sx + 1, sy + 2), sub_text, font=font_sub, fill=(0, 0, 0, 140))
        draw.text((sx, sy), sub_text, font=font_sub, fill=(148, 163, 184, 255))
        
        # 4. Device Mockup
        raw_screen = get_clean_screenshot(cfg['screen'])
        mockup_img, pad = draw_device_mockup(raw_screen, screen_target_w, screen_target_h)
        
        mockup_x = (W - mockup_img.width) // 2
        mockup_y = 300 - pad
        bg.paste(mockup_img, (mockup_x, mockup_y), mockup_img)
        
        out_path = os.path.join(PORTRAIT_DIR, cfg['name'])
        bg.convert('RGB').save(out_path, 'PNG', quality=95)
        print(f'  Saved portrait: {out_path}')

# ─────────────────────────────────────────────────────────────────────────────
# 2. BUILD LANDSCAPE SCREENSHOTS (16:9 -> 1920 x 1080)
# ─────────────────────────────────────────────────────────────────────────────
def build_landscape_screenshots():
    print('Generating 16:9 Landscape Screenshots (1920 x 1080)...')
    
    font_badge = get_font('segoeuib.ttf', 24)
    font_title = get_font('segoeuib.ttf', 62)
    font_sub = get_font('segoeui.ttf', 30)
    font_bullet = get_font('segoeuib.ttf', 28)
    font_tag = get_font('segoeui.ttf', 24)
    
    configs = [
        {
            'name': 'screenshot_1_gameplay_1920x1080.png',
            'screen': 'game',
            'badge': 'LOGIC PUZZLE',
            'title': 'CONNECT PAIRS,\nSOLVE THE PUZZLE',
            'sub': 'Link matching numbers without crossing lines to cover the entire board.',
            'bullets': [
                'Handcrafted logic grids from 5x5 to 10x10',
                'Intuitive smooth drag-to-draw path controls',
                'Smart auto-snapping & helpful hint system'
            ]
        },
        {
            'name': 'screenshot_2_home_1920x1080.png',
            'screen': 'home',
            'badge': 'NEW LOOK & FEEL',
            'title': 'MINIMAL CYBER\nDARK AESTHETICS',
            'sub': 'A soothing, distraction-free environment tailored for deep focus.',
            'bullets': [
                'Vibrant neon visuals & tailored dark contrast',
                'Smooth haptics & satisfying sound effects',
                'Play anywhere, anytime — 100% offline ready'
            ]
        },
        {
            'name': 'screenshot_3_spin_1920x1080.png',
            'screen': 'spin',
            'badge': 'DAILY BONUSES',
            'title': 'DAILY SPINS &\nLUCKY PRIZES',
            'sub': 'Spin the fortune wheel every single day to unlock coins and hints.',
            'bullets': [
                'Free daily spins with guaranteed rewards',
                'Collect coins to purchase power-up bundles',
                'Keep your daily streak alive for bonus multipliers'
            ]
        },
        {
            'name': 'screenshot_4_profile_1920x1080.png',
            'screen': 'profile',
            'badge': 'PLAYER MILESTONES',
            'title': 'TRACK YOUR STATS\n& MASTER PUZZLES',
            'sub': 'Watch your mind grow sharper with comprehensive stats and daily quests.',
            'bullets': [
                'Rank up through XP tiers from Bronze to Master',
                'Daily logic missions & milestone achievements',
                'Customize your solver identity & avatar'
            ]
        },
        {
            'name': 'screenshot_5_shop_1920x1080.png',
            'screen': 'shop',
            'badge': 'BOOSTS & POWER-UPS',
            'title': 'COIN SHOP &\nINSTANT HINTS',
            'sub': 'Unlock free hints and bonus coins whenever you need assistance.',
            'bullets': [
                'Earn free rewards by watching optional short videos',
                'Purchase multi-hint packages with earned coins',
                'Smooth progression with no forced paywalls'
            ]
        }
    ]
    
    W, H = 1920, 1080
    screen_target_w = 450
    screen_target_h = int(screen_target_w * (884 / 472)) # ~842px
    
    for cfg in configs:
        bg = create_gradient_bg(W, H, (10, 18, 28), (5, 9, 15), center_glow_color=(24, 70, 125), glow_radius=650, glow_cy=0.5)
        draw = ImageDraw.Draw(bg)
        
        # Left Content Column (x: 120 .. 1050)
        left_x = 120
        curr_y = 110
        
        # 1. Badge
        badge_text = cfg['badge']
        bbox_b = font_badge.getbbox(badge_text)
        bw = (bbox_b[2] - bbox_b[0]) + 40
        bh = 46
        draw.rounded_rectangle([left_x, curr_y, left_x + bw, curr_y + bh], radius=23, fill=(15, 30, 48, 220), outline=(56, 189, 248, 140), width=1)
        draw.text((left_x + 20, curr_y + 9), badge_text, font=font_badge, fill=(56, 189, 248, 255))
        curr_y += 75
        
        # 2. Main Title (can be 2 lines)
        title_lines = cfg['title'].split('\n')
        for tline in title_lines:
            draw.text((left_x + 2, curr_y + 3), tline, font=font_title, fill=(0, 0, 0, 180))
            draw.text((left_x, curr_y), tline, font=font_title, fill=(255, 255, 255, 255))
            curr_y += 72
        curr_y += 15
        
        # 3. Subtitle
        draw.text((left_x + 1, curr_y + 2), cfg['sub'], font=font_sub, fill=(0, 0, 0, 140))
        draw.text((left_x, curr_y), cfg['sub'], font=font_sub, fill=(148, 163, 184, 255))
        curr_y += 75
        
        # 4. Feature Bullets
        for btext in cfg['bullets']:
            # Glowing dot
            draw.ellipse([left_x, curr_y + 8, left_x + 16, curr_y + 24], fill=(56, 189, 248, 255))
            draw.ellipse([left_x - 3, curr_y + 5, left_x + 19, curr_y + 27], outline=(56, 189, 248, 80), width=2)
            draw.text((left_x + 36, curr_y), btext, font=font_bullet, fill=(241, 245, 249, 255))
            curr_y += 54
        
        curr_y += 28
        # 5. Rating bar with drawn gold stars
        draw.rounded_rectangle([left_x, curr_y, left_x + 400, curr_y + 46], radius=12, fill=(18, 30, 46, 200), outline=(56, 189, 248, 70), width=1)
        # Draw 5 gold stars
        for si in range(5):
            sx = left_x + 22 + si * 22
            sy = curr_y + 23
            draw_star(draw, sx, sy, 8, 4, fill=(251, 191, 36, 255))
        draw.text((left_x + 140, curr_y + 10), 'Rated 4.9 by Solvers', font=font_tag, fill=(251, 191, 36, 255))
        
        # Right Column: Phone Mockup
        raw_screen = get_clean_screenshot(cfg['screen'])
        mockup_img, pad = draw_device_mockup(raw_screen, screen_target_w, screen_target_h)
        
        mockup_x = 1240 - pad
        mockup_y = (H - (mockup_img.height - pad * 2)) // 2 - pad
        bg.paste(mockup_img, (mockup_x, mockup_y), mockup_img)
        
        out_path = os.path.join(LANDSCAPE_DIR, cfg['name'])
        bg.convert('RGB').save(out_path, 'PNG', quality=95)
        print(f'  Saved landscape: {out_path}')

# ─────────────────────────────────────────────────────────────────────────────
# 3. BUILD PLAY STORE FEATURE GRAPHIC BANNER (1024 x 500)
# ─────────────────────────────────────────────────────────────────────────────
def build_feature_graphic():
    print('Generating Play Store Feature Graphic Banner (1024 x 500)...')
    
    W, H = 1024, 500
    bg = create_gradient_bg(W, H, (9, 16, 26), (5, 8, 14), center_glow_color=(28, 75, 135), glow_radius=420, glow_cy=0.5)
    draw = ImageDraw.Draw(bg)
    
    font_badge = get_font('segoeuib.ttf', 15)
    font_title = get_font('segoeuib.ttf', 44)
    font_title_alt = get_font('segoeuib.ttf', 44)
    font_sub = get_font('segoeui.ttf', 20)
    font_pill = get_font('segoeuib.ttf', 16)
    
    # Left Content
    left_x = 60
    curr_y = 55
    
    # 1. Official Badge with Star
    badge_text = 'OFFICIAL GOOGLE PLAY RELEASE'
    bbox_b = font_badge.getbbox(badge_text)
    bw = (bbox_b[2] - bbox_b[0]) + 60
    bh = 34
    draw.rounded_rectangle([left_x, curr_y, left_x + bw, curr_y + bh], radius=17, fill=(15, 32, 52, 230), outline=(56, 189, 248, 140), width=1)
    draw_star(draw, left_x + 18, curr_y + 17, 6, 3, fill=(251, 191, 36, 255))
    draw.text((left_x + 32, curr_y + 7), badge_text, font=font_badge, fill=(56, 189, 248, 255))
    draw_star(draw, left_x + bw - 18, curr_y + 17, 6, 3, fill=(251, 191, 36, 255))
    curr_y += 50
    
    # 2. App Icon + Title Row
    icon_path = os.path.join(BASE_DIR, 'play_store_512.png')
    if os.path.exists(icon_path):
        icon_img = Image.open(icon_path).convert('RGBA').resize((104, 104), Image.Resampling.LANCZOS)
        # Rounded icon mask
        imask = Image.new('L', (104, 104), 0)
        idraw = ImageDraw.Draw(imask)
        idraw.rounded_rectangle([0, 0, 104, 104], radius=24, fill=255)
        
        # Glow around icon
        iglow = Image.new('RGBA', (130, 130), (0, 0, 0, 0))
        igdraw = ImageDraw.Draw(iglow)
        igdraw.rounded_rectangle([13, 13, 117, 117], radius=28, fill=(56, 189, 248, 80))
        iglow = iglow.filter(ImageFilter.GaussianBlur(10))
        bg.paste(iglow, (left_x - 13, curr_y - 13), iglow)
        
        bg.paste(icon_img, (left_x, curr_y), imask)
        text_x = left_x + 120
    else:
        text_x = left_x

    # Main Title
    draw.text((text_x + 2, curr_y + 2), 'NUMBER LINK', font=font_title, fill=(0, 0, 0, 180))
    draw.text((text_x, curr_y), 'NUMBER LINK', font=font_title, fill=(255, 255, 255, 255))
    
    draw.text((text_x + 2, curr_y + 50), 'PUZZLE', font=font_title_alt, fill=(0, 0, 0, 180))
    draw.text((text_x, curr_y + 48), 'PUZZLE', font=font_title_alt, fill=(56, 189, 248, 255))
    
    curr_y += 122
    
    # 3. Subtitle
    sub_text = 'Connect Matching Pairs • Fill The Entire Grid'
    draw.text((left_x, curr_y), sub_text, font=font_sub, fill=(148, 163, 184, 255))
    curr_y += 46
    
    # 4. Feature Pills
    pills = ['100% Free', 'Offline Play', 'Daily Rewards', 'Brain Workout']
    px = left_x
    for ptext in pills:
        bbox_p = font_pill.getbbox(ptext)
        pw = (bbox_p[2] - bbox_p[0]) + 24
        ph = 34
        draw.rounded_rectangle([px, curr_y, px + pw, curr_y + ph], radius=9, fill=(18, 28, 42, 220), outline=(56, 189, 248, 90), width=1)
        draw.text((px + 12, curr_y + 7), ptext, font=font_pill, fill=(226, 232, 240, 255))
        px += pw + 10
        
    # Right Side: Showcase Device Mockup (Gameplay)
    raw_game = get_clean_screenshot('game')
    target_w = 230
    target_h = int(target_w * (884 / 472)) # ~430px
    mockup_img, pad = draw_device_mockup(raw_game, target_w, target_h, corner_r=26)
    
    mockup_x = 690 - pad
    mockup_y = (H - (mockup_img.height - pad * 2)) // 2 - pad
    bg.paste(mockup_img, (mockup_x, mockup_y), mockup_img)
    
    # Save Banner
    out_banner_1 = os.path.join(BANNER_DIR, 'play_store_feature_graphic_1024x500.png')
    out_banner_2 = os.path.join(BASE_DIR, 'play_store_feature_graphic_1024x500.png')
    final_banner = bg.convert('RGB')
    final_banner.save(out_banner_1, 'PNG', quality=95)
    final_banner.save(out_banner_2, 'PNG', quality=95)
    print(f'  Saved banner: {out_banner_1}')
    print(f'  Saved banner copy to root: {out_banner_2}')

def main():
    print('Starting full Play Store marketing assets generation...')
    build_portrait_screenshots()
    build_landscape_screenshots()
    build_feature_graphic()
    print('ALL PLAY STORE ASSETS GENERATED SUCCESSFULLY!')

if __name__ == '__main__':
    main()
