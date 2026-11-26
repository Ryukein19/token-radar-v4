#!/usr/bin/env python3
"""Re-render the Token Radar v4 screenshots from the real dashboard.

Serves an output dir over HTTP on 127.0.0.1, captures 1440x900 with the
Playwright chrome-headless-shell, then size-tunes each file with PIL into
the 300-350 KB band. Usage:

    python3 shoot.py [--out DIR] [--dest DIR] [--port N]

Defaults: --out /tmp/v4-shoot (built by main.ts first), --dest ./screenshots.
"""
import argparse
import os
import subprocess
import sys
import time
import urllib.request

from PIL import Image

SHELL = os.path.expanduser(
    "~/.cache/ms-playwright/chromium_headless_shell-1255"
    "/chrome-headless-shell-linux64/chrome-headless-shell"
)
VIEWS = [
    ("1-board.png", "/dashboard/"),
    ("2-detail.jpg", "/dashboard/?view=detail&expand=b14g"),
    ("3-filtered.png", "/dashboard/?tier=Early&sort=perhour"),
]
W, H = 1440, 900
LO, HI = 300_000, 350_000


def tune_png(src: str, dest: str) -> int:
    im = Image.open(src)
    assert im.size == (W, H), f"{src} is {im.size}, expected {(W, H)}"
    im.save(dest, optimize=True)
    n = os.path.getsize(dest)
    if n > HI:
        # flat-colour dashboard: adaptive palette keeps it honest and small
        im.convert("P", palette=Image.ADAPTIVE, colors=256).save(dest, optimize=True)
        n = os.path.getsize(dest)
    if n < LO:
        im.save(dest, optimize=False)
        n = os.path.getsize(dest)
    return n


def tune_jpg(src: str, dest: str) -> int:
    im = Image.open(src).convert("RGB")
    assert im.size == (W, H), f"{src} is {im.size}, expected {(W, H)}"
    # JPEG size is steep in quality here (q93 ~290K, q96 ~358K): scan by 1.
    best = None
    for q in range(88, 98):
        im.save(dest, quality=q, optimize=True)
        n = os.path.getsize(dest)
        if LO <= n <= HI:
            return n
        if best is None or abs(n - (LO + HI) / 2) < abs(best[1] - (LO + HI) / 2):
            best = (q, n)
    # nothing landed in band: keep the closest scan point
    q, n = best
    im.save(dest, quality=q, optimize=True)
    return os.path.getsize(dest)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="/tmp/v4-shoot")
    ap.add_argument("--dest", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots"))
    ap.add_argument("--port", type=int, default=8931)
    args = ap.parse_args()

    srv = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(args.port), "--bind", "127.0.0.1"],
        cwd=args.out,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        base = f"http://127.0.0.1:{args.port}"
        for _ in range(50):
            try:
                urllib.request.urlopen(base + "/dashboard/", timeout=2)
                break
            except Exception:
                time.sleep(0.2)
        else:
            print("server did not come up", file=sys.stderr)
            return 1
        os.makedirs(args.dest, exist_ok=True)
        rows = []
        for name, path in VIEWS:
            raw = f"/tmp/shot-{name}.raw.png"
            cmd = [
                SHELL, "--headless", "--disable-gpu", "--no-sandbox",
                "--hide-scrollbars", "--force-device-scale-factor=1",
                f"--window-size={W},{H}", f"--screenshot={raw}",
                "--virtual-time-budget=8000", "--timeout=20000",
                base + path,
            ]
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if r.returncode != 0 or not os.path.exists(raw):
                print(f"capture failed for {name}:\n{r.stdout}\n{r.stderr}", file=sys.stderr)
                return 1
            dest = os.path.join(args.dest, name)
            n = tune_jpg(raw, dest) if name.endswith(".jpg") else tune_png(raw, dest)
            rows.append((name, n, "OK" if LO <= n <= HI else "OUT OF BAND"))
        for name, n, st in rows:
            print(f"{name}: {n} bytes [{st}]")
        return 0 if all(LO <= n <= HI for _, n, _ in rows) else 2
    finally:
        srv.terminate()


if __name__ == "__main__":
    raise SystemExit(main())
