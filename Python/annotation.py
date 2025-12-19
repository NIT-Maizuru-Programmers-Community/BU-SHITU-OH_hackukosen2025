import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image

# 画像の読み込み
image_path = "/Users/hiratasoma/Downloads/10F537A7-B7A3-42C2-83E7-8CB8691B451B_1_102_a.jpeg"
img = Image.open(image_path)
width, height = img.size

# 図の作成 (figsizeはあくまで表示領域の目安)
fig, ax = plt.subplots(figsize=(12, 8))
ax.imshow(img)

# 人物（白いパーカーの人）の座標
bbox_x_min = width * 0.385
bbox_y_min = height * 0.48
bbox_x_max = width * 0.445
bbox_y_max = height * 0.74

rect_width = bbox_x_max - bbox_x_min
rect_height = bbox_y_max - bbox_y_min

# バウンディングボックスの作成
box_color = '#00FF00' # Lime Green
rect = patches.Rectangle(
    (bbox_x_min, bbox_y_min),
    rect_width,
    rect_height,
    linewidth=2,
    edgecolor=box_color,
    facecolor='none'
)

# ボックスの追加
ax.add_patch(rect)

# ラベルの追加
label_text = "person 0.92"
ax.text(
    bbox_x_min,
    bbox_y_min - (height * 0.02),
    label_text,
    color='white',
    fontsize=10,
    weight='bold',
    bbox=dict(facecolor=box_color, edgecolor=box_color, alpha=1.0, pad=2)
)

# 軸を消す
plt.axis('off')

# --- 画質改善のポイント ---
# dpi=300 を指定して高解像度で保存します。
output_path = "annotated_person_high_res.jpg"
# bbox_inches='tight', pad_inches=0 で余白を極力カットします
plt.savefig(output_path, dpi=300, bbox_inches='tight', pad_inches=0)
# ------------------------
plt.close(fig) # メモリ解放