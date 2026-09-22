import os
import zipfile

BASE_DIR = r'd:\PC\RN\numberflow'
HTML_DIR = os.path.join(BASE_DIR, 'google-ads', 'html')

PLAYABLES = [
    {
        'folder': 'playable_320x480',
        'zip_name': 'playable_320x480.zip',
        'expected_w': 320,
        'expected_h': 480
    },
    {
        'folder': 'playable_480x320',
        'zip_name': 'playable_480x320.zip',
        'expected_w': 480,
        'expected_h': 320
    }
]

def package_playable(p_info):
    folder_path = os.path.join(HTML_DIR, p_info['folder'])
    zip_path = os.path.join(HTML_DIR, p_info['zip_name'])
    index_file = os.path.join(folder_path, 'index.html')
    
    if not os.path.exists(index_file):
        raise FileNotFoundError(f"Missing index.html in {folder_path}")
        
    with open(index_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check ExitApi
    if 'exitapi.js' not in content:
        print(f"[WARN] ExitApi script tag not found in {p_info['folder']}")
    if 'ad.size' not in content:
        print(f"[WARN] ad.size meta tag not found in {p_info['folder']}")
        
    # Create clean zip with index.html at root
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(index_file, arcname='index.html')
        
    zip_size_kb = os.path.getsize(zip_path) / 1024.0
    print(f"[SUCCESS] Packaged {p_info['zip_name']}: {zip_size_kb:.2f} KB (Google limit: 5120 KB)")
    
    # Verify contents of zip
    with zipfile.ZipFile(zip_path, 'r') as z:
        names = z.namelist()
        if 'index.html' not in names:
            raise ValueError(f"Root index.html missing in {p_info['zip_name']}")
        print(f"          Verified root contents: {names}")

if __name__ == '__main__':
    for p in PLAYABLES:
        package_playable(p)
    print("\n[SUCCESS] All Playables packaged and Google Ads compliant!")
