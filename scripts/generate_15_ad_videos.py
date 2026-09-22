import os
import sys
import math
import wave
import json
import subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r'd:\PC\RN\numberflow'
VIDEO_DIR = os.path.join(BASE_DIR, 'google-ads', 'video')
os.makedirs(VIDEO_DIR, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30

# Load Levels Data
with open(os.path.join(BASE_DIR, 'scripts', 'levels_data.json'), 'r') as f:
    LEVELS_DATA = json.load(f)

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

# Typography
F_BADGE_V = get_font('segoeuib.ttf', 26)
F_TITLE_V = get_font('segoeuib.ttf', 56)
F_SUB_V = get_font('segoeui.ttf', 30)

F_BADGE_H = get_font('segoeuib.ttf', 22)
F_TITLE_H = get_font('segoeuib.ttf', 44)
F_SUB_H = get_font('segoeui.ttf', 24)

F_BADGE_SQ = get_font('segoeuib.ttf', 24)
F_TITLE_SQ = get_font('segoeuib.ttf', 48)
F_SUB_SQ = get_font('segoeui.ttf', 26)

THEMES = {
    'default': {
        'bg': (15, 25, 35),
        'surface': (22, 33, 43),
        'surfaceRaised': (28, 45, 58),
        'border': (42, 58, 74),
        'primary': (77, 169, 255),       # Classic Blue
        'primaryLight': (142, 203, 255),
        'accent': (251, 191, 36),
        'badge': (56, 189, 248),
        'text': (255, 255, 255),
        'muted': (143, 163, 184)
    },
    'neon': {
        'bg': (10, 18, 14),
        'surface': (18, 28, 22),
        'surfaceRaised': (24, 38, 30),
        'border': (36, 58, 46),
        'primary': (0, 255, 136),        # Cyber Green
        'primaryLight': (120, 255, 180),
        'accent': (255, 215, 0),
        'badge': (0, 255, 136),
        'text': (255, 255, 255),
        'muted': (136, 180, 150)
    },
    'ocean': {
        'bg': (2, 27, 43),
        'surface': (3, 45, 68),
        'surfaceRaised': (5, 64, 96),
        'border': (26, 82, 118),
        'primary': (0, 180, 216),        # Cyan/Aqua
        'primaryLight': (72, 202, 228),
        'accent': (251, 191, 36),
        'badge': (72, 202, 228),
        'text': (224, 247, 255),
        'muted': (127, 179, 200)
    },
    'purple': {
        'bg': (26, 8, 48),
        'surface': (42, 16, 75),
        'surfaceRaised': (58, 24, 100),
        'border': (88, 38, 145),
        'primary': (168, 85, 247),       # Electric Purple
        'primaryLight': (216, 180, 254),
        'accent': (251, 191, 36),
        'badge': (192, 132, 252),
        'text': (243, 232, 255),
        'muted': (216, 180, 254)
    },
    'dark': {
        'bg': (10, 10, 10),
        'surface': (20, 20, 20),
        'surfaceRaised': (32, 32, 32),
        'border': (55, 55, 55),
        'primary': (245, 245, 245),      # Pure Minimalist White
        'primaryLight': (200, 200, 200),
        'accent': (251, 191, 36),
        'badge': (220, 220, 220),
        'text': (255, 255, 255),
        'muted': (150, 150, 150)
    }
}

def to_bgr(rgb):
    return (rgb[2], rgb[1], rgb[0])

def parse_level(lvl_id):
    data = LEVELS_DATA[str(lvl_id)]
    size = data['size']
    nodes = data['nodes']
    
    sol = []
    for s in data['solution']:
        r, c = map(int, s.split(','))
        sol.append((r, c))
        
    walls = []
    for w in data.get('walls', []):
        p1, p2 = w.split('|')
        r1, c1 = map(int, p1.split(','))
        r2, c2 = map(int, p2.split(','))
        walls.append((r1, c1, r2, c2))
        
    return size, nodes, sol, walls

def synthesize_audio(wav_path, duration=15, style='normal', n_clicks=30, sr=44100):
    total_samples = int(sr * duration)
    audio = np.zeros(total_samples, dtype=np.float32)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    
    if style == 'speedrun':
        audio += 0.04 * np.sin(2 * np.pi * 75.0 * t) * (0.8 + 0.2 * np.sin(2 * np.pi * 5.0 * t))
    elif style in ['ocean', 'zen']:
        audio += 0.03 * np.sin(2 * np.pi * 110.0 * t) + 0.02 * np.sin(2 * np.pi * 164.81 * t)
    elif style == 'tense':
        for i in range(int(duration)):
            idx = int(i * sr)
            if idx + int(0.08 * sr) <= total_samples:
                audio[idx:idx + int(0.08 * sr)] += 0.25 * np.sin(2 * np.pi * 120 * np.linspace(0, 0.08, int(0.08 * sr), endpoint=False)) * np.exp(-np.linspace(0, 0.08, int(0.08 * sr)) * 30)
    else:
        audio += 0.03 * np.sin(2 * np.pi * 65.41 * t)
        
    solve_start = 1.0
    solve_end = duration - 3.5
    for i in range(n_clicks):
        st = solve_start + (i / float(n_clicks)) * (solve_end - solve_start)
        idx = int(st * sr)
        freq = 360 + (i * 20) % 500
        click_len = int(0.04 * sr)
        if idx + click_len <= total_samples:
            audio[idx:idx + click_len] += 0.22 * np.sin(2 * np.pi * freq * np.linspace(0, 0.04, click_len, endpoint=False))
            
    fanfare_start = int((duration - 3.2) * sr)
    fanfare_len = int(3.0 * sr)
    chord_freqs = [523, 659, 783, 1046]
    for f in chord_freqs:
        chunk_len = min(fanfare_len, total_samples - fanfare_start)
        if chunk_len > 0:
            audio[fanfare_start:fanfare_start + chunk_len] += 0.12 * np.sin(2 * np.pi * f * np.linspace(0, chunk_len/sr, chunk_len, endpoint=False))
            
    audio = np.clip(audio, -1.0, 1.0)
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes((audio * 32767).astype(np.int16).tobytes())

# Win Modals
def get_win_modal_v(title="Level Complete!", sub="Clean solve! You're a natural.", time_str="0:11", coins=75):
    W_card, H_card = 760, 620
    card = Image.new('RGBA', (W_card, H_card), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    f_emoji = get_font('seguiemj.ttf', 44)
    f_title = get_font('segoeuib.ttf', 42)
    f_sub = get_font('segoeui.ttf', 22)
    f_btn = get_font('segoeuib.ttf', 24)
    
    draw.rounded_rectangle([(0, 0), (W_card-1, H_card-1)], radius=24, fill=(28, 45, 58, 252), outline=(42, 58, 74, 255), width=3)
    draw.text((W_card//2 - 25, 25), chr(127881), font=f_emoji, fill=(255, 255, 255, 255), embedded_color=True)
    draw.text((W_card//2 - 150, 90), title, font=f_title, fill=(255, 255, 255, 255))
    draw.text((W_card//2 - 150, 150), sub, font=f_sub, fill=(143, 163, 184, 255))
    draw.text((W_card//2 - 35, 185), f"0:{time_str[-2:]}", font=f_sub, fill=(143, 163, 184, 255))
    draw.rounded_rectangle([(W_card//2 - 150, 225), (W_card//2 + 150, 275)], radius=20, fill=(35, 50, 65, 255), outline=(251, 191, 36, 255), width=2)
    draw.text((W_card//2 - 115, 238), f"+{coins} Coins Earned!", font=f_btn, fill=(251, 191, 36, 255))
    draw.text((W_card//2 - 125, 290), "4 more levels for a hint", font=f_sub, fill=(143, 163, 184, 255))
    
    draw.rounded_rectangle([(50, 335), (350, 405)], radius=25, fill=(22, 33, 43, 255), outline=(42, 58, 74, 255), width=2)
    draw.text((150, 355), "Retry", font=f_btn, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(410, 335), (710, 405)], radius=25, fill=(77, 169, 255, 255))
    draw.text((520, 355), "Next >", font=f_btn, fill=(15, 25, 35, 255))
    draw.rounded_rectangle([(50, 425), (710, 505)], radius=25, fill=(16, 185, 129, 255))
    draw.text((160, 450), f"Watch Ad * 2x Coins (+{coins})", font=f_btn, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(50, 525), (710, 595)], radius=18, fill=(56, 189, 248, 255))
    draw.text((155, 545), "INSTALL FREE ON GOOGLE PLAY", font=f_btn, fill=(7, 13, 24, 255))
    
    card_bgr = np.array(card)[:, :, :3][:, :, ::-1]
    card_alpha = np.array(card)[:, :, 3:4] / 255.0
    return card_bgr, card_alpha, W_card, H_card

def get_win_modal_h(title="Level Complete!", sub="Clean solve! You're a natural.", time_str="0:15", coins=75):
    W_card, H_card = 820, 560
    card = Image.new('RGBA', (W_card, H_card), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    f_emoji = get_font('seguiemj.ttf', 40)
    f_title = get_font('segoeuib.ttf', 38)
    f_sub = get_font('segoeui.ttf', 20)
    f_btn = get_font('segoeuib.ttf', 22)
    
    draw.rounded_rectangle([(0, 0), (W_card-1, H_card-1)], radius=24, fill=(28, 45, 58, 252), outline=(42, 58, 74, 255), width=3)
    draw.text((W_card//2 - 20, 20), chr(127881), font=f_emoji, fill=(255, 255, 255, 255), embedded_color=True)
    draw.text((W_card//2 - 135, 75), title, font=f_title, fill=(255, 255, 255, 255))
    draw.text((W_card//2 - 140, 130), sub, font=f_sub, fill=(143, 163, 184, 255))
    draw.text((W_card//2 - 30, 160), f"0:{time_str[-2:]}", font=f_sub, fill=(143, 163, 184, 255))
    draw.rounded_rectangle([(W_card//2 - 140, 195), (W_card//2 + 140, 240)], radius=18, fill=(35, 50, 65, 255), outline=(251, 191, 36, 255), width=2)
    draw.text((W_card//2 - 105, 206), f"+{coins} Coins Earned!", font=f_btn, fill=(251, 191, 36, 255))
    draw.text((W_card//2 - 110, 252), "4 more levels for a hint", font=f_sub, fill=(143, 163, 184, 255))
    
    draw.rounded_rectangle([(60, 290), (380, 355)], radius=22, fill=(22, 33, 43, 255), outline=(42, 58, 74, 255), width=2)
    draw.text((180, 308), "Retry", font=f_btn, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(440, 290), (760, 355)], radius=22, fill=(77, 169, 255, 255))
    draw.text((560, 308), "Next >", font=f_btn, fill=(15, 25, 35, 255))
    draw.rounded_rectangle([(60, 375), (760, 445)], radius=22, fill=(16, 185, 129, 255))
    draw.text((200, 395), f"Watch Ad * 2x Coins (+{coins})", font=f_btn, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(60, 465), (760, 530)], radius=16, fill=(56, 189, 248, 255))
    draw.text((220, 483), "PLAY FREE ON GOOGLE PLAY", font=f_btn, fill=(7, 13, 24, 255))
    
    card_bgr = np.array(card)[:, :, :3][:, :, ::-1]
    card_alpha = np.array(card)[:, :, 3:4] / 255.0
    return card_bgr, card_alpha, W_card, H_card

def get_win_modal_sq(title="Level Complete!", sub="Clean solve! You're a natural.", time_str="0:12", coins=75):
    W_card, H_card = 720, 480
    card = Image.new('RGBA', (W_card, H_card), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    f_emoji = get_font('seguiemj.ttf', 38)
    f_title = get_font('segoeuib.ttf', 36)
    f_sub = get_font('segoeui.ttf', 20)
    f_btn = get_font('segoeuib.ttf', 20)
    
    draw.rounded_rectangle([(0, 0), (W_card-1, H_card-1)], radius=20, fill=(28, 45, 58, 252), outline=(42, 58, 74, 255), width=3)
    draw.text((W_card//2 - 20, 16), chr(127881), font=f_emoji, fill=(255, 255, 255, 255), embedded_color=True)
    draw.text((W_card//2 - 130, 68), title, font=f_title, fill=(255, 255, 255, 255))
    draw.text((W_card//2 - 135, 116), sub, font=f_sub, fill=(143, 163, 184, 255))
    draw.rounded_rectangle([(W_card//2 - 130, 155), (W_card//2 + 130, 195)], radius=16, fill=(35, 50, 65, 255), outline=(251, 191, 36, 255), width=2)
    draw.text((W_card//2 - 95, 164), f"+{coins} Coins Earned!", font=f_btn, fill=(251, 191, 36, 255))
    
    # Buttons
    draw.rounded_rectangle([(50, 220), (330, 275)], radius=18, fill=(22, 33, 43, 255), outline=(42, 58, 74, 255), width=2)
    draw.text((140, 236), "Retry", font=f_btn, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(390, 220), (670, 275)], radius=18, fill=(77, 169, 255, 255))
    draw.text((490, 236), "Next >", font=f_btn, fill=(15, 25, 35, 255))
    draw.rounded_rectangle([(50, 295), (670, 360)], radius=18, fill=(16, 185, 129, 255))
    draw.text((160, 315), f"Watch Ad * 2x Coins (+{coins})", font=f_btn, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(50, 380), (670, 445)], radius=16, fill=(56, 189, 248, 255))
    draw.text((170, 400), "INSTALL FREE ON GOOGLE PLAY", font=f_btn, fill=(7, 13, 24, 255))
    
    card_bgr = np.array(card)[:, :, :3][:, :, ::-1]
    card_alpha = np.array(card)[:, :, 3:4] / 255.0
    return card_bgr, card_alpha, W_card, H_card

# Board Drawing Engine
def draw_board(frame, bx, by, b_w, size, nodes, walls, cur_pts, sol, theme):
    cell = b_w / float(size)
    c_bg = to_bgr(theme['surface'])
    c_border = to_bgr(theme['border'])
    c_primary = to_bgr(theme['primary'])
    c_primary_light = to_bgr(theme['primaryLight'])
    
    # Outer card
    cv2.rectangle(frame, (bx - 14, by - 14), (bx + b_w + 14, by + b_w + 14), c_bg, -1)
    cv2.rectangle(frame, (bx - 14, by - 14), (bx + b_w + 14, by + b_w + 14), c_border, 2)
    
    # Grid lines
    for i in range(size + 1):
        cv2.line(frame, (bx, int(by + i * cell)), (bx + b_w, int(by + i * cell)), c_border, 1)
        cv2.line(frame, (int(bx + i * cell), by), (int(bx + i * cell), by + b_w), c_border, 1)
        
    # Walls
    for (r1, c1, r2, c2) in walls:
        if r1 == r2:
            wx = int(bx + max(c1, c2) * cell)
            cv2.line(frame, (wx, int(by + r1 * cell + 6)), (wx, int(by + (r1 + 1) * cell - 6)), (255, 255, 255), 7, lineType=cv2.LINE_AA)
        else:
            wy = int(by + max(r1, r2) * cell)
            cv2.line(frame, (int(bx + c1 * cell + 6), wy), (int(bx + (c1 + 1) * cell - 6), wy), (255, 255, 255), 7, lineType=cv2.LINE_AA)
            
    # Trail fills
    for pt in cur_pts:
        r_c = ((pt[1] - by) // int(cell), (pt[0] - bx) // int(cell))
        cv2.rectangle(frame, (int(bx + r_c[1] * cell + 3), int(by + r_c[0] * cell + 3)),
                             (int(bx + (r_c[1] + 1) * cell - 3), int(by + (r_c[0] + 1) * cell - 3)),
                             c_primary, -1)
                             
    # Trail lines
    if len(cur_pts) >= 2:
        for i in range(len(cur_pts) - 1):
            cv2.line(frame, cur_pts[i], cur_pts[i+1], c_primary_light, int(cell * 0.34), lineType=cv2.LINE_AA)
            cv2.line(frame, cur_pts[i], cur_pts[i+1], c_primary, int(cell * 0.16), lineType=cv2.LINE_AA)
            
    # Nodes
    for n in nodes:
        cx = int(bx + n['c'] * cell + cell/2)
        cy = int(by + n['r'] * cell + cell/2)
        is_reached = (n['r'], n['c']) in sol[:len(cur_pts)]
        node_radius = max(18, int(cell * 0.32))
        cv2.circle(frame, (cx, cy), node_radius, c_primary if is_reached else to_bgr(theme['surfaceRaised']), -1, lineType=cv2.LINE_AA)
        cv2.circle(frame, (cx, cy), node_radius, c_primary if is_reached else c_border, 2, lineType=cv2.LINE_AA)
        font_scale = 0.55 if cell < 90 else 0.85
        cv2.putText(frame, str(n['num']), (cx - int(node_radius*0.35), cy + int(node_radius*0.35)),
                    cv2.FONT_HERSHEY_DUPLEX, font_scale, (20, 20, 20) if is_reached else (255, 255, 255), 2, cv2.LINE_AA)

# ═════════════════════════════════════════════════════════════════════════════
# 1. VERTICAL VIDEOS (9:16, 1080x1920)
# ═════════════════════════════════════════════════════════════════════════════
def render_vertical_video(out_name, lvl_id, theme_key, badge_txt, title_txt, sub_txt, audio_style='normal', duration=14):
    print(f"\n[RENDERING 9:16] {out_name} (Level {lvl_id}, Theme: {theme_key})")
    raw_mp4 = os.path.join(VIDEO_DIR, f'raw_{out_name}')
    final_mp4 = os.path.join(VIDEO_DIR, out_name)
    wav_path = os.path.join(VIDEO_DIR, f'temp_{out_name}.wav')
    
    theme = THEMES[theme_key]
    size, nodes, sol, walls = parse_level(lvl_id)
    
    synthesize_audio(wav_path, duration=duration, style=audio_style, n_clicks=len(sol))
    
    W, H = 1080, 1920
    vw = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), float(FPS), (W, H))
    card_bgr, card_alpha, W_card, H_card = get_win_modal_v(f"Level {lvl_id} Cleared!", "Clean solve! You're a natural.", "0:12", 75)
    
    # Pre-render base background
    base_pil = Image.new('RGB', (W, H), theme['bg'])
    draw_b = ImageDraw.Draw(base_pil)
    draw_b.text(((W - 420) // 2, 100), badge_txt, font=F_BADGE_V, fill=theme['badge'])
    draw_b.text(((W - 740) // 2, 160), title_txt, font=F_TITLE_V, fill=(255, 255, 255))
    draw_b.text(((W - 520) // 2, 245), sub_txt, font=F_SUB_V, fill=theme['muted'])
    base_bgr = np.array(base_pil)[:, :, ::-1].copy()
    
    b_w = 660 if size == 6 else 600
    bx = (W - b_w) // 2
    by = 560
    
    total_frames = int(duration * FPS)
    solve_start = 1.0
    solve_end = duration - 3.5
    
    for f in range(total_frames):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        # Solving progression
        p = min(1.0, max(0.0, (sec - solve_start) / (solve_end - solve_start)))
        n_cells = max(1, int(p * len(sol)))
        cell = b_w / float(size)
        cur_pts = [(int(bx + c * cell + cell/2), int(by + r * cell + cell/2)) for (r, c) in sol[:n_cells]]
        
        draw_board(frame, bx, by, b_w, size, nodes, walls, cur_pts, sol, theme)
        
        # Live status under board
        st_txt = f"Connecting: 1 -> {nodes[-1]['num']}  •  {len(cur_pts)}/{len(sol)} cells" if len(cur_pts) < len(sol) else "PERFECT 100% SOLVE! ★"
        cv2.putText(frame, st_txt, ((W - 450) // 2, by + b_w + 60), cv2.FONT_HERSHEY_SIMPLEX, 0.9, to_bgr(theme['badge']), 2, cv2.LINE_AA)
        
        # Win Modal
        if sec >= (duration - 3.2):
            for i in range(35):
                seed = i * 137 + f * 7
                px = (seed * 19) % W
                py = (seed * 31 + int((sec - (duration - 3.2)) * 600)) % H
                pcol = (248, 189, 56) if i % 2 == 0 else to_bgr(theme['primary'])
                cv2.circle(frame, (px, py), 7, pcol, -1, lineType=cv2.LINE_AA)
            mx1 = (W - W_card) // 2
            my1 = 1220
            frame[my1:my1+H_card, mx1:mx1+W_card] = (card_bgr * card_alpha + frame[my1:my1+H_card, mx1:mx1+W_card] * (1.0 - card_alpha)).astype(np.uint8)
            
        vw.write(frame)
    vw.release()
    
    subprocess.run([
        FFMPEG_EXE, '-y', '-i', raw_mp4, '-i', wav_path, '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', final_mp4
    ], capture_output=True, check=True)
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    print(f"[SUCCESS] {out_name} generated ({os.path.getsize(final_mp4)/(1024*1024):.2f} MB)")

# ═════════════════════════════════════════════════════════════════════════════
# 2. LANDSCAPE VIDEOS (16:9, 1920x1080)
# ═════════════════════════════════════════════════════════════════════════════
def render_landscape_video(out_name, lvl_id, theme_key, badge_txt, title_txt, sub_txt, audio_style='normal', duration=14, split_lvl=None):
    print(f"\n[RENDERING 16:9] {out_name} (Level {lvl_id}, Theme: {theme_key})")
    raw_mp4 = os.path.join(VIDEO_DIR, f'raw_{out_name}')
    final_mp4 = os.path.join(VIDEO_DIR, out_name)
    wav_path = os.path.join(VIDEO_DIR, f'temp_{out_name}.wav')
    
    theme = THEMES[theme_key]
    size, nodes, sol, walls = parse_level(lvl_id)
    
    synthesize_audio(wav_path, duration=duration, style=audio_style, n_clicks=len(sol))
    
    W, H = 1920, 1080
    vw = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), float(FPS), (W, H))
    card_bgr, card_alpha, W_card, H_card = get_win_modal_h(f"Level {lvl_id} Complete!", "Master solve! Cleared without hints.", "0:14", 75)
    
    base_pil = Image.new('RGB', (W, H), theme['bg'])
    draw_b = ImageDraw.Draw(base_pil)
    
    if split_lvl:
        # Split mode
        draw_b.text(((W - 500) // 2, 40), badge_txt, font=F_BADGE_H, fill=theme['badge'])
        draw_b.text(((W - 720) // 2, 80), title_txt, font=F_TITLE_H, fill=(255, 255, 255))
        draw_b.text((250, 170), f"LEVEL {lvl_id} (CASUAL)", font=F_BADGE_H, fill=(74, 222, 128))
        draw_b.text((1220, 170), f"LEVEL {split_lvl} (EXPERT)", font=F_BADGE_H, fill=(248, 113, 113))
        size2, nodes2, sol2, walls2 = parse_level(split_lvl)
    else:
        # Hero + Right Board mode
        draw_b.text((120, 240), badge_txt, font=F_BADGE_H, fill=theme['badge'])
        draw_b.text((120, 300), title_txt, font=F_TITLE_H, fill=(255, 255, 255))
        draw_b.text((120, 370), "NUMBER LINK PUZZLE", font=F_TITLE_H, fill=theme['primary'])
        draw_b.text((120, 460), sub_txt, font=F_SUB_H, fill=theme['muted'])
        draw_b.text((120, 600), "⭐ Rated 4.9 by Solvers  •  1,000+ Logic Grids", font=F_BADGE_H, fill=theme['accent'])
        
    base_bgr = np.array(base_pil)[:, :, ::-1].copy()
    
    total_frames = int(duration * FPS)
    solve_start = 1.0
    solve_end = duration - 3.5
    
    for f in range(total_frames):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        if split_lvl:
            # Dual boards
            b_w = 520
            # Left board
            bx1, by1 = 180, 230
            p1 = min(1.0, max(0.0, (sec - solve_start) / (solve_end - solve_start)))
            n1 = max(1, int(p1 * len(sol)))
            cell1 = b_w / float(size)
            cur1 = [(int(bx1 + c * cell1 + cell1/2), int(by1 + r * cell1 + cell1/2)) for (r, c) in sol[:n1]]
            draw_board(frame, bx1, by1, b_w, size, nodes, walls, cur1, sol, theme)
            
            # Right board
            bx2, by2 = 1200, 230
            n2 = max(1, int(p1 * len(sol2)))
            cell2 = b_w / float(size2)
            cur2 = [(int(bx2 + c * cell2 + cell2/2), int(by2 + r * cell2 + cell2/2)) for (r, c) in sol2[:n2]]
            draw_board(frame, bx2, by2, b_w, size2, nodes2, walls2, cur2, sol2, THEMES['dark'])
            
            if sec < (duration - 3.2):
                cv2.putText(frame, "100% OFFLINE READY  •  NO HIGH PRESSURE TIMERS  •  OVER 1000+ LEVELS", (320, 890), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (184, 163, 143), 2, cv2.LINE_AA)
        else:
            # Single big board on right
            b_w = 660 if size == 6 else 600
            bx = 1120
            by = 210
            p = min(1.0, max(0.0, (sec - solve_start) / (solve_end - solve_start)))
            n_cells = max(1, int(p * len(sol)))
            cell = b_w / float(size)
            cur_pts = [(int(bx + c * cell + cell/2), int(by + r * cell + cell/2)) for (r, c) in sol[:n_cells]]
            draw_board(frame, bx, by, b_w, size, nodes, walls, cur_pts, sol, theme)
            
            # Left CTA button
            cv2.rectangle(frame, (120, 700), (580, 780), (129, 185, 16), -1)
            cv2.putText(frame, "INSTALL FREE NOW >", (160, 755), cv2.FONT_HERSHEY_DUPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)
            
        # Win Modal overlay
        if sec >= (duration - 3.2):
            overlay = np.full_like(frame, (10, 18, 26), dtype=np.uint8)
            alpha_dim = min(0.70, (sec - (duration - 3.2)) * 1.5)
            frame = cv2.addWeighted(overlay, alpha_dim, frame, 1.0 - alpha_dim, 0)
            for i in range(40):
                seed = i * 137 + f * 7
                px = (seed * 19) % W
                py = (seed * 31 + int((sec - (duration - 3.2)) * 550)) % H
                pcol = (248, 189, 56) if i % 2 == 0 else to_bgr(theme['primary'])
                cv2.circle(frame, (px, py), 7, pcol, -1, lineType=cv2.LINE_AA)
            mx1 = (W - W_card) // 2
            my1 = (H - H_card) // 2
            frame[my1:my1+H_card, mx1:mx1+W_card] = (card_bgr * card_alpha + frame[my1:my1+H_card, mx1:mx1+W_card] * (1.0 - card_alpha)).astype(np.uint8)
            
        vw.write(frame)
    vw.release()
    
    subprocess.run([
        FFMPEG_EXE, '-y', '-i', raw_mp4, '-i', wav_path, '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', final_mp4
    ], capture_output=True, check=True)
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    print(f"[SUCCESS] {out_name} generated ({os.path.getsize(final_mp4)/(1024*1024):.2f} MB)")

# ═════════════════════════════════════════════════════════════════════════════
# 3. SQUARE VIDEOS (1:1 / 5:5, 1080x1080)
# ═════════════════════════════════════════════════════════════════════════════
def render_square_video(out_name, lvl_id, theme_key, badge_txt, title_txt, sub_txt, audio_style='normal', duration=13):
    print(f"\n[RENDERING 1:1 / 5:5 SQUARE] {out_name} (Level {lvl_id}, Theme: {theme_key})")
    raw_mp4 = os.path.join(VIDEO_DIR, f'raw_{out_name}')
    final_mp4 = os.path.join(VIDEO_DIR, out_name)
    wav_path = os.path.join(VIDEO_DIR, f'temp_{out_name}.wav')
    
    theme = THEMES[theme_key]
    size, nodes, sol, walls = parse_level(lvl_id)
    
    synthesize_audio(wav_path, duration=duration, style=audio_style, n_clicks=len(sol))
    
    W, H = 1080, 1080
    vw = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), float(FPS), (W, H))
    card_bgr, card_alpha, W_card, H_card = get_win_modal_sq(f"Level {lvl_id} Cleared!", "Clean solve! You're a natural.", "0:12", 75)
    
    base_pil = Image.new('RGB', (W, H), theme['bg'])
    draw_b = ImageDraw.Draw(base_pil)
    draw_b.text(((W - 400) // 2, 40), badge_txt, font=F_BADGE_SQ, fill=theme['badge'])
    draw_b.text(((W - 680) // 2, 85), title_txt, font=F_TITLE_SQ, fill=(255, 255, 255))
    draw_b.text(((W - 460) // 2, 150), sub_txt, font=F_SUB_SQ, fill=theme['muted'])
    base_bgr = np.array(base_pil)[:, :, ::-1].copy()
    
    b_w = 600 if size == 6 else 550
    bx = (W - b_w) // 2
    by = 240
    
    total_frames = int(duration * FPS)
    solve_start = 1.0
    solve_end = duration - 3.2
    
    for f in range(total_frames):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        p = min(1.0, max(0.0, (sec - solve_start) / (solve_end - solve_start)))
        n_cells = max(1, int(p * len(sol)))
        cell = b_w / float(size)
        cur_pts = [(int(bx + c * cell + cell/2), int(by + r * cell + cell/2)) for (r, c) in sol[:n_cells]]
        
        draw_board(frame, bx, by, b_w, size, nodes, walls, cur_pts, sol, theme)
        
        # Bottom CTA Banner
        if sec < (duration - 3.0):
            st_txt = f"Connecting: 1 -> {nodes[-1]['num']}  •  {len(cur_pts)}/{len(sol)} cells" if len(cur_pts) < len(sol) else "CLEARED! IQ 135+ ★"
            cv2.putText(frame, st_txt, ((W - 420) // 2, by + b_w + 55), cv2.FONT_HERSHEY_SIMPLEX, 0.85, to_bgr(theme['badge']), 2, cv2.LINE_AA)
            cv2.putText(frame, "INSTALL FREE ON GOOGLE PLAY", ((W - 460) // 2, by + b_w + 115), cv2.FONT_HERSHEY_DUPLEX, 0.85, (74, 222, 128), 2, cv2.LINE_AA)
            
        # Win Modal overlay
        if sec >= (duration - 3.0):
            overlay = np.full_like(frame, (10, 18, 26), dtype=np.uint8)
            alpha_dim = min(0.65, (sec - (duration - 3.0)) * 1.5)
            frame = cv2.addWeighted(overlay, alpha_dim, frame, 1.0 - alpha_dim, 0)
            for i in range(30):
                seed = i * 137 + f * 7
                px = (seed * 19) % W
                py = (seed * 31 + int((sec - (duration - 3.0)) * 500)) % H
                pcol = (248, 189, 56) if i % 2 == 0 else to_bgr(theme['primary'])
                cv2.circle(frame, (px, py), 6, pcol, -1, lineType=cv2.LINE_AA)
            mx1 = (W - W_card) // 2
            my1 = (H - H_card) // 2
            frame[my1:my1+H_card, mx1:mx1+W_card] = (card_bgr * card_alpha + frame[my1:my1+H_card, mx1:mx1+W_card] * (1.0 - card_alpha)).astype(np.uint8)
            
        vw.write(frame)
    vw.release()
    
    subprocess.run([
        FFMPEG_EXE, '-y', '-i', raw_mp4, '-i', wav_path, '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', final_mp4
    ], capture_output=True, check=True)
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    print(f"[SUCCESS] {out_name} generated ({os.path.getsize(final_mp4)/(1024*1024):.2f} MB)")

def main():
    print("===============================================================")
    print("🚀 GENERATING 15 NEW ADS VIDEOS FOR NUMBER LINK PUZZLE")
    print("   • 5 Videos in 9:16 Vertical (1080x1920)")
    print("   • 5 Videos in 16:9 Landscape (1920x1080)")
    print("   • 5 Videos in 1:1 / 5:5 Square (1080x1080)")
    print("===============================================================")
    
    # ─────────────── 1. 5 Vertical Videos (9:16) ───────────────
    render_vertical_video(
        'video_06_neon_speedrun_1080x1920.mp4',
        lvl_id=2, theme_key='neon',
        badge_txt="⚡ 5-SECOND SPEEDRUN",
        title_txt="NEON FLOW CHALLENGE",
        sub_txt="Link all numbers without crossing lines!",
        audio_style='speedrun', duration=14
    )
    render_vertical_video(
        'video_07_ocean_calm_1080x1920.mp4',
        lvl_id=3, theme_key='ocean',
        badge_txt="🌊 ANTI-STRESS PUZZLE",
        title_txt="RELAX YOUR MIND",
        sub_txt="Zero timers  •  Soothing water flow",
        audio_style='ocean', duration=14
    )
    render_vertical_video(
        'video_08_purple_mystery_1080x1920.mp4',
        lvl_id=4, theme_key='purple',
        badge_txt="🔮 MYSTIC LOGIC MAZE",
        title_txt="CONNECT 1 TO 4",
        sub_txt="Don't trap yourself! Handcrafted grid.",
        audio_style='normal', duration=14
    )
    render_vertical_video(
        'video_09_hard_maze_1080x1920.mp4',
        lvl_id=7, theme_key='neon',
        badge_txt="🔥 95% FAIL THIS STAGE",
        title_txt="LEVEL 7 WALL BARRIER",
        sub_txt="5 Number Nodes  •  Tactile Haptics",
        audio_style='tense', duration=14
    )
    render_vertical_video(
        'video_10_expert_level20_1080x1920.mp4',
        lvl_id=20, theme_key='dark',
        badge_txt="👑 GRAND MASTER LEVEL",
        title_txt="CAN YOU CLEAR LEVEL 20?",
        sub_txt="The Ultimate 7-Node Logic Test",
        audio_style='tense', duration=14
    )
    
    # ─────────────── 2. 5 Landscape Videos (16:9) ───────────────
    render_landscape_video(
        'video_11_split_neon_ocean_1920x1080.mp4',
        lvl_id=2, theme_key='neon',
        badge_txt="CYBER VISUAL THEMES",
        title_txt="CHOOSE YOUR VIBE: NEON OR OCEAN?",
        sub_txt="",
        audio_style='speedrun', duration=15, split_lvl=3
    )
    render_landscape_video(
        'video_12_iq_showcase_1920x1080.mp4',
        lvl_id=8, theme_key='ocean',
        badge_txt="BRAIN TRAINING IQ WORKOUT",
        title_txt="SHARPEN YOUR MIND DAILY",
        sub_txt="Handcrafted logic grids that stimulate spatial thinking.\nRelaxing dark mode aesthetic with crisp haptic feedback.\nEnjoy anywhere, anytime — 100% offline ready.",
        audio_style='normal', duration=15
    )
    render_landscape_video(
        'video_13_darkmode_zen_1920x1080.mp4',
        lvl_id=9, theme_key='purple',
        badge_txt="SOOTHING BEDTIME PUZZLE",
        title_txt="DARK MODE • ZERO ADS STRESS",
        sub_txt="Soothing OLED visuals with ambient soundscapes.\nNo timers, no penalties, pure zen problem solving.\nThousands of handcrafted levels from 5x5 to 10x10.",
        audio_style='zen', duration=15
    )
    render_landscape_video(
        'video_14_progression_level4_level12_1920x1080.mp4',
        lvl_id=4, theme_key='default',
        badge_txt="PLAYER PROGRESSION JOURNEY",
        title_txt="EASY TO LEARN • HARD TO MASTER",
        sub_txt="",
        audio_style='normal', duration=15, split_lvl=12
    )
    render_landscape_video(
        'video_15_satisfying_asmr_1920x1080.mp4',
        lvl_id=16, theme_key='default',
        badge_txt="SATISFYING AUDIO & HAPTICS",
        title_txt="PERFECT UNBROKEN FLOW",
        sub_txt="Connect every node with one seamless continuous path.\nFeel the satisfying click on every cell you master.\n100% free to play on Google Play Store.",
        audio_style='speedrun', duration=15
    )
    
    # ─────────────── 3. 5 Square Videos (1:1 / 5:5) ───────────────
    render_square_video(
        'video_16_square_quick_puzzle_1080x1080.mp4',
        lvl_id=1, theme_key='default',
        badge_txt="⚡ QUICK LOGIC PUZZLE",
        title_txt="CAN YOU SOLVE IN 3s?",
        sub_txt="Connect 1 -> 2 -> 3 without crossing!",
        audio_style='normal', duration=13
    )
    render_square_video(
        'video_17_square_neon_pulse_1080x1080.mp4',
        lvl_id=2, theme_key='neon',
        badge_txt="💚 SATISFYING NEON ASMR",
        title_txt="PURE LOGIC FLOW",
        sub_txt="Smooth Glowing Cyber Lines",
        audio_style='speedrun', duration=13
    )
    render_square_video(
        'video_18_square_hard_iq_1080x1080.mp4',
        lvl_id=10, theme_key='purple',
        badge_txt="🔥 ONLY 3% CLEAR THIS",
        title_txt="LEVEL 10 MAZE TEST",
        sub_txt="6 Pairs  •  Tight Wall Barriers",
        audio_style='tense', duration=13
    )
    render_square_video(
        'video_19_square_ocean_zen_1080x1080.mp4',
        lvl_id=5, theme_key='ocean',
        badge_txt="🌊 ANTI-STRESS ZEN",
        title_txt="CALM YOUR MIND",
        sub_txt="No Pressure  •  100% Offline Ready",
        audio_style='zen', duration=13
    )
    render_square_video(
        'video_20_square_grand_master_1080x1080.mp4',
        lvl_id=15, theme_key='dark',
        badge_txt="🧠 ULTIMATE BRAIN WORKOUT",
        title_txt="LEVEL 15 GRAND MASTER",
        sub_txt="7 Number Nodes  •  IQ 140+ Challenge",
        audio_style='tense', duration=13
    )
    
    print("\n🎉 ALL 15 VIDEOS SUCCESSFULLY GENERATED!")

if __name__ == '__main__':
    main()
