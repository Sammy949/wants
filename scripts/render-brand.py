#!/usr/bin/env python3
"""
Render the wants brand mark ("Want to got": an outline tag you want, a filled
tag you got) into every app icon and splash asset.

Usage:  python3 scripts/render-brand.py
Needs:  rsvg-convert (librsvg) on PATH.
Writes: SVG sources to assets/brand/, PNGs to assets/images/.

The tag geometry matches src/components/tag-shape.ts and the Fern palette
matches src/theme/tokens.ts.
"""
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / "assets" / "brand"
IMAGES = ROOT / "assets" / "images"

LIGHT = dict(bg="#f3f5f1", ink="#15211a", accent="#2e5b44")
DARK = dict(bg="#0e1411", ink="#e4eae3", accent="#a8c9b4")


def tag_path(w=112, h=52, n=18, tip_half=7, tip_x=3, hole_x=17, hole_r=4.5, cr=16):
    r = min(cr, h / 2, (w - n) / 2)
    mid = h / 2
    outer = (
        f"M {n} 0 H {w - r} A {r} {r} 0 0 1 {w} {r} V {h - r} A {r} {r} 0 0 1 {w - r} {h} "
        f"H {n} L {tip_x} {mid + tip_half} L {tip_x} {mid - tip_half} Z"
    )
    hole = f"M {hole_x - hole_r} {mid} a {hole_r} {hole_r} 0 1 0 {hole_r * 2} 0 a {hole_r} {hole_r} 0 1 0 {-hole_r * 2} 0 Z"
    return f"{outer} {hole}"


TAG = tag_path()


FRONT = 'transform="translate(57 59) rotate(-22) scale(0.6) translate(-56 -26)"'


def mark(c, mono=None):
    """The two tags in a 100x100 space, centred on (50, 50)."""
    ink = mono or c["ink"]
    fill = mono or c["accent"]
    # In one colour the front tag would fuse with the back outline, so cut a gap
    # into the back tag around the front one.
    knockout = ""
    mask_attr = ""
    if mono:
        knockout = (
            '<defs><mask id="gap" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
            '<rect width="100" height="100" fill="#fff"/>'
            f'<g {FRONT}><path d="{TAG}" fill="#000" stroke="#000" stroke-width="16" stroke-linejoin="round"/></g>'
            "</mask></defs>"
        )
        mask_attr = ' mask="url(#gap)"'
    back = (
        f"{knockout}<g{mask_attr}><g transform=\"translate(43 42) rotate(-22) scale(0.6) translate(-56 -26)\">"
        f'<path d="{TAG}" fill="none" stroke="{ink}" stroke-width="4.5" stroke-linejoin="round" fill-rule="evenodd"/></g></g>'
    )
    front = (
        f"<g {FRONT}>"
        f'<path d="{TAG}" fill="{fill}" fill-rule="evenodd" stroke="{ink}" stroke-width="4.5" stroke-linejoin="round"/></g>'
    )
    return back + front


def svg(body, bg=None, scale=1.0):
    """A 100x100 canvas, optional solid background, mark scaled about the centre."""
    rect = f'<rect width="100" height="100" fill="{bg}"/>' if bg else ""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'{rect}<g transform="translate(50 50) scale({scale}) translate(-50 -50)">{body}</g></svg>'
    )


ASSETS = {
    # iOS and default: full-bleed square, the OS rounds the corners.
    "icon": (svg(mark(LIGHT), LIGHT["bg"], 0.84), 1024),
    "icon-dark": (svg(mark(DARK), DARK["bg"], 0.84), 1024),
    # Android adaptive: transparent foreground. Launchers crop to a shape inside
    # the central ~61% (66/108dp), so the mark is scaled to sit within it.
    "android-icon-foreground": (svg(mark(LIGHT), None, 0.6), 1024),
    "android-icon-monochrome": (svg(mark(LIGHT, mono="#ffffff"), None, 0.6), 1024),
    # Splash: the mark alone on the splash background colour.
    "splash-icon": (svg(mark(LIGHT)), 1024),
    "splash-icon-dark": (svg(mark(DARK)), 1024),
    "favicon": (svg(mark(LIGHT), LIGHT["bg"], 0.9), 48),
}


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    for name, (source, size) in ASSETS.items():
        src = BRAND / f"{name}.svg"
        src.write_text(source)
        out = IMAGES / f"{name}.png"
        subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), str(src), "-o", str(out)], check=True)
        print(f"{out.relative_to(ROOT)}  {size}px")


if __name__ == "__main__":
    main()
