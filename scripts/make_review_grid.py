#!/usr/bin/env python3
"""Create a labeled visual review grid from rendered stills in out/biringan/stills/."""
import glob
import os
import sys
from PIL import Image, ImageDraw

stills_dir = sys.argv[1] if len(sys.argv) > 1 else "out/biringan/stills"
out_file = sys.argv[2] if len(sys.argv) > 2 else "out/biringan/stills_grid.jpg"
paths = sorted(glob.glob(os.path.join(stills_dir, "*.jpg")))
if not paths:
    sys.exit(f"No .jpg stills found in {stills_dir}")

cols = 5
rows = (len(paths) + cols - 1) // cols
cw, ch = 360, 640
pad = 10
grid = Image.new("RGB", (cols * cw + (cols + 1) * pad, rows * ch + (rows + 1) * pad), (24, 24, 28))
draw = ImageDraw.Draw(grid)

for idx, p in enumerate(paths):
    im = Image.open(p).convert("RGB").resize((cw, ch), Image.LANCZOS)
    c, r = idx % cols, idx // cols
    x = pad + c * (cw + pad)
    y = pad + r * (ch + pad)
    grid.paste(im, (x, y))
    label = os.path.basename(p).replace(".jpg", "")
    draw.rectangle([x, y, x + 210, y + 26], fill=(0, 0, 0))
    draw.text((x + 8, y + 6), label, fill=(255, 235, 80))

grid.save(out_file, quality=90)
print(f"Wrote {out_file} ({grid.size[0]}x{grid.size[1]}, {len(paths)} stills)")
