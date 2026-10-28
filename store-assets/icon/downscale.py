"""Downscale the 8x renders from render.cjs into icons/."""
import pathlib
from PIL import Image

ICONS = pathlib.Path(__file__).resolve().parents[2] / "icons"
for size in (16, 32, 48, 128):
    big = Image.open(f"/tmp/omnisearch-icon-{size}@8x.png").convert("RGBA")
    big.resize((size, size), Image.LANCZOS).save(ICONS / f"icon{size}.png", optimize=True)
    print(f"icons/icon{size}.png")
