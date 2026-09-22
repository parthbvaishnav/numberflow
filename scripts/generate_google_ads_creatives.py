import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = r'd:\PC\RN\numberflow'
UPLOADED_DIR = r'C:\Users\Parth\.gemini\antigravity-ide\brain\74ac4e83-410d-4ed5-a5d1-694d76f560b7\.user_uploaded'
OUT_DIR = os.path.join(BASE_DIR, 'google-ads', 'images')
os.makedirs(OUT_DIR, exist_ok=True)

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

import json

with open(os.path.join(BASE_DIR, 'scripts', 'levels_data.json'), 'r') as f:
    LEVELS_DATA = json.load(f)

THEMES_DATA = {
    'default': {'bg': (15, 25, 35), 'surface': (22, 33, 43), 'surfaceRaised': (28, 45, 58), 'border': (42, 58, 74), 'primary': (77, 169, 255), 'primaryLight': (142, 203, 255), 'glow': (77, 169, 255, 90), 'text': (255, 255, 255), 'muted': (143, 163, 184)},
    'neon': {'bg': (10, 10, 10), 'surface': (20, 20, 20), 'surfaceRaised': (30, 30, 30), 'border': (42, 42, 42), 'primary': (0, 255, 136), 'primaryLight': (57, 255, 20), 'glow': (0, 255, 136, 90), 'text': (255, 255, 255), 'muted': (136, 136, 136)},
    'ocean': {'bg': (2, 27, 43), 'surface': (3, 45, 68), 'surfaceRaised': (5, 64, 96), 'border': (26, 82, 118), 'primary': (0, 180, 216), 'primaryLight': (72, 202, 228), 'glow': (0, 180, 216, 90), 'text': (224, 247, 255), 'muted': (127, 179, 200)},
    'purple': {'bg': (26, 5, 53), 'surface': (42, 13, 77), 'surfaceRaised': (59, 20, 105), 'border': (88, 28, 135), 'primary': (147, 51, 234), 'primaryLight': (192, 132, 252), 'glow': (147, 51, 234, 90), 'text': (243, 232, 255), 'muted': (216, 180, 254)},
    'dark': {'bg': (5, 5, 5), 'surface': (15, 15, 15), 'surfaceRaised': (26, 26, 26), 'border': (38, 38, 38), 'primary': (255, 255, 255), 'primaryLight': (204, 204, 204), 'glow': (255, 255, 255, 50), 'text': (255, 255, 255), 'muted': (119, 119, 119)},
}

def render_game_screen(level_num, theme_id, width=472, height=884):
    th = THEMES_DATA[theme_id]
    lv = LEVELS_DATA[str(level_num)]
    size = lv['size']
    nodes = lv['nodes']
    walls = lv['walls']
    solution = lv['solution']
    
    img = Image.new('RGBA', (width, height), th['bg'] + (255,))
    draw = ImageDraw.Draw(img)
    
    f_btn = get_font('segoeuib.ttf', 16)
    f_top = get_font('segoeui.ttf', 14)
    f_status = get_font('segoeui.ttf', 14)
    
    draw.line([(0, 52), (width, 52)], fill=th['border'] + (255,), width=1)
    draw.rounded_rectangle([14, 12, 44, 42], radius=15, fill=th['surfaceRaised'] + (255,), outline=th['border'] + (255,), width=1)
    draw.text((24, 16), '<', font=f_btn, fill=th['text'] + (255,))
    draw.text((60, 18), '0:11', font=f_top, fill=th['muted'] + (255,))
    
    lvl_str = f'Level {level_num}'
    lbox = f_btn.getbbox(lvl_str)
    lw = lbox[2] - lbox[0] + 20
    lx = (width - lw) // 2
    draw.rounded_rectangle([lx, 14, lx + lw, 42], radius=14, fill=th['surfaceRaised'] + (255,), outline=th['border'] + (255,), width=1)
    draw.text((lx + 10, 18), lvl_str, font=f_btn, fill=th['text'] + (255,))
    
    draw.rounded_rectangle([width - 86, 14, width - 14, 42], radius=14, fill=th['surfaceRaised'] + (255,), outline=th['border'] + (255,), width=1)
    draw.text((width - 76, 18), '+175', font=f_top, fill=(251, 191, 36, 255))
    
    board_w = 400
    bx = (width - board_w) // 2
    by = 140
    cell = board_w / size
    draw.rounded_rectangle([bx - 8, by - 8, bx + board_w + 8, by + board_w + 8], radius=20, fill=th['surface'] + (255,), outline=th['border'] + (255,), width=2)
    
    for i in range(size + 1):
        draw.line([(bx, by + i * cell), (bx + board_w, by + i * cell)], fill=th['border'] + (255,), width=1)
        draw.line([(bx + i * cell, by), (bx + i * cell, by + board_w)], fill=th['border'] + (255,), width=1)
        
    n_vis = max(1, int(len(solution) * 0.70))
    vis_keys = solution[:n_vis]
    
    for k in vis_keys:
        r, c = map(int, k.split(','))
        draw.rectangle([bx + c * cell + 3, by + r * cell + 3, bx + (c + 1) * cell - 3, by + (r + 1) * cell - 3], fill=th['glow'])
        
    pts = [(int(bx + int(k.split(',')[1]) * cell + cell / 2), int(by + int(k.split(',')[0]) * cell + cell / 2)) for k in vis_keys]
    if len(pts) >= 2:
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i+1]], fill=th['primaryLight'] + (110,), width=int(cell * 0.32))
            draw.line([pts[i], pts[i+1]], fill=th['primary'] + (255,), width=int(cell * 0.14))
            
    for wk in walls:
        a, b = wk.split('|')
        r1, c1 = map(int, a.split(','))
        r2, c2 = map(int, b.split(','))
        if r1 == r2:
            cc = max(c1, c2)
            wx = bx + cc * cell
            wy1 = by + r1 * cell + 4
            wy2 = by + (r1 + 1) * cell - 4
            draw.line([(wx, wy1), (wx, wy2)], fill=(255, 255, 255, 255), width=5)
        else:
            rr = max(r1, r2)
            wy = by + rr * cell
            wx1 = bx + c1 * cell + 4
            wx2 = bx + (c1 + 1) * cell - 4
            draw.line([(wx1, wy), (wx2, wy)], fill=(255, 255, 255, 255), width=5)
            
    f_node = get_font('segoeuib.ttf', int(cell * 0.38))
    for n in nodes:
        cx = int(bx + n['c'] * cell + cell / 2)
        cy = int(by + n['r'] * cell + cell / 2)
        nr = int(cell * 0.32)
        is_reached = f"{n['r']},{n['c']}" in vis_keys
        col_bg = th['primary'] + (255,) if is_reached else th['surfaceRaised'] + (255,)
        col_txt = (0, 0, 0, 255) if is_reached else th['text'] + (255,)
        draw.ellipse([cx - nr, cy - nr, cx + nr, cy + nr], fill=col_bg, outline=th['primary'] + (255,) if is_reached else th['border'] + (255,), width=2)
        nb = f_node.getbbox(str(n['num']))
        nw, nh = nb[2] - nb[0], nb[3] - nb[1]
        draw.text((cx - nw // 2, cy - nh // 2 - 2), str(n['num']), font=f_node, fill=col_txt)
        
    st_str = f"Next: node {nodes[-1]['num']}  •  {n_vis}/{len(solution)} cells filled"
    sb = f_status.getbbox(st_str)
    sw = sb[2] - sb[0]
    draw.text(((width - sw) // 2, by + board_w + 30), st_str, font=f_status, fill=th['muted'] + (255,))
    
    by_bar = height - 85
    draw.line([(0, by_bar), (width, by_bar)], fill=th['border'] + (255,), width=1)
    draw.rounded_rectangle([20, by_bar + 18, 64, by_bar + 62], radius=22, fill=th['surfaceRaised'] + (255,), outline=th['border'] + (255,), width=1)
    draw.text((34, by_bar + 28), 'O', font=f_btn, fill=th['text'] + (255,))
    
    draw.rounded_rectangle([80, by_bar + 18, width - 90, by_bar + 62], radius=22, fill=th['primary'] + (255,))
    draw.text((width // 2 - 28, by_bar + 28), 'Hint 4', font=f_btn, fill=(0, 0, 0, 255))
    
    draw.rounded_rectangle([width - 74, by_bar + 18, width - 18, by_bar + 62], radius=22, fill=th['surfaceRaised'] + (255,), outline=th['border'] + (255,), width=1)
    draw.text((width - 60, by_bar + 28), 'Skip', font=f_top, fill=th['muted'] + (255,))
    
    return img

def get_clean_screenshot(key):
    fname = MAPPING[key]
    path = os.path.join(UPLOADED_DIR, fname)
    with Image.open(path) as img:
        img = img.convert('RGBA')
        cropped = img.crop((0, 54, 472, 938))
        return cropped


def create_gradient_bg(width, height, top_color=(7, 13, 22), bottom_color=(3, 6, 12), center_glow_color=(18, 55, 105), glow_radius=450, glow_cx=0.5, glow_cy=0.45):
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
        
    if center_glow_color and glow_radius > 0:
        glow_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_layer)
        cx, cy = int(width * glow_cx), int(height * glow_cy)
        gr, gg, gb = center_glow_color[:3]
        for rad in range(glow_radius, 0, -12):
            alpha = int(45 * (1 - rad / glow_radius))
            gdraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(gr, gg, gb, alpha))
        base = Image.alpha_composite(base, glow_layer)
        
    # Add subtle puzzle network background pattern
    pat_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pat_layer)
    nodes = [
        (int(width * 0.08), int(height * 0.12)),
        (int(width * 0.92), int(height * 0.15)),
        (int(width * 0.06), int(height * 0.88)),
        (int(width * 0.94), int(height * 0.82)),
    ]
    for nx, ny in nodes:
        pdraw.ellipse([nx - 12, ny - 12, nx + 12, ny + 12], fill=(56, 189, 248, 14), outline=(56, 189, 248, 40), width=1)
        pdraw.ellipse([nx - 3, ny - 3, nx + 3, ny + 3], fill=(56, 189, 248, 80))
        
    base = Image.alpha_composite(base, pat_layer)
    return base

def draw_device_mockup(screen_img, screen_w, screen_h, corner_r=34):
    bezel = 14
    outer_w = screen_w + bezel * 2
    outer_h = screen_h + bezel * 2
    
    resized_screen = screen_img.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
    
    screen_mask = Image.new('L', (screen_w, screen_h), 0)
    sdraw = ImageDraw.Draw(screen_mask)
    sdraw.rounded_rectangle([0, 0, screen_w, screen_h], radius=corner_r - 6, fill=255)
    
    device_img = Image.new('RGBA', (outer_w, outer_h), (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(device_img)
    
    # Outer chassis
    ddraw.rounded_rectangle([0, 0, outer_w, outer_h], radius=corner_r, fill=(16, 23, 33, 255), outline=(56, 189, 248, 120), width=2)
    # Inner border
    ddraw.rounded_rectangle([bezel - 1, bezel - 1, outer_w - bezel + 1, outer_h - bezel + 1], radius=corner_r - 4, outline=(15, 23, 42, 220), width=2)
    
    # Screen paste
    device_img.paste(resized_screen, (bezel, bezel), screen_mask)
    
    # Top dynamic notch
    notch_w = int(outer_w * 0.22)
    notch_h = 9
    notch_x = (outer_w - notch_w) // 2
    notch_y = bezel // 2
    ddraw.rounded_rectangle([notch_x, notch_y, notch_x + notch_w, notch_y + notch_h], radius=4, fill=(6, 10, 16, 245))
    ddraw.ellipse([notch_x + notch_w - 18, notch_y + 1, notch_x + notch_w - 13, notch_y + 6], fill=(30, 48, 70, 255))
    
    # Drop shadow
    pad = 50
    canvas_w = outer_w + pad * 2
    canvas_h = outer_h + pad * 2
    shadow_layer = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    sdraw2 = ImageDraw.Draw(shadow_layer)
    sdraw2.rounded_rectangle([pad, pad + 15, pad + outer_w, pad + outer_h + 15], radius=corner_r + 4, fill=(0, 0, 0, 175))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(25))
    
    shadow_layer.paste(device_img, (pad, pad), device_img)
    return shadow_layer, pad

def draw_cta_button(draw, x, y, w, h, text, font, bg_color=(14, 165, 233), text_color=(255, 255, 255)):
    # Button rounded rect with glow
    draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=bg_color, outline=(255, 255, 255, 120), width=2)
    # Button text centered
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = x + (w - tw) // 2
    ty = y + (h - th) // 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=text_color)

# ─────────────────────────────────────────────────────────────────────────────
# 1. GENERATE LANDSCAPE 1.91:1 (1200 x 628)
# ─────────────────────────────────────────────────────────────────────────────
def generate_landscape_1200x628():
    print("Rendering 1.91:1 Landscape (1200 x 628)...")
    w, h = 1200, 628
    
    # Variant 1: The Challenge Hook ("CAN YOU LINK #4?")
    base1 = create_gradient_bg(w, h, (9, 16, 28), (4, 7, 14), (20, 65, 120), 450, 0.75, 0.5)
    draw1 = ImageDraw.Draw(base1)
    
    # Right side: Device Mockup with Level 6 (Near-Miss Hook)
    game_screen1 = render_game_screen(6, 'default')
    mockup1, pad1 = draw_device_mockup(game_screen1, 260, 564, corner_r=30)
    base1.paste(mockup1, (840 - pad1, 32 - pad1), mockup1)

    
    # Left side: Copy & Hooks
    f_badge = get_font('segoeuib.ttf', 20)
    f_h1 = get_font('segoeuib.ttf', 50)
    f_sub = get_font('segoeui.ttf', 26)
    f_stat = get_font('segoeuib.ttf', 22)
    f_cta = get_font('segoeuib.ttf', 26)
    
    # Badge
    b_text = "⚡ BRAIN PUZZLE CHALLENGE"
    b_box = f_badge.getbbox(b_text)
    bw, bh = b_box[2] - b_box[0] + 32, b_box[3] - b_box[1] + 16
    draw1.rounded_rectangle([70, 75, 70 + bw, 75 + bh], radius=bh // 2, fill=(14, 165, 233, 35), outline=(56, 189, 248, 140), width=1)
    draw1.text((70 + 16, 75 + 7), b_text, font=f_badge, fill=(56, 189, 248))
    
    # Main Headline
    draw1.text((70, 140), "CAN YOU LINK #4?", font=f_h1, fill=(255, 255, 255))
    
    # Subtitle
    draw1.text((70, 208), "Connect matching numbers without crossing paths.\n95% of players get stuck on this level!", font=f_sub, fill=(148, 163, 184))
    
    # Rating Stars & Proof
    star_x = 70
    for i in range(5):
        draw_star(draw1, star_x + i * 28 + 10, 315, 10, 5, fill=(250, 204, 21))
    draw1.text((70 + 5 * 28 + 20, 303), "Rated 4.9 by Solvers  •  1,000+ Logic Grids", font=f_stat, fill=(241, 245, 249))
    
    # Offline & free bullets
    draw1.ellipse([72, 362, 84, 374], fill=(56, 189, 248))
    draw1.text((95, 356), "100% Offline Ready  •  Zero Stress Timers", font=f_stat, fill=(203, 213, 225))
    
    # CTA Button
    draw_cta_button(draw1, 70, 425, 290, 68, "PLAY FREE NOW ▶", f_cta, bg_color=(14, 165, 233))
    
    p1 = os.path.join(OUT_DIR, 'ad_landscape_1200x628_01_challenge.png')
    base1.save(p1, 'PNG', optimize=True)
    
    # Variant 2: Relaxing Zen / Pure Logic with Level 9 (Mystic Purple Theme)
    base2 = create_gradient_bg(w, h, (18, 5, 36), (4, 1, 10), (70, 20, 110), 450, 0.75, 0.5)
    draw2 = ImageDraw.Draw(base2)
    game_screen2 = render_game_screen(9, 'purple')
    mockup2, pad2 = draw_device_mockup(game_screen2, 260, 564, corner_r=30)
    base2.paste(mockup2, (840 - pad2, 32 - pad2), mockup2)

    
    b_text2 = "PURE LOGIC • ZERO PRESSURE"
    b_box2 = f_badge.getbbox(b_text2)
    bw2, bh2 = b_box2[2] - b_box2[0] + 32, b_box2[3] - b_box2[1] + 16
    draw2.rounded_rectangle([70, 75, 70 + bw2, 75 + bh2], radius=bh2 // 2, fill=(34, 197, 94, 35), outline=(74, 222, 128, 140), width=1)
    draw2.text((70 + 16, 75 + 7), b_text2, font=f_badge, fill=(74, 222, 128))
    
    draw2.text((70, 140), "RELAX & CONNECT", font=f_h1, fill=(255, 255, 255))
    draw2.text((70, 208), "Immerse yourself in clean minimal cyber aesthetics.\nSmooth haptics and satisfying glowing paths.", font=f_sub, fill=(148, 163, 184))
    
    for i in range(5):
        draw_star(draw2, star_x + i * 28 + 10, 315, 10, 5, fill=(250, 204, 21))
    draw2.text((70 + 5 * 28 + 20, 303), "Number Link Puzzle  •  Free Download", font=f_stat, fill=(241, 245, 249))
    
    draw2.ellipse([72, 362, 84, 374], fill=(74, 222, 128))
    draw2.text((95, 356), "No Timers  •  Daily Spin Rewards  •  Hints Available", font=f_stat, fill=(203, 213, 225))
    
    draw_cta_button(draw2, 70, 425, 290, 68, "INSTALL FREE ▶", f_cta, bg_color=(2, 132, 199))
    
    p2 = os.path.join(OUT_DIR, 'ad_landscape_1200x628_02_relax.png')
    base2.save(p2, 'PNG', optimize=True)

# ─────────────────────────────────────────────────────────────────────────────
# 2. GENERATE SQUARE 1:1 (1200 x 1200)
# ─────────────────────────────────────────────────────────────────────────────
def generate_square_1200x1200():
    print("Rendering 1:1 Square (1200 x 1200)...")
    w, h = 1200, 1200
    
    f_badge = get_font('segoeuib.ttf', 24)
    f_h1 = get_font('segoeuib.ttf', 56)
    f_sub = get_font('segoeui.ttf', 28)
    f_cta = get_font('segoeuib.ttf', 32)
    
    game_screen = get_clean_screenshot('game')
    
    # Variant 1: Hero Gameplay Showcase with Level 7 (Neon Pulse Theme)
    base1 = create_gradient_bg(w, h, (8, 20, 15), (2, 8, 5), (10, 90, 50), 550, 0.5, 0.55)
    draw1 = ImageDraw.Draw(base1)
    
    # Top Header
    b_text = "NEON LOGIC PUZZLE"
    b_box = f_badge.getbbox(b_text)
    bw, bh = b_box[2] - b_box[0] + 36, b_box[3] - b_box[1] + 18
    bx = (w - bw) // 2
    draw1.rounded_rectangle([bx, 50, bx + bw, 50 + bh], radius=bh // 2, fill=(0, 255, 136, 35), outline=(0, 255, 136, 140), width=1)
    draw1.text((bx + 18, 50 + 8), b_text, font=f_badge, fill=(0, 255, 136))
    
    t_box = f_h1.getbbox("NUMBER LINK PUZZLE")
    tw = t_box[2] - t_box[0]
    draw1.text(((w - tw) // 2, 115), "NUMBER LINK PUZZLE", font=f_h1, fill=(255, 255, 255))
    
    s_box = f_sub.getbbox("Connect 5 Nodes • Electric Rhythmic Flow")
    sw = s_box[2] - s_box[0]
    draw1.text(((w - sw) // 2, 185), "Connect 5 Nodes • Electric Rhythmic Flow", font=f_sub, fill=(148, 163, 184))
    
    # Center Mockup (Level 7 Neon)
    game_screen1 = render_game_screen(7, 'neon')
    mockup1, pad1 = draw_device_mockup(game_screen1, 380, 824, corner_r=38)
    base1.paste(mockup1, ((w - 380) // 2 - pad1, 240 - pad1), mockup1)
    
    # Bottom CTA Overlay
    draw_cta_button(draw1, (w - 420) // 2, 1085, 420, 76, "INSTALL FREE NOW ▶", f_cta, bg_color=(0, 255, 136), text_color=(0, 0, 0))

    
    p1 = os.path.join(OUT_DIR, 'ad_square_1200x1200_01_gameplay.png')
    base1.save(p1, 'PNG', optimize=True)
    
    # Variant 2: IQ Challenge Hook with Level 15 (7 Nodes, Pure Dark Theme)
    base2 = create_gradient_bg(w, h, (10, 14, 26), (3, 5, 10), (28, 60, 120), 550, 0.5, 0.55)
    draw2 = ImageDraw.Draw(base2)
    
    b_text2 = "🧠 BRAIN IQ CHALLENGE"
    b_box2 = f_badge.getbbox(b_text2)
    bw2, bh2 = b_box2[2] - b_box2[0] + 36, b_box2[3] - b_box2[1] + 18
    bx2 = (w - bw2) // 2
    draw2.rounded_rectangle([bx2, 50, bx2 + bw2, 50 + bh2], radius=bh2 // 2, fill=(239, 68, 68, 35), outline=(248, 113, 113, 140), width=1)
    draw2.text((bx2 + 18, 50 + 8), b_text2, font=f_badge, fill=(248, 113, 113))
    
    t_box2 = f_h1.getbbox("LEVEL 15 (7 NODES)")
    tw2 = t_box2[2] - t_box2[0]
    draw2.text(((w - tw2) // 2, 115), "LEVEL 15 (7 NODES)", font=f_h1, fill=(255, 255, 255))
    
    s_box2 = f_sub.getbbox("Only 1% Of Solvers Can Link All 7 Nodes!")
    sw2 = s_box2[2] - s_box2[0]
    draw2.text(((w - sw2) // 2, 185), "Only 1% Of Solvers Can Link All 7 Nodes!", font=f_sub, fill=(251, 191, 36))
    
    game_screen2 = render_game_screen(15, 'dark')
    mockup2, pad2 = draw_device_mockup(game_screen2, 380, 824, corner_r=38)
    base2.paste(mockup2, ((w - 380) // 2 - pad2, 240 - pad2), mockup2)
    draw_cta_button(draw2, (w - 420) // 2, 1085, 420, 76, "TEST YOUR BRAIN ▶", f_cta, bg_color=(220, 38, 38))

    
    p2 = os.path.join(OUT_DIR, 'ad_square_1200x1200_02_iq_hook.png')
    base2.save(p2, 'PNG', optimize=True)

# ─────────────────────────────────────────────────────────────────────────────
# 3. GENERATE TALL PORTRAIT 9:16 (1080 x 1920)
# ─────────────────────────────────────────────────────────────────────────────
def generate_tall_portrait_1080x1920():
    print("Rendering 9:16 Tall Portrait (1080 x 1920)...")
    w, h = 1080, 1920
    
    f_badge = get_font('segoeuib.ttf', 24)
    f_h1 = get_font('segoeuib.ttf', 62)
    f_sub = get_font('segoeui.ttf', 32)
    f_cta = get_font('segoeuib.ttf', 36)
    f_proof = get_font('segoeuib.ttf', 26)
    
    game_screen = get_clean_screenshot('game')
    
    # Variant 1: Hero Clean Gameplay with Level 6 (Classic Dark)
    base1 = create_gradient_bg(w, h, (9, 16, 28), (3, 6, 12), (20, 65, 120), 600, 0.5, 0.5)
    draw1 = ImageDraw.Draw(base1)
    
    b_text = "CONNECT MATCHING NUMBERS"
    b_box = f_badge.getbbox(b_text)
    bw, bh = b_box[2] - b_box[0] + 40, b_box[3] - b_box[1] + 20
    bx = (w - bw) // 2
    draw1.rounded_rectangle([bx, 90, bx + bw, 90 + bh], radius=bh // 2, fill=(14, 165, 233, 35), outline=(56, 189, 248, 140), width=1)
    draw1.text((bx + 20, 90 + 9), b_text, font=f_badge, fill=(56, 189, 248))
    
    t_box = f_h1.getbbox("NUMBER LINK PUZZLE")
    tw = t_box[2] - t_box[0]
    draw1.text(((w - tw) // 2, 165), "NUMBER LINK PUZZLE", font=f_h1, fill=(255, 255, 255))
    
    s_box = f_sub.getbbox("Draw Smooth Paths • Fill The Entire Board")
    sw = s_box[2] - s_box[0]
    draw1.text(((w - sw) // 2, 245), "Draw Smooth Paths • Fill The Entire Board", font=f_sub, fill=(148, 163, 184))
    
    game_screen1 = render_game_screen(6, 'default')
    mockup1, pad1 = draw_device_mockup(game_screen1, 460, 998, corner_r=44)
    base1.paste(mockup1, ((w - 460) // 2 - pad1, 320 - pad1), mockup1)
    
    # Social proof & Rating
    star_x = (w - (5 * 32 + 230)) // 2
    for i in range(5):
        draw_star(draw1, star_x + i * 32 + 12, 1635, 11, 6, fill=(250, 204, 21))
    draw1.text((star_x + 5 * 32 + 20, 1621), "Rated 4.9 by Solvers", font=f_proof, fill=(241, 245, 249))
    
    draw_cta_button(draw1, (w - 480) // 2, 1690, 480, 86, "INSTALL FREE NOW ▶", f_cta, bg_color=(14, 165, 233))
    
    p1 = os.path.join(OUT_DIR, 'ad_portrait_1080x1920_01_hero.png')
    base1.save(p1, 'PNG', optimize=True)
    
    # Variant 2: Level 1 (Starter) vs Level 20 (Master) Progression
    base2 = create_gradient_bg(w, h, (10, 14, 26), (3, 6, 12), (24, 60, 110), 600, 0.5, 0.5)
    draw2 = ImageDraw.Draw(base2)
    
    b_text2 = "LEVEL 1 STARTER  vs  LEVEL 20 MASTER"
    b_box2 = f_badge.getbbox(b_text2)
    bw2, bh2 = b_box2[2] - b_box2[0] + 40, b_box2[3] - b_box2[1] + 20
    bx2 = (w - bw2) // 2
    draw2.rounded_rectangle([bx2, 90, bx2 + bw2, 90 + bh2], radius=bh2 // 2, fill=(245, 158, 11, 35), outline=(251, 191, 36, 140), width=1)
    draw2.text((bx2 + 20, 90 + 9), b_text2, font=f_badge, fill=(251, 191, 36))
    
    t_box2 = f_h1.getbbox("1,000+ LOGIC LEVELS")
    tw2 = t_box2[2] - t_box2[0]
    draw2.text(((w - tw2) // 2, 165), "1,000+ LOGIC LEVELS", font=f_h1, fill=(255, 255, 255))
    
    s_box2 = f_sub.getbbox("From Quick 5x5 to Expert 7-Node Grids")
    sw2 = s_box2[2] - s_box2[0]
    draw2.text(((w - sw2) // 2, 245), "From Quick 5x5 to Expert 7-Node Grids", font=f_sub, fill=(148, 163, 184))
    
    game_screen2 = render_game_screen(20, 'dark')
    mockup2, pad2 = draw_device_mockup(game_screen2, 460, 998, corner_r=44)
    base2.paste(mockup2, ((w - 460) // 2 - pad2, 320 - pad2), mockup2)
    
    # Feature pill below
    draw2.text(((w - 440) // 2, 1621), "100% Offline  •  Zero Stress Timers", font=f_proof, fill=(56, 189, 248))
    draw_cta_button(draw2, (w - 480) // 2, 1690, 480, 86, "PLAY FREE ON GOOGLE PLAY ▶", f_cta, bg_color=(2, 132, 199))

    
    p2 = os.path.join(OUT_DIR, 'ad_portrait_1080x1920_02_progression.png')
    base2.save(p2, 'PNG', optimize=True)

# ─────────────────────────────────────────────────────────────────────────────
# 4. GENERATE 4:5 PORTRAIT (1200 x 1500)
# ─────────────────────────────────────────────────────────────────────────────
def generate_portrait_1200x1500():
    print("Rendering 4:5 Portrait (1200 x 1500)...")
    w, h = 1200, 1500
    
    f_badge = get_font('segoeuib.ttf', 24)
    f_h1 = get_font('segoeuib.ttf', 60)
    f_sub = get_font('segoeui.ttf', 30)
    f_cta = get_font('segoeuib.ttf', 34)
    
    game_screen = get_clean_screenshot('game')
    
    # Variant 1: Satisfying Path with Level 7 (Neon Pulse Theme)
    base1 = create_gradient_bg(w, h, (8, 20, 15), (2, 8, 5), (10, 85, 45), 600, 0.5, 0.55)
    draw1 = ImageDraw.Draw(base1)
    
    b_text = "NEON LOGIC PUZZLE"
    b_box = f_badge.getbbox(b_text)
    bw, bh = b_box[2] - b_box[0] + 36, b_box[3] - b_box[1] + 18
    bx = (w - bw) // 2
    draw1.rounded_rectangle([bx, 60, bx + bw, 60 + bh], radius=bh // 2, fill=(0, 255, 136, 35), outline=(0, 255, 136, 140), width=1)
    draw1.text((bx + 18, 60 + 8), b_text, font=f_badge, fill=(0, 255, 136))
    
    t_box = f_h1.getbbox("SATISFYING NUMBER LINK")
    tw = t_box[2] - t_box[0]
    draw1.text(((w - tw) // 2, 130), "SATISFYING NUMBER LINK", font=f_h1, fill=(255, 255, 255))
    
    s_box = f_sub.getbbox("Connect 5 Nodes Across The Grid")
    sw = s_box[2] - s_box[0]
    draw1.text(((w - sw) // 2, 205), "Connect 5 Nodes Across The Grid", font=f_sub, fill=(148, 163, 184))
    
    game_screen1 = render_game_screen(7, 'neon')
    mockup1, pad1 = draw_device_mockup(game_screen1, 420, 910, corner_r=40)
    base1.paste(mockup1, ((w - 420) // 2 - pad1, 275 - pad1), mockup1)
    
    draw_cta_button(draw1, (w - 440) // 2, 1340, 440, 80, "INSTALL FREE ▶", f_cta, bg_color=(0, 255, 136), text_color=(0, 0, 0))
    
    p1 = os.path.join(OUT_DIR, 'ad_portrait_1200x1500_01_satisfying.png')
    base1.save(p1, 'PNG', optimize=True)
    
    # Variant 2: Daily Brain Workout with Level 13 (Deep Ocean Theme, 7 Nodes)
    base2 = create_gradient_bg(w, h, (4, 25, 42), (2, 12, 22), (0, 100, 150), 600, 0.5, 0.55)
    draw2 = ImageDraw.Draw(base2)
    
    b_text2 = "DEEP OCEAN LOGIC • 7 NODES"
    b_box2 = f_badge.getbbox(b_text2)
    bw2, bh2 = b_box2[2] - b_box2[0] + 36, b_box2[3] - b_box2[1] + 18
    bx2 = (w - bw2) // 2
    draw2.rounded_rectangle([bx2, 60, bx2 + bw2, 60 + bh2], radius=bh2 // 2, fill=(0, 180, 216, 35), outline=(72, 202, 228, 140), width=1)
    draw2.text((bx2 + 18, 60 + 8), b_text2, font=f_badge, fill=(72, 202, 228))
    
    t_box2 = f_h1.getbbox("SHARPEN YOUR MIND")
    tw2 = t_box2[2] - t_box2[0]
    draw2.text(((w - tw2) // 2, 130), "SHARPEN YOUR MIND", font=f_h1, fill=(255, 255, 255))
    
    s_box2 = f_sub.getbbox("Zero Timers • 100% Offline Brain Training")
    sw2 = s_box2[2] - s_box2[0]
    draw2.text(((w - sw2) // 2, 205), "Zero Timers • 100% Offline Brain Training", font=f_sub, fill=(148, 163, 184))
    
    game_screen2 = render_game_screen(13, 'ocean')
    mockup2, pad2 = draw_device_mockup(game_screen2, 420, 910, corner_r=40)
    base2.paste(mockup2, ((w - 420) // 2 - pad2, 275 - pad2), mockup2)
    draw_cta_button(draw2, (w - 440) // 2, 1340, 440, 80, "PLAY FREE NOW ▶", f_cta, bg_color=(0, 180, 216))

    
    p2 = os.path.join(OUT_DIR, 'ad_portrait_1200x1500_02_brain_workout.png')
    base2.save(p2, 'PNG', optimize=True)

# ─────────────────────────────────────────────────────────────────────────────
# 5. GENERATE IN-APP DISPLAY SIZES (300 x 300 & 282 x 280)
# ─────────────────────────────────────────────────────────────────────────────
def generate_display_sizes():
    print("Rendering Display Sizes (300 x 300 & 282 x 280)...")
    
    # 300 x 300 Square Banner with Level 3 (Deep Ocean Theme)
    w1, h1 = 300, 300
    base1 = create_gradient_bg(w1, h1, (2, 27, 43), (2, 12, 22), (0, 100, 150), 160, 0.5, 0.45)
    draw1 = ImageDraw.Draw(base1)
    
    f_t = get_font('segoeuib.ttf', 17)
    f_s = get_font('segoeui.ttf', 12)
    f_c = get_font('segoeuib.ttf', 13)
    
    draw1.text((15, 12), "NUMBER LINK PUZZLE", font=f_t, fill=(255, 255, 255))
    draw1.text((15, 34), "Connect matching pairs & solve!", font=f_s, fill=(127, 179, 200))
    
    game_screen1 = render_game_screen(3, 'ocean')
    mockup1, pad1 = draw_device_mockup(game_screen1, 120, 260, corner_r=18)
    base1.paste(mockup1, ((w1 - 120) // 2 - pad1, 55 - pad1), mockup1)
    
    draw_cta_button(draw1, 40, 252, 220, 36, "PLAY FREE ▶", f_c, bg_color=(0, 180, 216))
    
    p1 = os.path.join(OUT_DIR, 'ad_banner_300x300.png')
    base1.save(p1, 'PNG', optimize=True)
    
    # 282 x 280 Interstitial Card with Level 1 (Classic Dark Theme)
    w2, h2 = 282, 280
    base2 = create_gradient_bg(w2, h2, (9, 16, 28), (4, 7, 14), (20, 65, 120), 150, 0.5, 0.45)
    draw2 = ImageDraw.Draw(base2)
    
    draw2.text((14, 12), "NUMBER LINK", font=f_t, fill=(255, 255, 255))
    draw2.text((14, 32), "Level 1 Starter Challenge", font=f_s, fill=(148, 163, 184))
    
    game_screen2 = render_game_screen(1, 'default')
    mockup2, pad2 = draw_device_mockup(game_screen2, 114, 246, corner_r=16)
    base2.paste(mockup2, ((w2 - 114) // 2 - pad2, 52 - pad2), mockup2)
    
    draw_cta_button(draw2, 35, 236, 212, 34, "INSTALL NOW ▶", f_c, bg_color=(2, 132, 199))
    
    p2 = os.path.join(OUT_DIR, 'ad_card_282x280.png')
    base2.save(p2, 'PNG', optimize=True)


if __name__ == '__main__':
    generate_landscape_1200x628()
    generate_square_1200x1200()
    generate_tall_portrait_1080x1920()
    generate_portrait_1200x1500()
    generate_display_sizes()
    print("[SUCCESS] All Google Ads image assets generated successfully!")
