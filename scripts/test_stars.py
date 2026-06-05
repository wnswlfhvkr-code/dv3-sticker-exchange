from PIL import Image
import numpy as np
import os

# 이미지가 있는 디렉토리
IMAGE_DIR = r"c:\Antigravity\카드교환소\이미지"

# 20.png 로드
img_path = os.path.join(IMAGE_DIR, "KakaoTalk_20260604_202516419_20.png")
img = Image.open(img_path)
w, h = img.size
print(f"Image Size: {w}x{h}")

# numpy array로 변환 (RGB)
arr = np.array(img)

# 노란색 필터링 (R, G가 높고 B가 낮은 영역)
# R > 200, G > 180, B < 100 조건으로 테스트
r = arr[:, :, 0]
g = arr[:, :, 1]
b = arr[:, :, 2]
yellow_mask = (r > 200) & (g > 180) & (b < 120)

# 9개 슬롯의 대략적인 별 위치 (x1, y1, x2, y2)
# 이미지의 전체 높이가 2316이고 너비가 1080인 경우
# 슬롯의 노란 별 위치를 확인해보자.
# 20.png의 1번(피어나는 꽃) 별은 대략 어디 있을까?
# 3성 별 개수 검출을 위해 슬롯별 y1, y2, x1, x2 범위를 좀 더 정밀하게 확인한다.
# 스티커 팝업 이미지 구조상,
# 1행의 첫 카드(피어나는 꽃) 상단 별은 Y=620~700, X=110~360 정도에 위치할 것이다.
slots = [
    # Row 1
    (110, 620, 360, 700),
    (410, 620, 660, 700),
    (710, 620, 960, 700),
    # Row 2
    (110, 1020, 360, 1100),
    (410, 1020, 660, 1100),
    (710, 1020, 960, 1100),
    # Row 3
    (110, 1420, 360, 1500),
    (410, 1420, 660, 1500),
    (710, 1420, 960, 1500)
]

os.makedirs("debug_stars", exist_ok=True)

for i, box in enumerate(slots):
    x1, y1, x2, y2 = box
    crop_mask = yellow_mask[y1:y2, x1:x2]
    # 노란색 픽셀 수
    yellow_pixels = np.sum(crop_mask)
    print(f"Slot {i+1}: Yellow Pixels = {yellow_pixels}")
    # 크롭 저장
    crop_img = Image.fromarray(arr[y1:y2, x1:x2])
    crop_img.save(f"debug_stars/slot_{i+1}.png")
