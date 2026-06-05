from PIL import Image
import os

IMAGE_DIR = r"c:\Antigravity\카드교환소\이미지"
# 03.png ~ 22.png
images = [f"KakaoTalk_20260604_202516419_{i:02d}.png" for i in range(3, 23)]

# 9개 슬롯의 별 영역
# 20.png의 노란 픽셀 검출 테스트에서 Y=620~700, X=110~360이 슬롯 1이었다.
# 카드의 가로 폭은 대략 250px, 세로 높이는 380px 정도이다.
# 각 슬롯의 정확한 별 크롭 영역을 잡아서 합쳐보자.
# 별 영역 크기: 가로 220, 세로 60
slots_offsets = [
    # Row 1
    (130, 620), (430, 620), (730, 620),
    # Row 2
    (130, 1020), (430, 1020), (730, 1020),
    # Row 3
    (130, 1420), (430, 1420), (730, 1420)
]

# 20개 카테고리 x 9개 슬롯 = 180개 별 영역을 15x12 그리드로 합친다.
grid_w = 220
grid_h = 60
cols = 9
rows = 20

merged_img = Image.new("RGB", (grid_w * cols, grid_h * rows), "black")

for r_idx, img_name in enumerate(images):
    img_path = os.path.join(IMAGE_DIR, img_name)
    if not os.path.exists(img_path):
        print(f"Missing: {img_name}")
        continue
    
    img = Image.open(img_path)
    for c_idx, (x, y) in enumerate(slots_offsets):
        # 크롭
        crop_box = (x, y, x + grid_w, y + grid_h)
        star_crop = img.crop(crop_box)
        # 병합 이미지에 복사
        merged_img.paste(star_crop, (c_idx * grid_w, r_idx * grid_h))

# 결과 저장
merged_img.save("stars_grid_all.png")
print("Saved stars_grid_all.png")
