import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

YOUTUBE_DIR = r"d:\PC\RN\numberflow\youtube"
os.makedirs(YOUTUBE_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. Load original logo and extract high-res transparent emblem
# -------------------------------------------------------------
logo_path = os.path.join(YOUTUBE_DIR, "logo-np-game.jpg")
orig_img = Image.open(logo_path).convert("RGB")

# Crop emblem
emblem_crop = orig_img.crop((445, 895, 726, 1122)) # approx 281 x 227
arr = np.array(emblem_crop)
brightness = np.mean(arr, axis=2)
alpha = np.clip((255.0 - brightness) * (255.0 / 235.0), 0, 255).astype(np.uint8)
emblem_trans = Image.fromarray(np.dstack([arr, alpha]), "RGBA")

# Font loading helper
def get_font(size, bold=False):
    font_paths = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# -------------------------------------------------------------
# 2. Profile Picture (Clean Studio White, 800 x 800)
# -------------------------------------------------------------
def make_profile_clean():
    size = 800
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Outer decorative rings (inside 800x800, perfectly within circle crop)
    draw.ellipse([cx - 365, cy - 365, cx + 365, cy + 365], outline=(226, 232, 240, 255), width=4)
    draw.ellipse([cx - 355, cy - 355, cx + 355, cy + 355], outline=(56, 189, 248, 140), width=3)

    # Scale emblem
    target_w = 460
    aspect = emblem_trans.height / emblem_trans.width
    target_h = int(target_w * aspect)
    scaled_emblem = emblem_trans.resize((target_w, target_h), Image.Resampling.LANCZOS)

    ex = cx - target_w // 2
    ey = cy - target_h // 2 - 28
    img.paste(scaled_emblem, (ex, ey), scaled_emblem)

    # Studio text below emblem
    font_bold = get_font(36, bold=True)
    text = "NP GAME STUDIO"
    bbox = draw.textbbox((0, 0), text, font=font_bold)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw // 2, cy + target_h // 2 + 10), text, font=font_bold, fill=(15, 23, 42, 255))

    font_sub = get_font(18, bold=True)
    sub = "LOGIC & PUZZLE GAMES"
    bbox_sub = draw.textbbox((0, 0), sub, font=font_sub)
    sw = bbox_sub[2] - bbox_sub[0]
    draw.text((cx - sw // 2, cy + target_h // 2 + 56), sub, font=font_sub, fill=(14, 165, 233, 255))

    out_path = os.path.join(YOUTUBE_DIR, "youtube_profile_clean_800x800.png")
    img.convert("RGB").save(out_path, quality=98)
    print("Saved clean profile picture:", out_path)

# -------------------------------------------------------------
# 3. Profile Picture (Dark Cyber Theme, 800 x 800)
# -------------------------------------------------------------
def make_profile_dark():
    size = 800
    img = Image.new("RGBA", (size, size), (8, 14, 26, 255)) # deep cyber dark
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Radial ambient glow behind emblem
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for rad in range(340, 40, -15):
        alpha_val = int(35 * (1.0 - rad / 340.0))
        glow_draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(56, 189, 248, alpha_val))
    for rad in range(200, 20, -10):
        alpha_val = int(50 * (1.0 - rad / 200.0))
        glow_draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(168, 85, 247, alpha_val))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Circular badges
    draw.ellipse([cx - 365, cy - 365, cx + 365, cy + 365], outline=(30, 41, 59, 255), width=3)
    draw.ellipse([cx - 355, cy - 355, cx + 355, cy + 355], outline=(56, 189, 248, 160), width=2)
    draw.ellipse([cx - 345, cy - 345, cx + 345, cy + 345], outline=(168, 85, 247, 90), width=1)

    # Invert dark body to bright white/platinum
    emblem_arr = np.array(emblem_trans)
    e_r, e_g, e_b, e_a = emblem_arr[:, :, 0], emblem_arr[:, :, 1], emblem_arr[:, :, 2], emblem_arr[:, :, 3]
    dark_mask = (e_r < 65) & (e_g < 65) & (e_b < 65) & (e_a > 30)
    emblem_arr[dark_mask, 0] = 240
    emblem_arr[dark_mask, 1] = 245
    emblem_arr[dark_mask, 2] = 255
    emblem_dark_themed = Image.fromarray(emblem_arr, "RGBA")

    target_w = 460
    aspect = emblem_dark_themed.height / emblem_dark_themed.width
    target_h = int(target_w * aspect)
    scaled_emblem = emblem_dark_themed.resize((target_w, target_h), Image.Resampling.LANCZOS)

    ex = cx - target_w // 2
    ey = cy - target_h // 2 - 28
    img.paste(scaled_emblem, (ex, ey), scaled_emblem)

    # Studio text
    font_bold = get_font(36, bold=True)
    text = "NP GAME STUDIO"
    bbox = draw.textbbox((0, 0), text, font=font_bold)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw // 2, cy + target_h // 2 + 10), text, font=font_bold, fill=(255, 255, 255, 255))

    font_sub = get_font(18, bold=True)
    sub = "LOGIC & PUZZLE GAMES"
    bbox_sub = draw.textbbox((0, 0), sub, font=font_sub)
    sw = bbox_sub[2] - bbox_sub[0]
    draw.text((cx - sw // 2, cy + target_h // 2 + 56), sub, font=font_sub, fill=(56, 189, 248, 255))

    out_path = os.path.join(YOUTUBE_DIR, "youtube_profile_dark_800x800.png")
    img.convert("RGB").save(out_path, quality=98)
    print("Saved dark profile picture:", out_path)

# -------------------------------------------------------------
# 4. Video Watermark (150 x 150 PNG)
# -------------------------------------------------------------
def make_watermark():
    size = 150
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([4, 4, size - 4, size - 4], radius=20, fill=(8, 14, 26, 235), outline=(56, 189, 248, 180), width=2)

    target_w = 100
    aspect = emblem_trans.height / emblem_trans.width
    target_h = int(target_w * aspect)

    emblem_arr = np.array(emblem_trans)
    e_r, e_g, e_b, e_a = emblem_arr[:, :, 0], emblem_arr[:, :, 1], emblem_arr[:, :, 2], emblem_arr[:, :, 3]
    dark_mask = (e_r < 65) & (e_g < 65) & (e_b < 65) & (e_a > 30)
    emblem_arr[dark_mask, 0] = 240
    emblem_arr[dark_mask, 1] = 245
    emblem_arr[dark_mask, 2] = 255
    scaled = Image.fromarray(emblem_arr, "RGBA").resize((target_w, target_h), Image.Resampling.LANCZOS)

    ex = (size - target_w) // 2
    ey = (size - target_h) // 2 - 8
    img.paste(scaled, (ex, ey), scaled)

    f = get_font(12, bold=True)
    txt = "NP GAMES"
    b = draw.textbbox((0, 0), txt, font=f)
    w = b[2] - b[0]
    draw.text(((size - w) // 2, size - 24), txt, font=f, fill=(56, 189, 248, 255))

    out_path = os.path.join(YOUTUBE_DIR, "youtube_watermark_150x150.png")
    img.save(out_path)
    print("Saved video watermark:", out_path)

# -------------------------------------------------------------
# 5. YouTube Banner (2048 x 1152) — Dark Cyber Studio Edition
# -------------------------------------------------------------
def make_banner_dark():
    W, H = 2048, 1152
    img = Image.new("RGBA", (W, H), (6, 11, 20, 255))
    draw = ImageDraw.Draw(img)

    # 1. Cyberpunk grid
    grid_spacing = 64
    for gx in range(0, W, grid_spacing):
        alpha_l = 22 if (gx % 128 == 0) else 9
        draw.line([(gx, 0), (gx, H)], fill=(30, 41, 59, alpha_l), width=1)
    for gy in range(0, H, grid_spacing):
        alpha_l = 22 if (gy % 128 == 0) else 9
        draw.line([(0, gy), (W, gy)], fill=(30, 41, 59, alpha_l), width=1)

    # 2. Ambient radial glows
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    for r in range(580, 60, -30):
        a = int(35 * (1.0 - r / 580.0))
        gdraw.ellipse([640 - r, 576 - r, 640 + r, 576 + r], fill=(14, 165, 233, a))
    for r in range(580, 60, -30):
        a = int(35 * (1.0 - r / 580.0))
        gdraw.ellipse([1400 - r, 576 - r, 1400 + r, 576 + r], fill=(147, 51, 234, a))
    for r in range(350, 40, -25):
        a = int(25 * (1.0 - r / 350.0))
        gdraw.ellipse([120 - r, 576 - r, 120 + r, 576 + r], fill=(56, 189, 248, a))
        gdraw.ellipse([1920 - r, 576 - r, 1920 + r, 576 + r], fill=(16, 185, 129, a))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # 3. Floating numbered nodes on the wings for desktop flair
    def draw_wing_node(wx, wy, num, col_tuple):
        rad = 18
        draw.ellipse([wx - rad - 6, wy - rad - 6, wx + rad + 6, wy + rad + 6], fill=(col_tuple[0], col_tuple[1], col_tuple[2], 40))
        draw.ellipse([wx - rad, wy - rad, wx + rad, wy + rad], fill=col_tuple)
        fn = get_font(15, bold=True)
        nb = draw.textbbox((0, 0), str(num), font=fn)
        draw.text((wx - (nb[2]-nb[0])//2, wy - (nb[3]-nb[1])//2 - 1), str(num), font=fn, fill=(0, 0, 0, 255))

    # Left wing nodes
    draw_wing_node(180, 520, 4, (56, 189, 248, 255))
    draw_wing_node(300, 650, 5, (168, 85, 247, 255))
    draw.line([(180, 520), (240, 520), (240, 650), (300, 650)], fill=(56, 189, 248, 90), width=4)

    # Right wing nodes
    draw_wing_node(1760, 520, 6, (16, 185, 129, 255))
    draw_wing_node(1900, 630, 7, (245, 158, 11, 255))
    draw.line([(1760, 520), (1840, 520), (1840, 630), (1900, 630)], fill=(16, 185, 129, 90), width=4)

    # Circuit connectors into central card
    circuit_lines = [
        [(80, 576), (180, 576), (240, 520)],
        [(300, 650), (370, 650), (415, 610)],
        [(1633, 560), (1700, 560), (1760, 520)],
        [(1900, 630), (1960, 630)]
    ]
    for pts in circuit_lines:
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i+1]], fill=(56, 189, 248, 70), width=3)
            draw.ellipse([pts[i][0]-4, pts[i][1]-4, pts[i][0]+4, pts[i][1]+4], fill=(56, 189, 248, 140))

    # 4. Central Safe Card
    card_x1, card_y1 = 415, 416
    card_x2, card_y2 = 1633, 736
    card_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(card_overlay)
    cdraw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24,
                            fill=(12, 19, 32, 235), outline=(56, 189, 248, 120), width=2)
    cdraw.line([(1020, card_y1 + 25), (1020, card_y2 - 25)], fill=(30, 41, 59, 220), width=2)
    img = Image.alpha_composite(img, card_overlay)
    draw = ImageDraw.Draw(img)

    # -------------------------------------------------------------
    # LEFT PANEL: NP GAME STUDIO BRANDING
    # -------------------------------------------------------------
    emblem_arr = np.array(emblem_trans)
    e_r, e_g, e_b, e_a = emblem_arr[:, :, 0], emblem_arr[:, :, 1], emblem_arr[:, :, 2], emblem_arr[:, :, 3]
    dark_mask = (e_r < 65) & (e_g < 65) & (e_b < 65) & (e_a > 30)
    emblem_arr[dark_mask, 0] = 240
    emblem_arr[dark_mask, 1] = 245
    emblem_arr[dark_mask, 2] = 255
    scaled_emblem = Image.fromarray(emblem_arr, "RGBA").resize((168, 134), Image.Resampling.LANCZOS)

    emb_x = card_x1 + 40
    emb_y = 576 - 102
    img.paste(scaled_emblem, (emb_x, emb_y), scaled_emblem)

    # Text next to emblem
    f_studio = get_font(44, bold=True)
    draw.text((emb_x + 190, emb_y + 14), "NP GAME STUDIO", font=f_studio, fill=(255, 255, 255, 255))

    # Glowing badge dot + Subtitle (NO missing glyph)
    dot_x = emb_x + 194
    dot_y = emb_y + 78
    draw.ellipse([dot_x, dot_y, dot_x + 8, dot_y + 8], fill=(56, 189, 248, 255))
    f_sub = get_font(15, bold=True)
    draw.text((dot_x + 16, emb_y + 72), "OFFICIAL INDIE GAME STUDIO", font=f_sub, fill=(56, 189, 248, 255))

    # Studio Tagline below
    f_tag = get_font(19, bold=False)
    draw.text((card_x1 + 42, 576 + 48), "Crafting Addictive Brain & Logic Puzzle Games", font=f_tag, fill=(226, 232, 240, 255))

    # Features Badges
    f_badge = get_font(12, bold=True)
    badges = ["100% Free & Offline", "Daily Brain Workout", "Satisfying Zen Flow"]
    bx = card_x1 + 42
    by = 576 + 86
    for b in badges:
        bb = draw.textbbox((0, 0), b, font=f_badge)
        bw = bb[2] - bb[0] + 16
        draw.rounded_rectangle([bx, by, bx + bw, by + 24], radius=6, fill=(30, 41, 59, 220), outline=(56, 189, 248, 100), width=1)
        draw.text((bx + 8, by + 5), b, font=f_badge, fill=(148, 163, 184, 255))
        bx += bw + 8

    # -------------------------------------------------------------
    # RIGHT PANEL: FEATURED GAME "NUMBER LINK PUZZLE"
    # -------------------------------------------------------------
    right_x = 1055
    mockup_x = right_x
    mockup_y = 576 - 82
    mockup_size = 164

    # Mini board card
    draw.rounded_rectangle([mockup_x, mockup_y, mockup_x + mockup_size, mockup_y + mockup_size],
                           radius=18, fill=(8, 14, 26, 255), outline=(56, 189, 248, 220), width=2)

    cell_s = mockup_size / 4.0
    for r in range(4):
        for c in range(4):
            cx = mockup_x + c * cell_s
            cy = mockup_y + r * cell_s
            draw.rectangle([cx, cy, cx + cell_s, cy + cell_s], outline=(30, 41, 59, 160), width=1)

    # Connected paths
    p1 = [(mockup_x + cell_s*0.5, mockup_y + cell_s*0.5), (mockup_x + cell_s*0.5, mockup_y + cell_s*3.5)]
    draw.line(p1, fill=(56, 189, 248, 255), width=7)
    p2 = [(mockup_x + cell_s*3.5, mockup_y + cell_s*0.5), (mockup_x + cell_s*3.5, mockup_y + cell_s*3.5)]
    draw.line(p2, fill=(16, 185, 129, 255), width=7)
    p3 = [(mockup_x + cell_s*1.5, mockup_y + cell_s*1.5), (mockup_x + cell_s*2.5, mockup_y + cell_s*1.5)]
    draw.line(p3, fill=(168, 85, 247, 255), width=7)

    def draw_node(col, row, num, col_tuple):
        nx = mockup_x + (col + 0.5) * cell_s
        ny = mockup_y + (row + 0.5) * cell_s
        rad = 14
        draw.ellipse([nx - rad, ny - rad, nx + rad, ny + rad], fill=col_tuple)
        fn = get_font(14, bold=True)
        nb = draw.textbbox((0, 0), str(num), font=fn)
        draw.text((nx - (nb[2]-nb[0])//2, ny - (nb[3]-nb[1])//2 - 1), str(num), font=fn, fill=(0, 0, 0, 255))

    draw_node(0, 0, 1, (56, 189, 248, 255))
    draw_node(0, 3, 1, (56, 189, 248, 255))
    draw_node(3, 0, 2, (16, 185, 129, 255))
    draw_node(3, 3, 2, (16, 185, 129, 255))
    draw_node(1, 1, 3, (168, 85, 247, 255))
    draw_node(2, 1, 3, (168, 85, 247, 255))

    # Text next to mini board
    game_text_x = mockup_x + mockup_size + 24

    # Glowing green dot + Subtitle
    g_dot_x = game_text_x
    g_dot_y = mockup_y + 10
    draw.ellipse([g_dot_x, g_dot_y, g_dot_x + 8, g_dot_y + 8], fill=(16, 185, 129, 255))
    f_featured = get_font(12, bold=True)
    draw.text((g_dot_x + 14, mockup_y + 4), "FEATURED NEW RELEASE", font=f_featured, fill=(16, 185, 129, 255))

    f_game_title = get_font(28, bold=True)
    draw.text((game_text_x, mockup_y + 24), "Number Link Puzzle", font=f_game_title, fill=(255, 255, 255, 255))

    f_game_desc = get_font(15, bold=False)
    draw.text((game_text_x, mockup_y + 62), "Link Numbers • Fill Grid • Zero Crosses", font=f_game_desc, fill=(148, 163, 184, 255))

    # "GET IT ON Google Play" styled badge
    badge_x = game_text_x
    badge_y = mockup_y + 98
    badge_w = 230
    badge_h = 52
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=10,
                           fill=(15, 23, 42, 255), outline=(56, 189, 248, 200), width=2)
    # Google Play colored triangle icon
    tri_x = badge_x + 16
    tri_y = badge_y + 13
    draw.polygon([(tri_x, tri_y), (tri_x + 22, tri_y + 13), (tri_x, tri_y + 26)], fill=(56, 189, 248, 255))
    draw.polygon([(tri_x, tri_y), (tri_x + 14, tri_y + 13), (tri_x, tri_y + 26)], fill=(16, 185, 129, 255))

    f_gp1 = get_font(10, bold=True)
    draw.text((badge_x + 48, badge_y + 10), "GET IT ON", font=f_gp1, fill=(148, 163, 184, 255))
    f_gp2 = get_font(18, bold=True)
    draw.text((badge_x + 48, badge_y + 24), "Google Play", font=f_gp2, fill=(255, 255, 255, 255))

    out_path = os.path.join(YOUTUBE_DIR, "youtube_banner_2048x1152.png")
    img.convert("RGB").save(out_path, quality=98)
    print("Saved master YouTube banner:", out_path)

# -------------------------------------------------------------
# 6. YouTube Banner (2048 x 1152) — Clean Minimalist Edition
# -------------------------------------------------------------
def make_banner_clean():
    W, H = 2048, 1152
    img = Image.new("RGBA", (W, H), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    grid_spacing = 64
    for gx in range(0, W, grid_spacing):
        draw.line([(gx, 0), (gx, H)], fill=(226, 232, 240, 150), width=1)
    for gy in range(0, H, grid_spacing):
        draw.line([(0, gy), (W, gy)], fill=(226, 232, 240, 150), width=1)

    card_x1, card_y1 = 415, 416
    card_x2, card_y2 = 1633, 736
    draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=24,
                           fill=(255, 255, 255, 255), outline=(203, 213, 225, 255), width=2)
    draw.line([(1020, card_y1 + 25), (1020, card_y2 - 25)], fill=(226, 232, 240, 255), width=2)

    scaled_emblem = emblem_trans.resize((168, 134), Image.Resampling.LANCZOS)
    emb_x = card_x1 + 40
    emb_y = 576 - 102
    img.paste(scaled_emblem, (emb_x, emb_y), scaled_emblem)

    f_studio = get_font(44, bold=True)
    draw.text((emb_x + 190, emb_y + 14), "NP GAME STUDIO", font=f_studio, fill=(15, 23, 42, 255))

    dot_x = emb_x + 194
    dot_y = emb_y + 78
    draw.ellipse([dot_x, dot_y, dot_x + 8, dot_y + 8], fill=(14, 165, 233, 255))
    f_sub = get_font(15, bold=True)
    draw.text((dot_x + 16, emb_y + 72), "OFFICIAL INDIE GAME STUDIO", font=f_sub, fill=(14, 165, 233, 255))

    f_tag = get_font(19, bold=False)
    draw.text((card_x1 + 42, 576 + 48), "Crafting Addictive Brain & Logic Puzzle Games", font=f_tag, fill=(71, 85, 105, 255))

    f_badge = get_font(12, bold=True)
    badges = ["100% Free & Offline", "Daily Brain Workout", "Satisfying Zen Flow"]
    bx = card_x1 + 42
    by = 576 + 86
    for b in badges:
        bb = draw.textbbox((0, 0), b, font=f_badge)
        bw = bb[2] - bb[0] + 16
        draw.rounded_rectangle([bx, by, bx + bw, by + 24], radius=6, fill=(241, 245, 249, 255), outline=(203, 213, 225, 255), width=1)
        draw.text((bx + 8, by + 5), b, font=f_badge, fill=(71, 85, 105, 255))
        bx += bw + 8

    # Right panel
    right_x = 1055
    mockup_x = right_x
    mockup_y = 576 - 82
    mockup_size = 164

    draw.rounded_rectangle([mockup_x, mockup_y, mockup_x + mockup_size, mockup_y + mockup_size],
                           radius=18, fill=(15, 23, 42, 255), outline=(14, 165, 233, 200), width=2)
    cell_s = mockup_size / 4.0
    for r in range(4):
        for c in range(4):
            cx = mockup_x + c * cell_s
            cy = mockup_y + r * cell_s
            draw.rectangle([cx, cy, cx + cell_s, cy + cell_s], outline=(30, 41, 59, 160), width=1)

    p1 = [(mockup_x + cell_s*0.5, mockup_y + cell_s*0.5), (mockup_x + cell_s*0.5, mockup_y + cell_s*3.5)]
    draw.line(p1, fill=(56, 189, 248, 255), width=7)
    p2 = [(mockup_x + cell_s*3.5, mockup_y + cell_s*0.5), (mockup_x + cell_s*3.5, mockup_y + cell_s*3.5)]
    draw.line(p2, fill=(16, 185, 129, 255), width=7)
    p3 = [(mockup_x + cell_s*1.5, mockup_y + cell_s*1.5), (mockup_x + cell_s*2.5, mockup_y + cell_s*1.5)]
    draw.line(p3, fill=(168, 85, 247, 255), width=7)

    def draw_node(col, row, num, col_tuple):
        nx = mockup_x + (col + 0.5) * cell_s
        ny = mockup_y + (row + 0.5) * cell_s
        rad = 14
        draw.ellipse([nx - rad, ny - rad, nx + rad, ny + rad], fill=col_tuple)
        fn = get_font(14, bold=True)
        nb = draw.textbbox((0, 0), str(num), font=fn)
        draw.text((nx - (nb[2]-nb[0])//2, ny - (nb[3]-nb[1])//2 - 1), str(num), font=fn, fill=(0, 0, 0, 255))

    draw_node(0, 0, 1, (56, 189, 248, 255))
    draw_node(0, 3, 1, (56, 189, 248, 255))
    draw_node(3, 0, 2, (16, 185, 129, 255))
    draw_node(3, 3, 2, (16, 185, 129, 255))
    draw_node(1, 1, 3, (168, 85, 247, 255))
    draw_node(2, 1, 3, (168, 85, 247, 255))

    game_text_x = mockup_x + mockup_size + 24

    g_dot_x = game_text_x
    g_dot_y = mockup_y + 10
    draw.ellipse([g_dot_x, g_dot_y, g_dot_x + 8, g_dot_y + 8], fill=(16, 185, 129, 255))
    f_featured = get_font(12, bold=True)
    draw.text((g_dot_x + 14, mockup_y + 4), "FEATURED NEW RELEASE", font=f_featured, fill=(16, 185, 129, 255))

    f_game_title = get_font(28, bold=True)
    draw.text((game_text_x, mockup_y + 24), "Number Link Puzzle", font=f_game_title, fill=(15, 23, 42, 255))

    f_game_desc = get_font(15, bold=False)
    draw.text((game_text_x, mockup_y + 62), "Link Numbers • Fill Grid • Zero Crosses", font=f_game_desc, fill=(71, 85, 105, 255))

    badge_x = game_text_x
    badge_y = mockup_y + 98
    badge_w = 230
    badge_h = 52
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=10,
                           fill=(15, 23, 42, 255), outline=(14, 165, 233, 200), width=2)
    tri_x = badge_x + 16
    tri_y = badge_y + 13
    draw.polygon([(tri_x, tri_y), (tri_x + 22, tri_y + 13), (tri_x, tri_y + 26)], fill=(56, 189, 248, 255))
    draw.polygon([(tri_x, tri_y), (tri_x + 14, tri_y + 13), (tri_x, tri_y + 26)], fill=(16, 185, 129, 255))

    f_gp1 = get_font(10, bold=True)
    draw.text((badge_x + 48, badge_y + 10), "GET IT ON", font=f_gp1, fill=(148, 163, 184, 255))
    f_gp2 = get_font(18, bold=True)
    draw.text((badge_x + 48, badge_y + 24), "Google Play", font=f_gp2, fill=(255, 255, 255, 255))

    out_path = os.path.join(YOUTUBE_DIR, "youtube_banner_clean_2048x1152.png")
    img.convert("RGB").save(out_path, quality=98)
    print("Saved clean YouTube banner:", out_path)

if __name__ == "__main__":
    make_profile_clean()
    make_profile_dark()
    make_watermark()
    make_banner_dark()
    make_banner_clean()
    print("All YouTube graphics generated successfully!")
