#!/usr/bin/env python3
"""
Encode an iPhone App Store **app preview** video for upload to App Store Connect.

Important (Apple, 2026):
- **Screenshots** for 6.5\" iPhone can be 1242×2688, 1284×2778, etc.
- **App preview videos** are *not* uploaded at those full pixel sizes. For modern
  iPhones (6.5\" and 6.9\" slots), Apple’s **accepted** preview resolution is:
  - Portrait: **886 × 1920**
  - Landscape: **1920 × 886**

See: https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications/

This script scales your Simulator screen recording to those accepted sizes using ffmpeg.

Requirements: ffmpeg on PATH (`brew install ffmpeg`).
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def main() -> int:
    p = argparse.ArgumentParser(
        description="Encode iPhone app preview to Apple-accepted 886×1920 (or 1920×886)."
    )
    p.add_argument("input", type=Path, help="Source .mov / .mp4 (Simulator recording)")
    p.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output .mp4 (default: <input_stem>-app-preview-iphone.mp4)",
    )
    p.add_argument(
        "--landscape",
        action="store_true",
        help="Output 1920×886 instead of 886×1920",
    )
    p.add_argument(
        "--start",
        type=float,
        default=None,
        help="Start time in seconds (ffmpeg -ss)",
    )
    p.add_argument(
        "--duration",
        type=float,
        default=None,
        help="Max duration in seconds (15–30 for App Store; ffmpeg -t)",
    )
    args = p.parse_args()

    if not args.input.is_file():
        print(f"Not found: {args.input}", file=sys.stderr)
        return 1

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print(
            "ffmpeg not found. Install: brew install ffmpeg",
            file=sys.stderr,
        )
        return 1

    out = args.output
    if out is None:
        out = args.input.with_name(
            f"{args.input.stem}-app-preview-iphone.mp4"
        )

    w, h = (1920, 886) if args.landscape else (886, 1920)

    # Scale to fit inside target box, pad if needed (keeps aspect ratio).
    vf = (
        f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black"
    )

    cmd = [
        ffmpeg,
        "-y",
    ]
    if args.start is not None:
        cmd += ["-ss", str(args.start)]
    cmd += ["-i", str(args.input)]
    if args.duration is not None:
        cmd += ["-t", str(args.duration)]
    cmd += [
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-profile:v",
        "high",
        "-level",
        "4.0",
        "-b:v",
        "11M",
        "-maxrate",
        "12M",
        "-bufsize",
        "24M",
        "-r",
        "30",
        "-c:a",
        "aac",
        "-b:a",
        "256k",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-movflags",
        "+faststart",
        str(out),
    ]

    print("Running:", " ".join(cmd))
    r = subprocess.run(cmd)
    if r.returncode != 0:
        return r.returncode

    print(f"\nWrote: {out}")
    print(f"Resolution: {w}×{h} ({'landscape' if args.landscape else 'portrait'})")
    print("Upload under the iPhone app preview slot in App Store Connect.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
