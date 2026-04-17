#!/usr/bin/env python3
"""
Prepare App Store Connect screenshots: validate dimensions against Apple specs,
optionally resize, and copy into screenshots/app-store/.

Apple reference (iPhone/iPad screenshot sizes):
  https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/

Accepted portrait sizes (examples):
  iPhone 6.9": 1260×2736, 1290×2796, 1320×2868
  iPhone 6.5": 1242×2688, 1284×2778
  iPad 13":     2048×2732, 2064×2752
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from PIL import Image

# Portrait (width, height) — Apple-accepted sizes for listing
IPHONE_69_ACCEPTED = {(1260, 2736), (1290, 2796), (1320, 2868)}
IPHONE_65_ACCEPTED = {(1242, 2688), (1284, 2778)}
IPAD_13_ACCEPTED = {(2048, 2732), (2064, 2752)}

def resize_to_fit(
    src: Path,
    dst: Path,
    target: tuple[int, int],
) -> None:
    im = Image.open(src)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA")
    if im.size == target:
        im.save(dst, "PNG", optimize=True)
        return
    out = im.resize(target, Image.Resampling.LANCZOS)
    out.save(dst, "PNG", optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate and prepare App Store screenshot PNGs."
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "screenshots",
        help="Folder containing iphone/ and ipad/ subfolders",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output base (default: <root>/app-store)",
    )
    parser.add_argument(
        "--iphone-display",
        choices=("6.9", "6.5"),
        default="6.9",
        help='iPhone screenshot slot to prepare ("6.9" or "6.5")',
    )
    parser.add_argument(
        "--iphone-target",
        type=str,
        default="1320x2868",
        help=(
            "Target size if resize needed for iPhone "
            "(e.g. 1320x2868 for 6.9, 1284x2778 or 1242x2688 for 6.5)"
        ),
    )
    parser.add_argument(
        "--ipad-target",
        type=str,
        default="2064x2752",
        help="Target size if resize needed for iPad (e.g. 2064x2752, 2048x2732)",
    )
    args = parser.parse_args()
    root: Path = args.root
    out_base: Path = args.out or (root / "app-store")

    def parse_pair(s: str) -> tuple[int, int]:
        a, b = s.lower().split("x")
        return int(a), int(b)

    iphone_target = parse_pair(args.iphone_target)
    ipad_target = parse_pair(args.ipad_target)
    iphone_accepted = IPHONE_69_ACCEPTED if args.iphone_display == "6.9" else IPHONE_65_ACCEPTED

    if iphone_target not in iphone_accepted:
        print(
            f"Warning: {iphone_target} is not in Apple's listed {args.iphone_display}\" sizes; "
            f"using anyway.",
            file=sys.stderr,
        )
    if ipad_target not in IPAD_13_ACCEPTED:
        print(
            f"Warning: {ipad_target} is not in Apple's listed 13\" sizes; "
            f"using anyway.",
            file=sys.stderr,
        )

    pairs = [
        ("iphone", root / "iphone", iphone_accepted, iphone_target),
        ("ipad", root / "ipad", IPAD_13_ACCEPTED, ipad_target),
    ]

    errors = 0
    for label, src_dir, accepted, chosen_target in pairs:
        if not src_dir.is_dir():
            print(f"Missing folder: {src_dir}", file=sys.stderr)
            errors += 1
            continue
        dest_dir = out_base / label
        dest_dir.mkdir(parents=True, exist_ok=True)
        pngs = sorted(src_dir.glob("*.png"))
        if not pngs:
            print(f"No PNGs in {src_dir}", file=sys.stderr)
            errors += 1
            continue
        for png in pngs:
            im = Image.open(png)
            w, h = im.size
            if (w, h) in accepted:
                shutil.copy2(png, dest_dir / png.name)
                print(f"OK {label}: {png.name} {w}×{h} (accepted — copy)")
            else:
                resize_to_fit(png, dest_dir / png.name, chosen_target)
                print(
                    f"OK {label}: {png.name} {w}×{h} → "
                    f"{chosen_target[0]}×{chosen_target[1]} (resized)"
                )

    if errors:
        return 1
    print(f"\nOutput: {out_base}/iphone/ and {out_base}/ipad/")
    print(
        f'Upload these PNGs in App Store Connect under {args.iphone_display}" iPhone and 13" iPad.'
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
