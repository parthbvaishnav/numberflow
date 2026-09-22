import os
import math
import wave
import subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

BASE_DIR = r'd:\PC\RN\numberflow'
VIDEO_DIR = os.path.join(BASE_DIR, 'google-ads', 'video')
os.makedirs(VIDEO_DIR, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30

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
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

F_BADGE_V = get_font('segoeuib.ttf', 26)
F_TITLE_V = get_font('segoeuib.ttf', 62)
F_SUB_V = get_font('segoeui.ttf', 32)
F_STATUS_V = get_font('segoeui.ttf', 26)

F_BADGE_H = get_font('segoeuib.ttf', 22)
F_TITLE_H = get_font('segoeuib.ttf', 48)
F_SUB_H = get_font('segoeui.ttf', 24)

# ─────────────────────────────────────────────────────────────────────────────
# LEVEL DATA DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────
L1_SOLUTION = [
    (4,2),(4,3),(4,4),(3,4),(2,4),(2,3),(3,3),(3,2),(2,2),(2,1),
    (1,1),(1,2),(1,3),(1,4),(0,4),(0,3),(0,2),(0,1),(0,0),(1,0),
    (2,0),(3,0),(3,1),(4,1),(4,0)
]
L1_NODES = [{'num': 1, 'r': 4, 'c': 2}, {'num': 2, 'r': 1, 'c': 3}, {'num': 3, 'r': 4, 'c': 0}]
L1_WALLS = [(1,3, 2,3)]

L6_SOLUTION = [
    (1,1),(1,2),(2,2),(3,2),(3,3),(3,4),(2,4),(1,4),(0,4),(0,5),(1,5),(2,5),
    (3,5),(4,5),(5,5),(5,4),(4,4),(4,3),(5,3),(5,2),(4,2),(4,1),(5,1),(5,0),
    (4,0),(3,0),(3,1),(2,1),(2,0),(1,0),(0,0),(0,1),(0,2),(0,3),(1,3),(2,3)
]
L6_NODES = [{'num': 1, 'r': 1, 'c': 1}, {'num': 2, 'r': 2, 'c': 5}, {'num': 3, 'r': 5, 'c': 1}, {'num': 4, 'r': 2, 'c': 3}]
L6_WALLS = [(0,3, 0,4), (1,3, 1,4), (2,0, 3,0), (2,2, 2,3)]

L15_SOLUTION = [
    (2,1),(2,2),(1,2),(0,2),(0,3),(1,3),(2,3),(3,3),(3,2),(3,1),
    (4,1),(4,2),(4,3),(5,3),(5,2),(5,1),(5,0),(4,0),(3,0),(2,0),
    (1,0),(0,0),(0,1),(1,1),(1,4),(0,4),(0,5),(1,5),(2,5),(3,5),
    (4,5),(5,5),(5,4),(4,4),(3,4),(2,4)
]
L15_NODES = [
    {'num': 1, 'r': 2, 'c': 1}, {'num': 2, 'r': 3, 'c': 1}, {'num': 3, 'r': 5, 'c': 1},
    {'num': 4, 'r': 0, 'c': 0}, {'num': 5, 'r': 0, 'c': 4}, {'num': 6, 'r': 4, 'c': 5},
    {'num': 7, 'r': 2, 'c': 4}
]
L15_WALLS = [(2,4, 2,5), (3,0, 4,0), (4,2, 5,2)]

# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTIC IN-GAME WIN MODAL (Matches ZipGameScreen.jsx exactly)
# ─────────────────────────────────────────────────────────────────────────────
def get_win_modal_v(title="Level Complete!", sub="Clean solve! You're a natural.", time_str="0:11", coins=75):
    W_card, H_card = 760, 620
    card = Image.new('RGBA', (W_card, H_card), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    
    f_emoji = get_font('seguiemj.ttf', 44)
    f_title = get_font('segoeuib.ttf', 42)
    f_sub = get_font('segoeui.ttf', 22)
    f_btn = get_font('segoeuib.ttf', 24)
    
    # Card Box (#1c2d3a surfaceRaised, #2a3a4a border)
    draw.rounded_rectangle([(0, 0), (W_card-1, H_card-1)], radius=24, fill=(28, 45, 58, 250), outline=(42, 58, 74, 255), width=3)
    
    # Party Emoji
    draw.text((W_card//2 - 25, 25), chr(127881), font=f_emoji, fill=(255, 255, 255, 255), embedded_color=True)
    
    # Title & Subtitle
    draw.text((W_card//2 - 150, 90), title, font=f_title, fill=(255, 255, 255, 255))
    draw.text((W_card//2 - 150, 150), sub, font=f_sub, fill=(143, 163, 184, 255))
    draw.text((W_card//2 - 35, 185), f"0:{time_str[-2:]}", font=f_sub, fill=(143, 163, 184, 255))
    
    # Coin Reward Badge (+75 Coins Earned!)
    draw.rounded_rectangle([(W_card//2 - 150, 225), (W_card//2 + 150, 275)], radius=20, fill=(35, 50, 65, 255), outline=(251, 191, 36, 255), width=2)
    draw.text((W_card//2 - 115, 238), f"+{coins} Coins Earned!", font=f_btn, fill=(251, 191, 36, 255))
    
    # Hint tag
    draw.text((W_card//2 - 125, 290), "4 more levels for a hint", font=f_sub, fill=(143, 163, 184, 255))
    
    # Action Buttons: Retry & Next
    draw.rounded_rectangle([(50, 335), (350, 405)], radius=25, fill=(22, 33, 43, 255), outline=(42, 58, 74, 255), width=2)
    draw.text((150, 355), "Retry", font=f_btn, fill=(255, 255, 255, 255))
    
    draw.rounded_rectangle([(410, 335), (710, 405)], radius=25, fill=(77, 169, 255, 255))
    draw.text((520, 355), "Next >", font=f_btn, fill=(15, 25, 35, 255))
    
    # 2x Rewarded Ad Button
    draw.rounded_rectangle([(50, 425), (710, 505)], radius=25, fill=(16, 185, 129, 255))
    draw.text((160, 450), f"Watch Ad * 2x Coins (+{coins})", font=f_btn, fill=(255, 255, 255, 255))
    
    # Store Download Callout
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
    
    # Buttons
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

# ─────────────────────────────────────────────────────────────────────────────
# 1. VIDEO 2 (9:16, 15s) — ASMR Multi-Level Flow (Level 1 -> Level 6)
# ─────────────────────────────────────────────────────────────────────────────
def build_video_02():
    print("\n--- Generating Video 2: ASMR Multi-Level Flow (1080x1920, 15s) ---")
    raw_mp4 = os.path.join(VIDEO_DIR, 'raw_v2.mp4')
    final_mp4 = os.path.join(VIDEO_DIR, 'video_02_asmr_flow_1080x1920.mp4')
    wav_path = os.path.join(VIDEO_DIR, 'audio_v2.wav')
    
    total_frames = 15 * FPS
    sr = 44100
    audio = np.zeros(sr * 15, dtype=np.float32)
    
    # Audio: Soothing lofi + continuous rhythmic click-clacks
    t = np.linspace(0, 15, sr * 15, endpoint=False)
    audio += 0.03 * np.sin(2 * np.pi * 55.0 * t)  # deep A bass drone
    for i in range(25):
        st = (i / 25.0) * 5.0
        idx = int(st * sr)
        audio[idx:idx + int(0.04 * sr)] += 0.20 * np.sin(2 * np.pi * (350 + i * 25) * np.linspace(0, 0.04, int(0.04 * sr), endpoint=False))
    # Fanfare 1 at 5.5s
    for f in [440, 554, 659]:
        audio[int(5.5*sr):int(5.5*sr)+int(1.2*sr)] += 0.12 * np.sin(2 * np.pi * f * np.linspace(0, 1.2, int(1.2*sr), endpoint=False))
    # Clicks for level 6 (7.5s - 12.5s)
    for i in range(36):
        st = 7.5 + (i / 36.0) * 4.8
        idx = int(st * sr)
        audio[idx:idx + int(0.04 * sr)] += 0.22 * np.sin(2 * np.pi * (400 + i * 20) * np.linspace(0, 0.04, int(0.04 * sr), endpoint=False))
    # Final Fanfare at 12.5s
    for f in [523, 659, 783, 1046]:
        audio[int(12.5*sr):int(12.5*sr)+int(2.2*sr)] += 0.15 * np.sin(2 * np.pi * f * np.linspace(0, 2.2, int(2.2*sr), endpoint=False))
        
    audio = np.clip(audio, -1.0, 1.0)
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes((audio * 32767).astype(np.int16).tobytes())
        
    # Render Frames
    vw = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), float(FPS), (1080, 1920))
    card_bgr, card_alpha, W_card, H_card = get_win_modal_v("Level Cleared!", "Clean solve! You're a natural.", "0:12", 75)

    
    # Pre-render base background
    base_pil = Image.new('RGB', (1080, 1920), (15, 25, 35))
    draw_b = ImageDraw.Draw(base_pil)
    draw_b.text(((1080 - 450) // 2, 100), "RELAXING ASMR FLOW", font=F_BADGE_V, fill=(56, 189, 248))
    draw_b.text(((1080 - 740) // 2, 160), "SATISFYING NUMBER LINK", font=F_TITLE_V, fill=(255, 255, 255))
    draw_b.text(((1080 - 480) // 2, 245), "Smooth Drawing  •  Zero Stress Timers", font=F_SUB_V, fill=(143, 163, 184))
    base_bgr = np.array(base_pil)[:, :, ::-1].copy()
    
    for f in range(total_frames):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        if sec < 6.5:
            # Level 1 (5x5)
            size = 5
            b_w = 600
            cell = b_w / size
            bx = (1080 - b_w) // 2
            by = 560
            sol = L1_SOLUTION
            nodes = L1_NODES
            walls = L1_WALLS
            
            p = min(1.0, sec / 5.0)
            n_cells = max(1, int(p * len(sol)))
            cur_pts = [(int(bx + c * cell + cell/2), int(by + r * cell + cell/2)) for (r, c) in sol[:n_cells]]
            lvl_text = "Level 1: Quick 5x5 Starter"
        else:
            # Level 6 (6x6)
            size = 6
            b_w = 660
            cell = b_w / size
            bx = (1080 - b_w) // 2
            by = 560
            sol = L6_SOLUTION
            nodes = L6_NODES
            walls = L6_WALLS
            
            p = min(1.0, (sec - 7.2) / 5.2) if sec >= 7.2 else 0.0
            n_cells = max(1, int(p * len(sol)))
            cur_pts = [(int(bx + c * cell + cell/2), int(by + r * cell + cell/2)) for (r, c) in sol[:n_cells]]
            lvl_text = "Level 6: 6x6 Cyber Grid"
            
        # Draw board card
        cv2.rectangle(frame, (bx - 16, by - 16), (bx + b_w + 16, by + b_w + 16), (43, 33, 22), -1)
        cv2.rectangle(frame, (bx - 16, by - 16), (bx + b_w + 16, by + b_w + 16), (74, 58, 42), 2)
        
        # Grid lines
        for i in range(size + 1):
            cv2.line(frame, (bx, int(by + i * cell)), (bx + b_w, int(by + i * cell)), (74, 58, 42), 2)
            cv2.line(frame, (int(bx + i * cell), by), (int(bx + i * cell), by + b_w), (74, 58, 42), 2)
            
        # Walls
        for (r1, c1, r2, c2) in walls:
            if r1 == r2:
                wx = int(bx + max(c1, c2) * cell)
                cv2.line(frame, (wx, int(by + r1 * cell + 6)), (wx, int(by + (r1 + 1) * cell - 6)), (255, 255, 255), 8, lineType=cv2.LINE_AA)
            else:
                wy = int(by + max(r1, r2) * cell)
                cv2.line(frame, (int(bx + c1 * cell + 6), wy), (int(bx + (c1 + 1) * cell - 6), wy), (255, 255, 255), 8, lineType=cv2.LINE_AA)
                
        # Path
        if len(cur_pts) >= 1:
            for pt in cur_pts:
                r_c = ((pt[1] - by) // int(cell), (pt[0] - bx) // int(cell))
                cv2.rectangle(frame, (int(bx + r_c[1] * cell + 3), int(by + r_c[0] * cell + 3)), (int(bx + (r_c[1] + 1) * cell - 3), int(by + (r_c[0] + 1) * cell - 3)), (255, 169, 77), -1)
        if len(cur_pts) >= 2:
            for i in range(len(cur_pts) - 1):
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 203, 142), int(cell * 0.36), lineType=cv2.LINE_AA)
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 169, 77), int(cell * 0.16), lineType=cv2.LINE_AA)
                
        # Nodes
        for n in nodes:
            cx = int(bx + n['c'] * cell + cell/2)
            cy = int(by + n['r'] * cell + cell/2)
            is_reached = (n['r'], n['c']) in sol[:len(cur_pts)]
            cv2.circle(frame, (cx, cy), 32, (255, 169, 77) if is_reached else (58, 45, 28), -1, lineType=cv2.LINE_AA)
            cv2.circle(frame, (cx, cy), 32, (255, 169, 77) if is_reached else (74, 58, 42), 2, lineType=cv2.LINE_AA)
            cv2.putText(frame, str(n['num']), (cx - 10, cy + 10), cv2.FONT_HERSHEY_DUPLEX, 0.9, (35, 25, 15) if is_reached else (255, 255, 255), 2, cv2.LINE_AA)
            
        # Text under board
        cv2.putText(frame, lvl_text, ((1080 - 420) // 2, by + b_w + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (56, 189, 248), 2, cv2.LINE_AA)
        
        # Authentic Win Modal (12.5s - 15.0s)
        if sec >= 12.5:
            for i in range(35):
                seed = i * 137 + f * 7
                px = (seed * 19) % 1080
                py = (seed * 31 + int((sec - 12.5) * 600)) % 1920
                pcol = (248, 189, 56) if i % 2 == 0 else (36, 191, 251)
                cv2.circle(frame, (px, py), 7, pcol, -1, lineType=cv2.LINE_AA)
            mx1 = (1080 - W_card) // 2
            my1 = 1220
            mx2 = mx1 + W_card
            my2 = my1 + H_card
            frame[my1:my2, mx1:mx2] = (card_bgr * card_alpha + frame[my1:my2, mx1:mx2] * (1.0 - card_alpha)).astype(np.uint8)

            
        vw.write(frame)
    vw.release()
    
    # FFmpeg multiplex
    subprocess.run([
        FFMPEG_EXE, '-y', '-i', raw_mp4, '-i', wav_path, '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', final_mp4
    ], capture_output=True, check=True)
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    print(f"[DONE] Video 2 created: {final_mp4} ({os.path.getsize(final_mp4)/(1024*1024):.2f} MB)")

# ─────────────────────────────────────────────────────────────────────────────
# 2. VIDEO 3 (9:16, 15s) — Expert Brain Challenge (Level 15 with 7 Nodes)
# ─────────────────────────────────────────────────────────────────────────────
def build_video_03():
    print("\n--- Generating Video 3: Expert IQ Challenge Level 15 (1080x1920, 15s) ---")
    raw_mp4 = os.path.join(VIDEO_DIR, 'raw_v3.mp4')
    final_mp4 = os.path.join(VIDEO_DIR, 'video_03_hard_iq_level15_1080x1920.mp4')
    wav_path = os.path.join(VIDEO_DIR, 'audio_v3.wav')
    
    total_frames = 15 * FPS
    sr = 44100
    audio = np.zeros(sr * 15, dtype=np.float32)
    t = np.linspace(0, 15, sr * 15, endpoint=False)
    # Ticking clock heartbeat synth
    for i in range(15):
        idx = int(i * sr)
        audio[idx:idx + int(0.08 * sr)] += 0.25 * np.sin(2 * np.pi * 120 * np.linspace(0, 0.08, int(0.08 * sr), endpoint=False)) * np.exp(-np.linspace(0, 0.08, int(0.08 * sr)) * 30)
    # Clicks for 36 steps (1.0s to 11.0s)
    for i in range(36):
        st = 1.0 + (i / 36.0) * 10.0
        idx = int(st * sr)
        audio[idx:idx + int(0.04 * sr)] += 0.22 * np.sin(2 * np.pi * (380 + i * 25) * np.linspace(0, 0.04, int(0.04 * sr), endpoint=False))
    # Grand Fanfare at 11.0s
    for f in [587, 739, 880, 1174]:
        audio[int(11.0*sr):int(11.0*sr)+int(3.5*sr)] += 0.16 * np.sin(2 * np.pi * f * np.linspace(0, 3.5, int(3.5*sr), endpoint=False))
        
    audio = np.clip(audio, -1.0, 1.0)
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes((audio * 32767).astype(np.int16).tobytes())
        
    vw = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), float(FPS), (1080, 1920))
    card_bgr, card_alpha, W_card, H_card = get_win_modal_v("Level Complete!", "Master solve! Clean IQ 140+ run.", "0:11", 75)

    
    base_pil = Image.new('RGB', (1080, 1920), (15, 25, 35))
    draw_b = ImageDraw.Draw(base_pil)
    draw_b.text(((1080 - 450) // 2, 100), "🔥 IMPOSSIBLE LEVEL?", font=F_BADGE_V, fill=(248, 113, 113))
    draw_b.text(((1080 - 780) // 2, 160), "ONLY 1% REACH LEVEL 15", font=F_TITLE_V, fill=(255, 255, 255))
    draw_b.text(((1080 - 520) // 2, 245), "7 Number Nodes  •  Tight Wall Barriers", font=F_SUB_V, fill=(251, 191, 36))
    base_bgr = np.array(base_pil)[:, :, ::-1].copy()
    
    size = 6
    b_w = 660
    cell = b_w / size
    bx = (1080 - b_w) // 2
    by = 560
    
    for f in range(total_frames):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        cv2.rectangle(frame, (bx - 16, by - 16), (bx + b_w + 16, by + b_w + 16), (43, 33, 22), -1)
        cv2.rectangle(frame, (bx - 16, by - 16), (bx + b_w + 16, by + b_w + 16), (74, 58, 42), 2)
        
        for i in range(size + 1):
            cv2.line(frame, (bx, int(by + i * cell)), (bx + b_w, int(by + i * cell)), (74, 58, 42), 2)
            cv2.line(frame, (int(bx + i * cell), by), (int(bx + i * cell), by + b_w), (74, 58, 42), 2)
            
        for (r1, c1, r2, c2) in L15_WALLS:
            if r1 == r2:
                wx = int(bx + max(c1, c2) * cell)
                cv2.line(frame, (wx, int(by + r1 * cell + 6)), (wx, int(by + (r1 + 1) * cell - 6)), (255, 255, 255), 8, lineType=cv2.LINE_AA)
            else:
                wy = int(by + max(r1, r2) * cell)
                cv2.line(frame, (int(bx + c1 * cell + 6), wy), (int(bx + (c1 + 1) * cell - 6), wy), (255, 255, 255), 8, lineType=cv2.LINE_AA)
                
        # Path animation (1s to 11s)
        p = min(1.0, max(0.0, (sec - 1.0) / 10.0))
        n_cells = max(1, int(p * len(L15_SOLUTION)))
        cur_pts = [(int(bx + c * cell + cell/2), int(by + r * cell + cell/2)) for (r, c) in L15_SOLUTION[:n_cells]]
        
        for pt in cur_pts:
            r_c = ((pt[1] - by) // int(cell), (pt[0] - bx) // int(cell))
            cv2.rectangle(frame, (int(bx + r_c[1] * cell + 3), int(by + r_c[0] * cell + 3)), (int(bx + (r_c[1] + 1) * cell - 3), int(by + (r_c[0] + 1) * cell - 3)), (255, 169, 77), -1)
            
        if len(cur_pts) >= 2:
            for i in range(len(cur_pts) - 1):
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 203, 142), int(cell * 0.36), lineType=cv2.LINE_AA)
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 169, 77), int(cell * 0.16), lineType=cv2.LINE_AA)
                
        # Nodes 1 to 7
        for n in L15_NODES:
            cx = int(bx + n['c'] * cell + cell/2)
            cy = int(by + n['r'] * cell + cell/2)
            is_reached = (n['r'], n['c']) in L15_SOLUTION[:len(cur_pts)]
            cv2.circle(frame, (cx, cy), 32, (255, 169, 77) if is_reached else (58, 45, 28), -1, lineType=cv2.LINE_AA)
            cv2.circle(frame, (cx, cy), 32, (255, 169, 77) if is_reached else (74, 58, 42), 2, lineType=cv2.LINE_AA)
            cv2.putText(frame, str(n['num']), (cx - 10, cy + 10), cv2.FONT_HERSHEY_DUPLEX, 0.9, (35, 25, 15) if is_reached else (255, 255, 255), 2, cv2.LINE_AA)
            
        st_txt = f"Connecting: 1 -> 7  •  {len(cur_pts)}/36 cells" if len(cur_pts) < 36 else "MASTER SOLVE! IQ 140+"
        cv2.putText(frame, st_txt, ((1080 - 450) // 2, by + b_w + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (153, 211, 52) if len(cur_pts) == 36 else (184, 163, 143), 2, cv2.LINE_AA)
        
        # Authentic Win Modal (11.0s - 15.0s)
        if sec >= 11.0:
            for i in range(35):
                seed = i * 137 + f * 7
                px = (seed * 19) % 1080
                py = (seed * 31 + int((sec - 11.0) * 600)) % 1920
                pcol = (248, 189, 56) if i % 2 == 0 else (36, 191, 251)
                cv2.circle(frame, (px, py), 7, pcol, -1, lineType=cv2.LINE_AA)
            mx1 = (1080 - W_card) // 2
            my1 = 1220
            mx2 = mx1 + W_card
            my2 = my1 + H_card
            frame[my1:my2, mx1:mx2] = (card_bgr * card_alpha + frame[my1:my2, mx1:mx2] * (1.0 - card_alpha)).astype(np.uint8)

            
        vw.write(frame)
    vw.release()
    
    subprocess.run([
        FFMPEG_EXE, '-y', '-i', raw_mp4, '-i', wav_path, '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', final_mp4
    ], capture_output=True, check=True)
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    print(f"[DONE] Video 3 created: {final_mp4} ({os.path.getsize(final_mp4)/(1024*1024):.2f} MB)")

# ─────────────────────────────────────────────────────────────────────────────
# 3. VIDEO 4 (16:9 Landscape, 20s) — Progression: Starter vs Master
# ─────────────────────────────────────────────────────────────────────────────
def build_video_04():
    print("\n--- Generating Video 4: Progression Split Screen (1920x1080, 20s) ---")
    raw_mp4 = os.path.join(VIDEO_DIR, 'raw_v4.mp4')
    final_mp4 = os.path.join(VIDEO_DIR, 'video_04_progression_1920x1080.mp4')
    wav_path = os.path.join(VIDEO_DIR, 'audio_v4.wav')
    
    total_frames = 20 * FPS
    sr = 44100
    audio = np.zeros(sr * 20, dtype=np.float32)
    t = np.linspace(0, 20, sr * 20, endpoint=False)
    audio += 0.04 * np.sin(2 * np.pi * 65.41 * t)
    
    # Left solve clicks (0-6s)
    for i in range(25):
        st = (i / 25.0) * 5.5
        idx = int(st * sr)
        audio[idx:idx + int(0.04 * sr)] += 0.20 * np.sin(2 * np.pi * (400 + i * 20) * np.linspace(0, 0.04, int(0.04 * sr), endpoint=False))
    # Right solve clicks (6s - 15s)
    for i in range(36):
        st = 6.0 + (i / 36.0) * 9.0
        idx = int(st * sr)
        audio[idx:idx + int(0.04 * sr)] += 0.22 * np.sin(2 * np.pi * (350 + i * 25) * np.linspace(0, 0.04, int(0.04 * sr), endpoint=False))
    # Fanfare at 15.5s
    for f in [523, 659, 783, 1046]:
        audio[int(15.5*sr):int(15.5*sr)+int(3.5*sr)] += 0.15 * np.sin(2 * np.pi * f * np.linspace(0, 3.5, int(3.5*sr), endpoint=False))
        
    audio = np.clip(audio, -1.0, 1.0)
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes((audio * 32767).astype(np.int16).tobytes())
        
    vw = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), float(FPS), (1920, 1080))
    card_bgr_h, card_alpha_h, W_card_h, H_card_h = get_win_modal_h("Level Complete!", "Master solve! Level 15 Cleared.", "0:15", 75)

    
    base_pil = Image.new('RGB', (1920, 1080), (15, 25, 35))
    draw_b = ImageDraw.Draw(base_pil)
    draw_b.text(((1920 - 450) // 2, 40), "BRAIN PROGRESSION CHALLENGE", font=F_BADGE_H, fill=(56, 189, 248))
    draw_b.text(((1920 - 640) // 2, 80), "EASY TO LEARN • HARD TO MASTER", font=F_TITLE_H, fill=(255, 255, 255))
    
    # Left Header: Level 1
    draw_b.text((250, 170), "LEVEL 1 (STARTER 5x5)", font=F_BADGE_H, fill=(74, 222, 128))
    # Right Header: Level 15
    draw_b.text((1200, 170), "LEVEL 15 (MASTER 6x6)", font=F_BADGE_H, fill=(248, 113, 113))
    
    base_bgr = np.array(base_pil)[:, :, ::-1].copy()
    
    # Left board: 5x5
    b_w1 = 520; cell1 = b_w1 / 5; bx1 = 180; by1 = 230
    # Right board: 6x6
    b_w2 = 540; cell2 = b_w2 / 6; bx2 = 1180; by2 = 230
    
    for f in range(total_frames):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        # Draw Left Board
        cv2.rectangle(frame, (bx1 - 12, by1 - 12), (bx1 + b_w1 + 12, by1 + b_w1 + 12), (43, 33, 22), -1)
        cv2.rectangle(frame, (bx1 - 12, by1 - 12), (bx1 + b_w1 + 12, by1 + b_w1 + 12), (74, 58, 42), 2)
        for i in range(6):
            cv2.line(frame, (bx1, int(by1 + i * cell1)), (bx1 + b_w1, int(by1 + i * cell1)), (74, 58, 42), 1)
            cv2.line(frame, (int(bx1 + i * cell1), by1), (int(bx1 + i * cell1), by1 + b_w1), (74, 58, 42), 1)
        for (r1, c1, r2, c2) in L1_WALLS:
            wx = int(bx1 + max(c1, c2) * cell1)
            cv2.line(frame, (wx, int(by1 + r1 * cell1 + 4)), (wx, int(by1 + (r1 + 1) * cell1 - 4)), (255, 255, 255), 6, lineType=cv2.LINE_AA)
            
        p1 = min(1.0, sec / 5.5)
        n1 = max(1, int(p1 * len(L1_SOLUTION)))
        cur_pts1 = [(int(bx1 + c * cell1 + cell1/2), int(by1 + r * cell1 + cell1/2)) for (r, c) in L1_SOLUTION[:n1]]
        for pt in cur_pts1:
            r_c = ((pt[1] - by1) // int(cell1), (pt[0] - bx1) // int(cell1))
            cv2.rectangle(frame, (int(bx1 + r_c[1] * cell1 + 3), int(by1 + r_c[0] * cell1 + 3)), (int(bx1 + (r_c[1] + 1) * cell1 - 3), int(by1 + (r_c[0] + 1) * cell1 - 3)), (255, 169, 77), -1)
        if len(cur_pts1) >= 2:
            for i in range(len(cur_pts1) - 1):
                cv2.line(frame, cur_pts1[i], cur_pts1[i+1], (255, 203, 142), int(cell1 * 0.32), lineType=cv2.LINE_AA)
                cv2.line(frame, cur_pts1[i], cur_pts1[i+1], (255, 169, 77), int(cell1 * 0.14), lineType=cv2.LINE_AA)
        for n in L1_NODES:
            cx = int(bx1 + n['c'] * cell1 + cell1/2); cy = int(by1 + n['r'] * cell1 + cell1/2)
            cv2.circle(frame, (cx, cy), 24, (255, 169, 77) if (n['r'], n['c']) in L1_SOLUTION[:n1] else (58, 45, 28), -1, lineType=cv2.LINE_AA)
            cv2.putText(frame, str(n['num']), (cx - 8, cy + 8), cv2.FONT_HERSHEY_DUPLEX, 0.7, (35, 25, 15) if (n['r'], n['c']) in L1_SOLUTION[:n1] else (255, 255, 255), 2, cv2.LINE_AA)
            
        # Draw Right Board
        cv2.rectangle(frame, (bx2 - 12, by2 - 12), (bx2 + b_w2 + 12, by2 + b_w2 + 12), (43, 33, 22), -1)
        cv2.rectangle(frame, (bx2 - 12, by2 - 12), (bx2 + b_w2 + 12, by2 + b_w2 + 12), (74, 58, 42), 2)
        for i in range(7):
            cv2.line(frame, (bx2, int(by2 + i * cell2)), (bx2 + b_w2, int(by2 + i * cell2)), (74, 58, 42), 1)
            cv2.line(frame, (int(bx2 + i * cell2), by2), (int(bx2 + i * cell2), by2 + b_w2), (74, 58, 42), 1)
        for (r1, c1, r2, c2) in L15_WALLS:
            if r1 == r2:
                wx = int(bx2 + max(c1, c2) * cell2)
                cv2.line(frame, (wx, int(by2 + r1 * cell2 + 4)), (wx, int(by2 + (r1 + 1) * cell2 - 4)), (255, 255, 255), 6, lineType=cv2.LINE_AA)
            else:
                wy = int(by2 + max(r1, r2) * cell2)
                cv2.line(frame, (int(bx2 + c1 * cell2 + 4), wy), (int(bx2 + (c1 + 1) * cell2 - 4), wy), (255, 255, 255), 6, lineType=cv2.LINE_AA)
                
        p2 = min(1.0, max(0.0, (sec - 6.0) / 9.0))
        n2 = max(1, int(p2 * len(L15_SOLUTION)))
        cur_pts2 = [(int(bx2 + c * cell2 + cell2/2), int(by2 + r * cell2 + cell2/2)) for (r, c) in L15_SOLUTION[:n2]]
        for pt in cur_pts2:
            r_c = ((pt[1] - by2) // int(cell2), (pt[0] - bx2) // int(cell2))
            cv2.rectangle(frame, (int(bx2 + r_c[1] * cell2 + 3), int(by2 + r_c[0] * cell2 + 3)), (int(bx2 + (r_c[1] + 1) * cell2 - 3), int(by2 + (r_c[0] + 1) * cell2 - 3)), (255, 169, 77), -1)
        if len(cur_pts2) >= 2:
            for i in range(len(cur_pts2) - 1):
                cv2.line(frame, cur_pts2[i], cur_pts2[i+1], (255, 203, 142), int(cell2 * 0.32), lineType=cv2.LINE_AA)
                cv2.line(frame, cur_pts2[i], cur_pts2[i+1], (255, 169, 77), int(cell2 * 0.14), lineType=cv2.LINE_AA)
        for n in L15_NODES:
            cx = int(bx2 + n['c'] * cell2 + cell2/2); cy = int(by2 + n['r'] * cell2 + cell2/2)
            cv2.circle(frame, (cx, cy), 22, (255, 169, 77) if (n['r'], n['c']) in L15_SOLUTION[:n2] else (58, 45, 28), -1, lineType=cv2.LINE_AA)
            cv2.putText(frame, str(n['num']), (cx - 7, cy + 7), cv2.FONT_HERSHEY_DUPLEX, 0.6, (35, 25, 15) if (n['r'], n['c']) in L15_SOLUTION[:n2] else (255, 255, 255), 2, cv2.LINE_AA)
            
        # Left Board Solved Indicator (sec >= 5.5)
        if sec >= 5.5:
            cv2.rectangle(frame, (bx1 + 100, by1 + 220), (bx1 + 420, by1 + 290), (43, 33, 22), -1)
            cv2.rectangle(frame, (bx1 + 100, by1 + 220), (bx1 + 420, by1 + 290), (129, 185, 16), 2)
            cv2.putText(frame, "Level 1 Cleared! *", (bx1 + 120, by1 + 265), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
            
        # Authentic Win Modal (15.0s - 20.0s)
        if sec >= 15.0:
            overlay = np.full_like(frame, (10, 18, 26), dtype=np.uint8)
            alpha_dim = min(0.70, (sec - 15.0) * 1.5)
            frame = cv2.addWeighted(overlay, alpha_dim, frame, 1.0 - alpha_dim, 0)
            for i in range(40):
                seed = i * 137 + f * 7
                px = (seed * 19) % 1920
                py = (seed * 31 + int((sec - 15.0) * 550)) % 1080
                pcol = (248, 189, 56) if i % 2 == 0 else (36, 191, 251)
                cv2.circle(frame, (px, py), 7, pcol, -1, lineType=cv2.LINE_AA)
            mx1 = (1920 - W_card_h) // 2
            my1 = (1080 - H_card_h) // 2
            mx2 = mx1 + W_card_h
            my2 = my1 + H_card_h
            frame[my1:my2, mx1:mx2] = (card_bgr_h * card_alpha_h + frame[my1:my2, mx1:mx2] * (1.0 - card_alpha_h)).astype(np.uint8)
        else:
            cv2.putText(frame, "100% OFFLINE READY  •  DAILY SPIN REWARDS  •  NO HIGH PRESSURE TIMERS", (340, 890), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (184, 163, 143), 2, cv2.LINE_AA)

            
        vw.write(frame)
    vw.release()
    
    subprocess.run([
        FFMPEG_EXE, '-y', '-i', raw_mp4, '-i', wav_path, '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', final_mp4
    ], capture_output=True, check=True)
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    print(f"[DONE] Video 4 created: {final_mp4} ({os.path.getsize(final_mp4)/(1024*1024):.2f} MB)")

# ─────────────────────────────────────────────────────────────────────────────
# 4. VIDEO 5 (16:9 Landscape, 15s) — Widescreen Zen Showcase
# ─────────────────────────────────────────────────────────────────────────────
def build_video_05():
    print("\n--- Generating Video 5: Widescreen Zen Showcase (1920x1080, 15s) ---")
    raw_mp4 = os.path.join(VIDEO_DIR, 'raw_v5.mp4')
    final_mp4 = os.path.join(VIDEO_DIR, 'video_05_zen_widescreen_1920x1080.mp4')
    wav_path = os.path.join(VIDEO_DIR, 'audio_v5.wav')
    
    total_frames = 15 * FPS
    sr = 44100
    audio = np.zeros(sr * 15, dtype=np.float32)
    t = np.linspace(0, 15, sr * 15, endpoint=False)
    # Deep calming drone + gentle harmonics
    audio += 0.05 * np.sin(2 * np.pi * 110.0 * t) + 0.03 * np.sin(2 * np.pi * 164.81 * t)
    for i in range(36):
        st = 1.0 + (i / 36.0) * 10.5
        idx = int(st * sr)
        audio[idx:idx + int(0.05 * sr)] += 0.18 * np.sin(2 * np.pi * (300 + i * 15) * np.linspace(0, 0.05, int(0.05 * sr), endpoint=False))
    for f in [440, 554, 659, 880]:
        audio[int(12.0*sr):int(12.0*sr)+int(2.8*sr)] += 0.14 * np.sin(2 * np.pi * f * np.linspace(0, 2.8, int(2.8*sr), endpoint=False))
        
    audio = np.clip(audio, -1.0, 1.0)
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes((audio * 32767).astype(np.int16).tobytes())
        
    vw = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), float(FPS), (1920, 1080))
    
    base_pil = Image.new('RGB', (1920, 1080), (15, 25, 35))
    draw_b = ImageDraw.Draw(base_pil)
    
    # Left Hero Text
    draw_b.text((120, 260), "PURE LOGIC • ZERO PRESSURE", font=F_BADGE_H, fill=(74, 222, 128))
    draw_b.text((120, 320), "RELAX YOUR MIND", font=F_TITLE_H, fill=(255, 255, 255))
    draw_b.text((120, 390), "NUMBER LINK PUZZLE", font=F_TITLE_H, fill=(56, 189, 248))
    draw_b.text((120, 480), "Connect all pairs without crossing lines.\nCalming cyber dark aesthetic with smooth haptics.\nPlay anywhere, anytime — 100% offline ready.", font=F_SUB_H, fill=(184, 163, 143))
    draw_b.text((120, 620), "Rated 4.9 by Solvers  •  1,000+ Logic Grids", font=F_BADGE_H, fill=(251, 191, 36))
    
    base_bgr = np.array(base_pil)[:, :, ::-1].copy()
    
    # Right Board (Level 6)
    b_w = 660; cell = b_w / 6; bx = 1120; by = 210
    
    for f in range(total_frames):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        cv2.rectangle(frame, (bx - 16, by - 16), (bx + b_w + 16, by + b_w + 16), (43, 33, 22), -1)
        cv2.rectangle(frame, (bx - 16, by - 16), (bx + b_w + 16, by + b_w + 16), (74, 58, 42), 2)
        for i in range(7):
            cv2.line(frame, (bx, int(by + i * cell)), (bx + b_w, int(by + i * cell)), (74, 58, 42), 2)
            cv2.line(frame, (int(bx + i * cell), by), (int(bx + i * cell), by + b_w), (74, 58, 42), 2)
        for (r1, c1, r2, c2) in L6_WALLS:
            if r1 == r2:
                wx = int(bx + max(c1, c2) * cell)
                cv2.line(frame, (wx, int(by + r1 * cell + 6)), (wx, int(by + (r1 + 1) * cell - 6)), (255, 255, 255), 8, lineType=cv2.LINE_AA)
            else:
                wy = int(by + max(r1, r2) * cell)
                cv2.line(frame, (int(bx + c1 * cell + 6), wy), (int(bx + (c1 + 1) * cell - 6), wy), (255, 255, 255), 8, lineType=cv2.LINE_AA)
                
        p = min(1.0, max(0.0, (sec - 1.0) / 10.5))
        n_cells = max(1, int(p * len(L6_SOLUTION)))
        cur_pts = [(int(bx + c * cell + cell/2), int(by + r * cell + cell/2)) for (r, c) in L6_SOLUTION[:n_cells]]
        
        for pt in cur_pts:
            r_c = ((pt[1] - by) // int(cell), (pt[0] - bx) // int(cell))
            cv2.rectangle(frame, (int(bx + r_c[1] * cell + 3), int(by + r_c[0] * cell + 3)), (int(bx + (r_c[1] + 1) * cell - 3), int(by + (r_c[0] + 1) * cell - 3)), (255, 169, 77), -1)
        if len(cur_pts) >= 2:
            for i in range(len(cur_pts) - 1):
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 203, 142), int(cell * 0.36), lineType=cv2.LINE_AA)
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 169, 77), int(cell * 0.16), lineType=cv2.LINE_AA)
                
        for n in L6_NODES:
            cx = int(bx + n['c'] * cell + cell/2); cy = int(by + n['r'] * cell + cell/2)
            is_reached = (n['r'], n['c']) in L6_SOLUTION[:len(cur_pts)]
            cv2.circle(frame, (cx, cy), 32, (255, 169, 77) if is_reached else (58, 45, 28), -1, lineType=cv2.LINE_AA)
            cv2.putText(frame, str(n['num']), (cx - 10, cy + 10), cv2.FONT_HERSHEY_DUPLEX, 0.9, (35, 25, 15) if is_reached else (255, 255, 255), 2, cv2.LINE_AA)
            
        # Left CTA Button
        cv2.rectangle(frame, (120, 700), (580, 780), (129, 185, 16), -1)
        cv2.putText(frame, "INSTALL FREE NOW >", (160, 755), cv2.FONT_HERSHEY_DUPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)
        
        vw.write(frame)
    vw.release()
    
    subprocess.run([
        FFMPEG_EXE, '-y', '-i', raw_mp4, '-i', wav_path, '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
        '-b:a', '192k', '-shortest', final_mp4
    ], capture_output=True, check=True)
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    print(f"[DONE] Video 5 created: {final_mp4} ({os.path.getsize(final_mp4)/(1024*1024):.2f} MB)")

if __name__ == '__main__':
    build_video_02()
    build_video_03()
    build_video_04()
    build_video_05()
    print("\n[ALL COMPLETE] All 4 new videos rendered and ready for YouTube!")
