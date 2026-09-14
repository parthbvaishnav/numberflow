import os
from PIL import Image, ImageDraw

source_img_path = r"C:\Users\Parth\.gemini\antigravity-ide\brain\74ac4e83-410d-4ed5-a5d1-694d76f560b7\number_link_app_icon_1789357910751.jpg"
res_dir = r"d:\PC\RN\numberflow\android\app\src\main\res"

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

img = Image.open(source_img_path).convert("RGBA")

# 1. Save 512x512 Play Store icon
play_icon = img.resize((512, 512), Image.Resampling.LANCZOS)
play_icon_path = os.path.join(res_dir, "play_store_512.png")
play_icon.save(play_icon_path, format="PNG")
play_icon_root = r"d:\PC\RN\numberflow\play_store_512.png"
play_icon.save(play_icon_root, format="PNG")
print(f"Saved Play Store 512x512 icon to {play_icon_path}")

# Function to create circular mask for round icon
def make_round(im, size):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    resized = im.resize((size, size), Image.Resampling.LANCZOS)
    output.paste(resized, (0, 0), mask)
    return output

# 2. Save mipmaps
for folder, size in sizes.items():
    target_folder = os.path.join(res_dir, folder)
    os.makedirs(target_folder, exist_ok=True)
    
    # Square / standard launcher
    sq = img.resize((size, size), Image.Resampling.LANCZOS)
    sq.save(os.path.join(target_folder, "ic_launcher.png"), format="PNG")
    
    # Round launcher
    rd = make_round(img, size)
    rd.save(os.path.join(target_folder, "ic_launcher_round.png"), format="PNG")
    print(f"Updated {folder}: {size}x{size}")

print("All Android launcher icons updated successfully!")
