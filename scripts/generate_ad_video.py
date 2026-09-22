import os
import math
import struct
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

W, H = 1080, 1920
FPS = 30
TOTAL_SECONDS = 15
TOTAL_FRAMES = FPS * TOTAL_SECONDS

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

F_BADGE = get_font('segoeuib.ttf', 26)
F_TITLE = get_font('segoeuib.ttf', 62)
F_SUB = get_font('segoeui.ttf', 32)
F_STATUS = get_font('segoeui.ttf', 26)
F_ALERT = get_font('segoeuib.ttf', 44)
F_CTA = get_font('segoeuib.ttf', 36)
F_PROOF = get_font('segoeuib.ttf', 28)

SIZE = 6
BOARD_W = 660
CELL = BOARD_W / SIZE
BOARD_X = (W - BOARD_W) // 2
BOARD_Y = 560

NODES = [
    {'num': 1, 'r': 1, 'c': 1},
    {'num': 2, 'r': 2, 'c': 5},
    {'num': 3, 'r': 5, 'c': 1},
    {'num': 4, 'r': 2, 'c': 3}
]

SOLUTION = [
    (1,1),(1,2),(2,2),(3,2),(3,3),(3,4),(2,4),(1,4),(0,4),(0,5),(1,5),(2,5),
    (3,5),(4,5),(5,5),(5,4),(4,4),(4,3),(5,3),(5,2),(4,2),(4,1),(5,1),(5,0),
    (4,0),(3,0),(3,1),(2,1),(2,0),(1,0),(0,0),(0,1),(0,2),(0,3),(1,3),(2,3)
]

WALL_SET = [
    (0,3, 0,4), (1,3, 1,4), (2,0, 3,0), (2,2, 2,3)
]

def draw_star(draw, cx, cy, r_outer, r_inner, fill):
    points = []
    for i in range(10):
        angle = i * math.pi / 5 - math.pi / 2
        r = r_outer if i % 2 == 0 else r_inner
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=fill)

def create_base_canvas():
    print("Pre-rendering static background template...")
    base = Image.new('RGB', (W, H), (15, 25, 35))
    draw = ImageDraw.Draw(base)
    
    # Ambient radial gradient
    cx, cy = W // 2, H // 2
    for r in range(700, 0, -40):
        alpha = int(40 * (1 - r / 700.0))
        # blend with base
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(18 + alpha // 4, 30 + alpha // 2, 45 + alpha))
        
    # Top Header
    b_text = "⚡ BRAIN IQ CHALLENGE"
    bw = 360
    draw.rounded_rectangle([(W - bw) // 2, 80, (W + bw) // 2, 135], radius=28, fill=(18, 45, 68), outline=(56, 189, 248), width=2)
    bbox = F_BADGE.getbbox(b_text)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 94), b_text, font=F_BADGE, fill=(56, 189, 248))
    
    t_text = "CAN YOU REACH NODE 4?"
    t_box = F_TITLE.getbbox(t_text)
    tw = t_box[2] - t_box[0]
    draw.text(((W - tw) // 2, 160), t_text, font=F_TITLE, fill=(255, 255, 255))
    
    s_text = "95% of players get blocked on Level 6!"
    s_box = F_SUB.getbbox(s_text)
    sw = s_box[2] - s_box[0]
    draw.text(((W - sw) // 2, 240), s_text, font=F_SUB, fill=(251, 191, 36))
    
    # Top Bar Card (#16212b)
    tb_w = BOARD_W + 40
    tb_x = (W - tb_w) // 2
    tb_y = 330
    draw.rounded_rectangle([tb_x, tb_y, tb_x + tb_w, tb_y + 70], radius=16, fill=(22, 33, 43), outline=(42, 58, 74), width=2)
    draw.ellipse([tb_x + 15, tb_y + 16, tb_x + 55, tb_y + 56], fill=(28, 45, 58), outline=(42, 58, 74), width=1)
    draw.text((tb_x + 28, tb_y + 18), "‹", font=F_TITLE, fill=(255, 255, 255))
    
    draw.rounded_rectangle([tb_x + 80, tb_y + 16, tb_x + 220, tb_y + 54], radius=18, fill=(28, 45, 58), outline=(42, 58, 74), width=1)
    draw.text((tb_x + 105, tb_y + 22), "Level 6", font=F_BADGE, fill=(255, 255, 255))
    draw.text((tb_x + 250, tb_y + 22), "⏱ 0:11", font=F_BADGE, fill=(143, 163, 184))
    
    draw.rounded_rectangle([tb_x + 480, tb_y + 16, tb_x + 600, tb_y + 54], radius=18, fill=(28, 45, 58), outline=(42, 58, 74), width=1)
    draw.text((tb_x + 495, tb_y + 22), "🪙 172", font=F_BADGE, fill=(255, 255, 255))
    
    # Board Card Outer (#16212b)
    card_pad = 20
    draw.rounded_rectangle([BOARD_X - card_pad, BOARD_Y - card_pad, BOARD_X + BOARD_W + card_pad, BOARD_Y + BOARD_W + card_pad], radius=24, fill=(22, 33, 43), outline=(42, 58, 74), width=3)
    
    # Grid Lines (#2a3a4a)
    for i in range(SIZE + 1):
        draw.line([(BOARD_X, BOARD_Y + i * CELL), (BOARD_X + BOARD_W, BOARD_Y + i * CELL)], fill=(42, 58, 74), width=2)
        draw.line([(BOARD_X + i * CELL, BOARD_Y), (BOARD_X + i * CELL, BOARD_Y + BOARD_W)], fill=(42, 58, 74), width=2)
        
    # White Barrier Walls
    for (r1, c1, r2, c2) in WALL_SET:
        if r1 == r2:
            cc = max(c1, c2)
            wx = BOARD_X + cc * CELL
            wy1 = BOARD_Y + r1 * CELL + 8
            wy2 = BOARD_Y + (r1 + 1) * CELL - 8
            draw.line([(wx, wy1), (wx, wy2)], fill=(255, 255, 255), width=8)
        else:
            rr = max(r1, r2)
            wy = BOARD_Y + rr * CELL
            wx1 = BOARD_X + c1 * CELL + 8
            wx2 = BOARD_X + (c1 + 1) * CELL - 8
            draw.line([(wx1, wy), (wx2, wy)], fill=(255, 255, 255), width=8)
            
    # Bottom In-game Action Bar
    bb_w = BOARD_W + 40
    bb_x = (W - bb_w) // 2
    bb_y = 1390
    draw.rounded_rectangle([bb_x, bb_y, bb_x + 90, bb_y + 70], radius=35, fill=(28, 45, 58), outline=(42, 58, 74), width=2)
    draw.text((bb_x + 35, bb_y + 16), "↺", font=F_BADGE, fill=(255, 255, 255))
    
    draw.rounded_rectangle([bb_x + 110, bb_y, bb_x + 460, bb_y + 70], radius=35, fill=(77, 169, 255), outline=(77, 169, 255), width=2)
    draw.text((bb_x + 220, bb_y + 18), "Hint 4 💡", font=F_BADGE, fill=(15, 25, 35))
    
    draw.rounded_rectangle([bb_x + 480, bb_y, bb_x + bb_w, bb_y + 70], radius=35, fill=(28, 45, 58), outline=(42, 58, 74), width=2)
    draw.text((bb_x + 530, bb_y + 18), "Skip", font=F_BADGE, fill=(143, 163, 184))
    
    return np.array(base)[:, :, ::-1].copy()  # Convert to BGR for OpenCV

# Synthesize Audio Track
def generate_audio(wav_path):
    print("Synthesizing audio track with haptics & fanfare...")
    sr = 44100
    total = sr * TOTAL_SECONDS
    audio = np.zeros(total, dtype=np.float32)
    
    t = np.linspace(0, TOTAL_SECONDS, total, endpoint=False)
    # Lofi background beat
    audio += 0.04 * np.sin(2 * np.pi * 65.41 * t)
    for beat in range(TOTAL_SECONDS * 2):
        st = beat * 0.5
        idx = int(st * sr)
        dur = int(0.2 * sr)
        sub_t = np.linspace(0, 0.2, dur, endpoint=False)
        env = np.exp(-sub_t * 12)
        audio[idx:idx + dur] += 0.05 * np.sin(2 * np.pi * 261.63 * sub_t) * env
        
    # Fast path draw clicks (0s - 3.5s)
    for i in range(25):
        st = (i / 25.0) * 3.5
        idx = int(st * sr)
        dur = int(0.04 * sr)
        sub_t = np.linspace(0, 0.04, dur, endpoint=False)
        audio[idx:idx + dur] += 0.20 * np.sin(2 * np.pi * (400 + i * 18) * sub_t) * np.exp(-sub_t * 40)
        
    # Wall collision buzzer (3.8s)
    idx_b = int(3.8 * sr)
    dur_b = int(0.35 * sr)
    sub_t = np.linspace(0, 0.35, dur_b, endpoint=False)
    audio[idx_b:idx_b + dur_b] += 0.35 * (np.sin(2 * np.pi * 140 * sub_t) + 0.5 * np.sin(2 * np.pi * 146 * sub_t)) * np.exp(-sub_t * 6)
    
    # Smart solve clicks (6.5s - 10.2s)
    for i in range(11):
        st = 6.5 + (i / 11.0) * 3.7
        idx = int(st * sr)
        dur = int(0.05 * sr)
        sub_t = np.linspace(0, 0.05, dur, endpoint=False)
        audio[idx:idx + dur] += 0.22 * np.sin(2 * np.pi * (520 + i * 35) * sub_t) * np.exp(-sub_t * 30)
        
    # Victory Fanfare (10.5s)
    idx_w = int(10.5 * sr)
    for f in [523.25, 659.25, 783.99, 1046.50]:
        dur = int(2.5 * sr)
        sub_t = np.linspace(0, 2.5, dur, endpoint=False)
        audio[idx_w:idx_w + dur] += 0.16 * np.sin(2 * np.pi * f * sub_t) * np.exp(-sub_t * 1.5)
        
    audio = np.clip(audio, -1.0, 1.0)
    pcm = (audio * 32767).astype(np.int16)
    
    with wave.open(wav_path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())

def generate_video():
    raw_mp4 = os.path.join(VIDEO_DIR, 'temp_raw.mp4')
    final_mp4 = os.path.join(VIDEO_DIR, 'video_01_hook_challenge_1080x1920.mp4')
    wav_path = os.path.join(VIDEO_DIR, 'temp_audio.wav')
    
    generate_audio(wav_path)
    base_bgr = create_base_canvas()
    
    print(f"Rendering {TOTAL_FRAMES} frames ({TOTAL_SECONDS}s @ {FPS}fps)...")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    vw = cv2.VideoWriter(raw_mp4, fourcc, float(FPS), (W, H))
    
    # Precompute cell centers in pixels
    centers = [(int(BOARD_X + c * CELL + CELL / 2), int(BOARD_Y + r * CELL + CELL / 2)) for (r, c) in SOLUTION]
    
    for f in range(TOTAL_FRAMES):
        sec = f / float(FPS)
        frame = base_bgr.copy()
        
        # Path logic
        if sec < 3.5:
            p = sec / 3.5
            n = max(1, min(25, int(p * 25) + 1))
            cur_pts = centers[:n]
            hand = cur_pts[-1]
            status_txt = f"Next: node 4  •  {n}/36 cells filled"
            status_color = (184, 163, 143)  # BGR muted
            wall_hit = False
            win_state = False
        elif sec < 5.2:
            cur_pts = centers[:25]
            # Hand moves towards blocked wall at right
            hand = (int(BOARD_X + 2.5 * CELL), int(BOARD_Y + 2.5 * CELL))
            status_txt = "Next: node 4  •  25/36 cells filled"
            status_color = (184, 163, 143)
            wall_hit = True
            win_state = False
        elif sec < 6.5:
            cur_pts = centers[:25]
            hand = centers[24]
            status_txt = "Next: node 4  •  25/36 cells filled"
            status_color = (184, 163, 143)
            wall_hit = False
            win_state = False
        elif sec < 10.5:
            p = (sec - 6.5) / 4.0
            n = min(36, 25 + int(p * 11) + 1)
            cur_pts = centers[:n]
            hand = cur_pts[-1]
            status_txt = f"Next: node 4  •  {n}/36 cells filled"
            status_color = (184, 163, 143) if n < 36 else (153, 211, 52)
            wall_hit = False
            win_state = False
        else:
            cur_pts = centers
            hand = None
            status_txt = "Level Complete!  •  36/36 cells filled"
            status_color = (153, 211, 52)  # Green in BGR
            wall_hit = False
            win_state = True
            
        # Draw Visited Tiles & Glowing Path
        if len(cur_pts) >= 1:
            for pt in cur_pts:
                # fill cell tile with subtle blue glow
                r_c = ((pt[1] - BOARD_Y) // int(CELL), (pt[0] - BOARD_X) // int(CELL))
                x1 = int(BOARD_X + r_c[1] * CELL + 4)
                y1 = int(BOARD_Y + r_c[0] * CELL + 4)
                x2 = int(BOARD_X + (r_c[1] + 1) * CELL - 4)
                y2 = int(BOARD_Y + (r_c[0] + 1) * CELL - 4)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 169, 77), -1)  # Light cyan overlay
                
        if len(cur_pts) >= 2:
            # Outer glow
            for i in range(len(cur_pts) - 1):
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 203, 142), int(CELL * 0.38), lineType=cv2.LINE_AA)
            # Inner solid line
            for i in range(len(cur_pts) - 1):
                cv2.line(frame, cur_pts[i], cur_pts[i+1], (255, 169, 77), int(CELL * 0.16), lineType=cv2.LINE_AA)
                
        # Draw Wall Highlight if hit
        if wall_hit:
            # Flashing red wall segment between (2,2) and (2,3)
            wx = int(BOARD_X + 3 * CELL)
            wy1 = int(BOARD_Y + 2 * CELL + 8)
            wy2 = int(BOARD_Y + 3 * CELL - 8)
            cv2.line(frame, (wx, wy1), (wx, wy2), (68, 68, 239), 12, lineType=cv2.LINE_AA)
            
        # Draw Nodes (1, 2, 3, 4)
        for n in NODES:
            cx = int(BOARD_X + n['c'] * CELL + CELL / 2)
            cy = int(BOARD_Y + n['r'] * CELL + CELL / 2)
            is_reached = (n['r'], n['c']) in SOLUTION[:len(cur_pts)]
            
            node_col = (255, 169, 77) if is_reached else (58, 45, 28)
            border_col = (255, 169, 77) if is_reached else (74, 58, 42)
            cv2.circle(frame, (cx, cy), 34, node_col, -1, lineType=cv2.LINE_AA)
            cv2.circle(frame, (cx, cy), 34, border_col, 3, lineType=cv2.LINE_AA)
            # Number text
            txt_col = (35, 25, 15) if is_reached else (255, 255, 255)
            cv2.putText(frame, str(n['num']), (cx - 10, cy + 10), cv2.FONT_HERSHEY_DUPLEX, 0.9, txt_col, 2, cv2.LINE_AA)
            
        # Draw Status Text
        cv2.putText(frame, status_txt, ((W - 460) // 2, int(BOARD_Y + BOARD_W + 50)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2, cv2.LINE_AA)
        
        # Hand pointer
        if hand:
            hx, hy = hand
            cv2.circle(frame, (hx, hy), 20, (248, 189, 56), -1, lineType=cv2.LINE_AA)
            cv2.circle(frame, (hx, hy), 22, (255, 255, 255), 2, lineType=cv2.LINE_AA)
            
        # Alert Overlays
        if wall_hit:
            # Pulsing Red Banner
            bx1, by1 = (W - 580) // 2, 1260
            bx2, by2 = (W + 580) // 2, 1360
            cv2.rectangle(frame, (bx1, by1), (bx2, by2), (38, 38, 220), -1)
            cv2.rectangle(frame, (bx1, by1), (bx2, by2), (255, 255, 255), 3)
            cv2.putText(frame, "BLOCKED BY WALL! X", (bx1 + 30, by1 + 65), cv2.FONT_HERSHEY_DUPLEX, 1.3, (255, 255, 255), 3, cv2.LINE_AA)
            
        if 8.2 <= sec < 10.5:
            bx1, by1 = (W - 540) // 2, 1260
            bx2, by2 = (W + 540) // 2, 1360
            cv2.rectangle(frame, (bx1, by1), (bx2, by2), (129, 185, 16), -1)
            cv2.rectangle(frame, (bx1, by1), (bx2, by2), (255, 255, 255), 3)
            cv2.putText(frame, "GENIUS MOVE! *** ", (bx1 + 40, by1 + 65), cv2.FONT_HERSHEY_DUPLEX, 1.3, (255, 255, 255), 3, cv2.LINE_AA)
            
        if win_state:
            # Confetti particles
            for i in range(35):
                seed = i * 137 + f * 7
                px = (seed * 19) % W
                py = (seed * 31 + int((sec - 10.5) * 600)) % H
                pcol = (248, 189, 56) if i % 2 == 0 else (36, 191, 251)
                cv2.circle(frame, (px, py), 7, pcol, -1, lineType=cv2.LINE_AA)
                
            # Win Modal Overlay (#16212b)
            mx1, my1 = (W - 740) // 2, 1220
            mx2, my2 = (W + 740) // 2, 1720
            cv2.rectangle(frame, (mx1, my1), (mx2, my2), (43, 33, 22), -1)
            cv2.rectangle(frame, (mx1, my1), (mx2, my2), (248, 189, 56), 3)
            
            cv2.putText(frame, "Level Complete!", (mx1 + 170, my1 + 80), cv2.FONT_HERSHEY_DUPLEX, 1.5, (255, 255, 255), 3, cv2.LINE_AA)
            cv2.putText(frame, "Clean solve! You're a natural.", (mx1 + 140, my1 + 140), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (184, 163, 143), 2, cv2.LINE_AA)
            cv2.putText(frame, "Time: 0:14  •  +75 Coins Earned!", (mx1 + 110, my1 + 200), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (56, 191, 251), 2, cv2.LINE_AA)
            
            # Star rating
            cv2.putText(frame, "***** Rated 4.9 by Solvers", (mx1 + 150, my1 + 280), cv2.FONT_HERSHEY_DUPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
            
            # Big Pulsing Green CTA Button
            btn_x1, btn_y1 = mx1 + 50, my1 + 340
            btn_x2, btn_y2 = mx2 - 50, my1 + 440
            cv2.rectangle(frame, (btn_x1, btn_y1), (btn_x2, btn_y2), (129, 185, 16), -1)
            cv2.rectangle(frame, (btn_x1, btn_y1), (btn_x2, btn_y2), (255, 255, 255), 3)
            cv2.putText(frame, "INSTALL FREE NOW >", (btn_x1 + 60, btn_y1 + 65), cv2.FONT_HERSHEY_DUPLEX, 1.3, (255, 255, 255), 3, cv2.LINE_AA)
            
        vw.write(frame)
        
    vw.release()
    print("[SUCCESS] Frames rendered into temp video.")
    
    # Multiplex Video + Audio using FFmpeg
    print("Encoding final H.264 MP4 with AAC audio...")
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', raw_mp4,
        '-i', wav_path,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        final_mp4
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("[ERROR] FFmpeg multiplexing error:", res.stderr)
        raise RuntimeError("FFmpeg error")
        
    if os.path.exists(raw_mp4): os.remove(raw_mp4)
    if os.path.exists(wav_path): os.remove(wav_path)
    
    mb = os.path.getsize(final_mp4) / (1024 * 1024)
    print(f"\n[DONE] Final YouTube / Google Ads Video ready: {final_mp4}")
    print(f"       Resolution: 1080x1920 (9:16 Shorts) | Length: 15s | Size: {mb:.2f} MB")

if __name__ == '__main__':
    generate_video()
