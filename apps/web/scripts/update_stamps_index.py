#!/usr/bin/env python3
"""Write static/stamps/index.json listing all .svg files in that directory.

Run after adding or removing SVG files from static/stamps/:
    python3 scripts/update_stamps_index.py
"""
import json, pathlib

stamps_dir = pathlib.Path(__file__).parent.parent / "static" / "stamps"
files = sorted(p.name for p in stamps_dir.glob("*.svg"))
index = stamps_dir / "index.json"
index.write_text(json.dumps(files, indent=2) + "\n")
print(f"Written {index}: {files}")
