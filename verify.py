#!/usr/bin/env python3
"""Replicate the 7 gate rows for a Token Radar v4 output dir (local check).

Usage: python3 verify.py <out-dir>
Checks (from BUILD.md verification):
 1. dashboard: 3 files, <= 65536 B total, no http(s) strings
 2. board: 198 rows, ranks 1..198, implied positive whole <= 1e14, non-rising,
    not all equal
 3. watchlist 40/40
 4. farm steps 3-12 x 20-600 chars per row
 5. screenshots: 3 x 1440x900, <= 512 KiB each
 6. dossier <= 1.5M B, dossier text <= 65536 B
 7. data.js checksum == sha256(board.json); data.js rows == board.json rows
Exit 0 only if every row passes.
"""
import hashlib
import json
import os
import re
import sys

from PIL import Image

out = sys.argv[1]
fails = []


def check(name, ok, detail=""):
    print(f"[{'PASS' if ok else 'FAIL'}] {name} {detail}")
    if not ok:
        fails.append(name)


dash = os.path.join(out, "dashboard")
files = sorted(os.listdir(dash))
total = sum(os.path.getsize(os.path.join(dash, f)) for f in files)
check("dashboard 3 files", len(files) == 3, f"({len(files)} files, {total} B)")
check("dashboard <= 65536 B", total <= 65536, f"({total} B)")
http = []
for f in files:
    t = open(os.path.join(dash, f), encoding="utf-8", errors="ignore").read()
    if re.search(r"https?://", t):
        http.append(f)
check("dashboard no http(s) strings", not http, f"({http})")

board = json.load(open(os.path.join(out, "board.json")))
rows = board["rows"]
check("board 198 rows", len(rows) == 198, f"({len(rows)})")
check("ranks 1..198", [r["rank"] for r in rows] == list(range(1, 199)))
impl = [r["implied_value_usd"] for r in rows]
check("implied positive whole <= 1e14",
      all(isinstance(v, int) and 0 < v <= 10**14 for v in impl))
check("implied non-rising", all(impl[i] <= impl[i - 1] for i in range(1, len(impl))))
check("implied not all equal", len(set(impl)) > 1, f"({len(set(impl))} distinct)")
check("watchlist 40/40",
      sum(1 for r in rows if r["tier"] == "Watchlist") == 40)
steps_ok = all(3 <= len(r["farm_steps"]) <= 12 and
               all(20 <= len(s) <= 600 for s in r["farm_steps"]) for r in rows)
check("farm steps 3-12 x 20-600 chars", steps_ok)

shots = os.path.join(out, "screenshots")
sfiles = sorted(os.listdir(shots))
check("screenshots 3 files", len(sfiles) == 3, f"({sfiles})")
for f in sfiles:
    p = os.path.join(shots, f)
    im = Image.open(p)
    check(f"screenshot {f} 1440x900 <= 512 KiB",
          im.size == (1440, 900) and os.path.getsize(p) <= 512 * 1024,
          f"({im.size}, {os.path.getsize(p)} B)")

dos = json.load(open(os.path.join(out, "dossier.json")))
dsize = os.path.getsize(os.path.join(out, "dossier.json"))
check("dossier <= 1.5M B", dsize <= 1_500_000, f"({dsize} B)")
check("dossier text <= 65536 B", len(dos["text"].encode()) <= 65536,
      f"({len(dos['text'].encode())} B)")

data = open(os.path.join(out, "data.js"), encoding="utf-8").read()
radar = json.loads(data[len("window.RADAR="):-2])
sha = hashlib.sha256(open(os.path.join(out, "board.json"), "rb").read()).hexdigest()
check("data.js checksum == sha256(board.json)", radar["checksum_sha256"] == sha)
check("data.js rows == board.json rows", radar["rows"] == rows)

print("\nALL CHECKS PASSED" if not fails else f"\nFAILED: {fails}")
sys.exit(1 if fails else 0)
