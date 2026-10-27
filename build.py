#!/usr/bin/env python3
"""Package OmniSearch for the Chrome Web Store: build/omnisearch-<version>.zip"""
import json
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent
FILES = ["manifest.json", "background.js", "sidepanel.html", "sidepanel.css", "sidepanel.js",
         "welcome.html", "welcome.css", "welcome.js", "LICENSE"]
DIRS = ["lib", "icons", "_locales"]


def main():
    version = json.loads((ROOT / "manifest.json").read_text())["version"]
    out = ROOT / "build" / f"omnisearch-{version}.zip"
    out.parent.mkdir(exist_ok=True)
    paths = [ROOT / f for f in FILES]
    for d in DIRS:
        paths += sorted(p for p in (ROOT / d).rglob("*") if p.is_file())
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in paths:
            z.write(p, p.relative_to(ROOT).as_posix())
    print(f"{out.relative_to(ROOT)}: {len(paths)} files, {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
