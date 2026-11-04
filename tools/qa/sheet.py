# usage: python3 sheet.py DIR from to [step] [cols] → DIR/sheet-from-to.jpg (번호를 붙인 축소 화면 모음)
import sys, os
from PIL import Image, ImageDraw
d, a, z = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); step = int(sys.argv[4]) if len(sys.argv) > 4 else 1; cols = int(sys.argv[5]) if len(sys.argv) > 5 else 4
fr = [i for i in range(a, z + 1, step) if os.path.exists(f'{d}/{i:04d}.jpg')]
W, H = 330, 185; rows = (len(fr) + cols - 1) // cols
S = Image.new('RGB', (W * cols, H * rows), 'black'); g = ImageDraw.Draw(S)
for k, i in enumerate(fr):
    im = Image.open(f'{d}/{i:04d}.jpg').resize((W, H)); x, y = (k % cols) * W, (k // cols) * H; S.paste(im, (x, y))
    g.rectangle([x, y, x + 44, y + 16], fill='black'); g.text((x + 3, y + 2), str(i), fill='yellow')
S.save(f'{d}/sheet-{a}-{z}.jpg', quality=80); print(f'{d}/sheet-{a}-{z}.jpg')
