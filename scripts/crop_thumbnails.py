"""
드래곤 빌리지 3 카테고리 대표 배지 크롭 스크립트
- 입력: c:\Antigravity\카드교환소\이미지\KakaoTalk_20260604_202516419_XX.png
- 출력: c:\Antigravity\카드교환소\public\sticker_images\thumb_XX.png
- 배지 위치: 이미지 좌상단 둥근 아이콘 영역
"""

from PIL import Image
import os

# 경로 설정
SRC_DIR = r"c:\Antigravity\카드교환소\이미지"
OUT_DIR = r"c:\Antigravity\카드교환소\public\sticker_images"
PREFIX = "KakaoTalk_20260604_202516419_"

# 카테고리 이미지 인덱스 목록 (03 ~ 22)
CATEGORY_IMAGES = [
    "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18",
    "19", "20", "21", "22"
]

# 출력 폴더 생성
os.makedirs(OUT_DIR, exist_ok=True)

def get_crop_box(img_width, img_height):
    """
    배지는 이미지 내 게임 팝업창의 좌상단에 위치.
    이미지 비율 기준으로 크롭 좌표 계산:
    - 배지 left:  약 7.5%
    - 배지 top:   약 10.5%
    - 배지 right: 약 32%
    - 배지 bottom: 약 27%
    """
    x1 = int(img_width * 0.075)
    y1 = int(img_height * 0.105)
    x2 = int(img_width * 0.320)
    y2 = int(img_height * 0.270)
    return (x1, y1, x2, y2)

results = []

for idx in CATEGORY_IMAGES:
    src_path = os.path.join(SRC_DIR, f"{PREFIX}{idx}.png")
    out_path = os.path.join(OUT_DIR, f"thumb_{idx}.png")
    
    if not os.path.exists(src_path):
        print(f"[SKIP] 파일 없음: {src_path}")
        continue
    
    with Image.open(src_path) as img:
        w, h = img.size
        box = get_crop_box(w, h)
        cropped = img.crop(box)
        
        # 정사각형으로 리사이즈 (200x200)
        cropped = cropped.resize((200, 200), Image.LANCZOS)
        cropped.save(out_path, "PNG", optimize=True)
        results.append((idx, w, h, box, out_path))
        print(f"[OK] {idx}.png  ({w}x{h}) → crop{box} → {out_path}")

print(f"\n완료! 총 {len(results)}개 썸네일 저장됨.")
print(f"저장 위치: {OUT_DIR}")
