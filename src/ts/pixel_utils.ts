// Pixel-perfect drawing utilities - no anti-aliasing ever
import { Rect, Vector2 } from "./types";

export type RGBA = [number, number, number, number];

/**
 * Set a single pixel in ImageData
 */
export function setPixel(imageData: ImageData, x: number, y: number, color: RGBA): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
        return;
    }
    const offset = (y * imageData.width + x) * 4;
    imageData.data[offset] = color[0];
    imageData.data[offset + 1] = color[1];
    imageData.data[offset + 2] = color[2];
    imageData.data[offset + 3] = color[3];
}

/**
 * Get a single pixel from ImageData
 */
export function getPixel(imageData: ImageData, x: number, y: number): RGBA {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
        return [0, 0, 0, 0];
    }
    const offset = (y * imageData.width + x) * 4;
    return [
        imageData.data[offset],
        imageData.data[offset + 1],
        imageData.data[offset + 2],
        imageData.data[offset + 3]
    ];
}

/**
 * Bresenham's line algorithm - draws a pixel-perfect line with no anti-aliasing
 */
export function drawLine(imageData: ImageData, x0: number, y0: number, x1: number, y1: number, color: RGBA): void {
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        setPixel(imageData, x0, y0, color);

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

/**
 * Draw a thick line using Bresenham + filled circles at each point
 */
export function drawThickLine(imageData: ImageData, x0: number, y0: number, x1: number, y1: number, radius: number, color: RGBA): void {
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);
    radius = Math.floor(radius);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        drawFilledCircle(imageData, x0, y0, radius, color);

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

/**
 * Midpoint circle algorithm - draws a pixel-perfect circle outline with no anti-aliasing
 */
export function drawCircle(imageData: ImageData, cx: number, cy: number, radius: number, color: RGBA): void {
    cx = Math.floor(cx);
    cy = Math.floor(cy);
    radius = Math.floor(radius);

    let x = radius;
    let y = 0;
    let err = 0;

    while (x >= y) {
        setPixel(imageData, cx + x, cy + y, color);
        setPixel(imageData, cx + y, cy + x, color);
        setPixel(imageData, cx - y, cy + x, color);
        setPixel(imageData, cx - x, cy + y, color);
        setPixel(imageData, cx - x, cy - y, color);
        setPixel(imageData, cx - y, cy - x, color);
        setPixel(imageData, cx + y, cy - x, color);
        setPixel(imageData, cx + x, cy - y, color);

        y += 1;
        err += 1 + 2 * y;
        if (2 * (err - x) + 1 > 0) {
            x -= 1;
            err += 1 - 2 * x;
        }
    }
}

/**
 * Draw a filled circle using horizontal scanlines - no anti-aliasing
 */
export function drawFilledCircle(imageData: ImageData, cx: number, cy: number, radius: number, color: RGBA): void {
    cx = Math.floor(cx);
    cy = Math.floor(cy);
    radius = Math.floor(radius);

    if (radius <= 0) {
        setPixel(imageData, cx, cy, color);
        return;
    }

    // Draw horizontal lines for each y in the circle
    for (let y = -radius; y <= radius; y++) {
        // Calculate x extent at this y using circle equation
        const xExtent = Math.floor(Math.sqrt(radius * radius - y * y));
        for (let x = -xExtent; x <= xExtent; x++) {
            setPixel(imageData, cx + x, cy + y, color);
        }
    }
}

/**
 * Draw a filled rectangle - no anti-aliasing
 */
export function drawFilledRect(imageData: ImageData, x: number, y: number, w: number, h: number, color: RGBA): void {
    x = Math.floor(x);
    y = Math.floor(y);
    w = Math.floor(w);
    h = Math.floor(h);

    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
            setPixel(imageData, px, py, color);
        }
    }
}

/**
 * Draw a rectangle outline - no anti-aliasing
 */
export function drawRect(imageData: ImageData, x: number, y: number, w: number, h: number, color: RGBA): void {
    x = Math.floor(x);
    y = Math.floor(y);
    w = Math.floor(w);
    h = Math.floor(h);

    // Top and bottom
    for (let px = x; px < x + w; px++) {
        setPixel(imageData, px, y, color);
        setPixel(imageData, px, y + h - 1, color);
    }
    // Left and right
    for (let py = y; py < y + h; py++) {
        setPixel(imageData, x, py, color);
        setPixel(imageData, x + w - 1, py, color);
    }
}

export function drawThickRect(imageData: ImageData, x: number, y: number, w: number, h: number, thickness: number, color: RGBA): void {
    for (let i = 0; i < thickness && i * 2 < w && i * 2 < h; i++) {
        drawRect(imageData, x + i, y + i, w - 2 * i, h - 2 * i, color);
    }
}

export function drawThickCircle(imageData: ImageData, cx: number, cy: number, radius: number, thickness: number, color: RGBA): void {
    cx = Math.floor(cx);
    cy = Math.floor(cy);
    radius = Math.floor(radius);
    const inner = Math.max(0, radius - thickness);
    for (let y = -radius; y <= radius; y++) {
        const xOut = Math.floor(Math.sqrt(Math.max(0, radius * radius - y * y)));
        const xIn = Math.abs(y) <= inner ? Math.floor(Math.sqrt(inner * inner - y * y)) : -1;
        for (let x = -xOut; x <= -xIn - 1; x++) setPixel(imageData, cx + x, cy + y, color);
        for (let x = xIn + 1; x <= xOut; x++) setPixel(imageData, cx + x, cy + y, color);
    }
}

/**
 * Parse a CSS color string to RGBA array
 */
export function parseColor(color: string): RGBA {
    // Handle rgba(r, g, b, a) format
    let match = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)/.exec(color);
    if (match) {
        return [
            parseInt(match[1]),
            parseInt(match[2]),
            parseInt(match[3]),
            Math.round(parseFloat(match[4]) * 255)
        ];
    }

    // Handle rgb(r, g, b) format
    match = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/.exec(color);
    if (match) {
        return [
            parseInt(match[1]),
            parseInt(match[2]),
            parseInt(match[3]),
            255
        ];
    }

    // Handle hex format #RRGGBB or #RGB
    match = /^#([0-9a-fA-F]{6})$/.exec(color);
    if (match) {
        const hex = match[1];
        return [
            parseInt(hex.substring(0, 2), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(4, 6), 16),
            255
        ];
    }

    match = /^#([0-9a-fA-F]{3})$/.exec(color);
    if (match) {
        const hex = match[1];
        return [
            parseInt(hex[0] + hex[0], 16),
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
            255
        ];
    }

    // Handle named colors (basic ones)
    const namedColors: Record<string, RGBA> = {
        'black': [0, 0, 0, 255],
        'white': [255, 255, 255, 255],
        'red': [255, 0, 0, 255],
        'green': [0, 128, 0, 255],
        'blue': [0, 0, 255, 255],
        'yellow': [255, 255, 0, 255],
        'cyan': [0, 255, 255, 255],
        'magenta': [255, 0, 255, 255],
        'transparent': [0, 0, 0, 0]
    };

    if (namedColors[color.toLowerCase()]) {
        return namedColors[color.toLowerCase()];
    }

    // Default to black if parsing fails
    console.warn(`Could not parse color: ${color}, defaulting to black`);
    return [0, 0, 0, 255];
}

// Heart shape via implicit equation (x²+y²-1)³ ≤ x²y³ (math coords, y-up)
// nx = dx/r, ny = -dy/r (flip screen y so heart points down in screen space)
function _heartInside(nx: number, ny: number): boolean {
    const t = nx * nx + ny * ny - 1;
    return t * t * t <= nx * nx * ny * ny * ny;
}

export function drawFilledHeart(imageData: ImageData, cx: number, cy: number, r: number, color: RGBA): void {
    cx = Math.floor(cx); cy = Math.floor(cy); r = Math.floor(r);
    if (r <= 0) { setPixel(imageData, cx, cy, color); return; }
    const bound = Math.ceil(r * 1.5) + 1;
    for (let dy = -bound; dy <= bound; dy++) {
        for (let dx = -bound; dx <= bound; dx++) {
            if (_heartInside(dx / r, -dy / r)) setPixel(imageData, cx + dx, cy + dy, color);
        }
    }
}

export function drawHeartOutline(imageData: ImageData, cx: number, cy: number, r: number, thickness: number, color: RGBA): void {
    cx = Math.floor(cx); cy = Math.floor(cy); r = Math.floor(r);
    if (r <= 0) { setPixel(imageData, cx, cy, color); return; }
    const rInner = Math.max(0, r - thickness);
    const bound = Math.ceil(r * 1.5) + 1;
    for (let dy = -bound; dy <= bound; dy++) {
        for (let dx = -bound; dx <= bound; dx++) {
            if (!_heartInside(dx / r, -dy / r)) continue;
            if (rInner > 0 && _heartInside(dx / rInner, -dy / rInner)) continue;
            setPixel(imageData, cx + dx, cy + dy, color);
        }
    }
}

// Cubic-south heart: C1 at the equator junction, sharp V-tip at the bottom.
//
// South boundary: x(t) = r · (t²−1)(t−2)/2,  t = dy/r ∈ [0,1]
//   t=0 → x=r,  dx/dy = −½  (slope dy/dx = −2, matches smooth heart)
//   t=1 → x=0,  dx/dy = −1  (right side arrives at 90° V with left side)
//
function _southHW(r: number, dy: number): number {
    if (dy >= r) return 0;
    const t = dy / r;
    return Math.max(0, Math.floor(r * (t * t - 1) * (t - 2) / 2));
}
function _southHWf(r: number, dy: number): number {
    if (dy >= r) return 0;
    const t = dy / r;
    return Math.max(0, r * (t * t - 1) * (t - 2) / 2);
}

export function drawFilledStraightSouthHeart(imageData: ImageData, cx: number, cy: number, r: number, color: RGBA): void {
    cx = Math.floor(cx); cy = Math.floor(cy); r = Math.floor(r);
    if (r <= 0) { setPixel(imageData, cx, cy, color); return; }
    const bound = Math.ceil(r * 1.5) + 1;
    for (let dy = -bound; dy < 0; dy++) {
        for (let dx = -bound; dx <= bound; dx++) {
            if (_heartInside(dx / r, -dy / r)) setPixel(imageData, cx + dx, cy + dy, color);
        }
    }
    for (let dy = 0; dy <= r; dy++) {
        const hw = _southHW(r, dy);
        for (let dx = -hw; dx <= hw; dx++) setPixel(imageData, cx + dx, cy + dy, color);
    }
}

export function drawStraightSouthHeartOutline(imageData: ImageData, cx: number, cy: number, r: number, thickness: number, color: RGBA): void {
    cx = Math.floor(cx); cy = Math.floor(cy); r = Math.floor(r);
    if (r <= 0) { setPixel(imageData, cx, cy, color); return; }
    const rInner = Math.max(0, r - thickness);
    const bound = Math.ceil(r * 1.5) + 1;
    // North: smooth outline
    for (let dy = -bound; dy < 0; dy++) {
        for (let dx = -bound; dx <= bound; dx++) {
            if (!_heartInside(dx / r, -dy / r)) continue;
            if (rInner > 0 && _heartInside(dx / rInner, -dy / rInner)) continue;
            setPixel(imageData, cx + dx, cy + dy, color);
        }
    }
    // South: cubic outline between outer (r) and inner (rInner)
    for (let dy = 0; dy <= r; dy++) {
        const hwOuter = _southHW(r, dy);
        const hwInnerF = (rInner > 0 && dy < rInner) ? _southHWf(rInner, dy) : -1;
        for (let dx = -hwOuter; dx <= hwOuter; dx++) {
            if (Math.abs(dx) < hwInnerF) continue;
            setPixel(imageData, cx + dx, cy + dy, color);
        }
    }
}

export function drawPolygonOutline(imageData: ImageData, vertices: { x: number; y: number }[], thickness: number, color: RGBA): void {
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % n];
        if (thickness <= 0) {
            drawLine(imageData, Math.floor(a.x), Math.floor(a.y), Math.floor(b.x), Math.floor(b.y), color);
        } else {
            drawThickLine(imageData, Math.floor(a.x), Math.floor(a.y), Math.floor(b.x), Math.floor(b.y), thickness, color);
        }
    }
}

export function drawFilledPolygon(imageData: ImageData, vertices: { x: number; y: number }[], color: RGBA): void {
    if (vertices.length < 3) return;
    const w = imageData.width;
    const h = imageData.height;
    let minY = Infinity, maxY = -Infinity;
    for (const v of vertices) {
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
    }
    const n = vertices.length;
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(h - 1, Math.ceil(maxY)); y++) {
        const xs: number[] = [];
        for (let i = 0; i < n; i++) {
            const a = vertices[i], b = vertices[(i + 1) % n];
            if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
                xs.push(a.x + (y - a.y) / (b.y - a.y) * (b.x - a.x));
            }
        }
        xs.sort((a, b) => a - b);
        for (let j = 0; j + 1 < xs.length; j += 2) {
            for (let x = Math.max(0, Math.ceil(xs[j])); x <= Math.min(w - 1, Math.floor(xs[j + 1])); x++) {
                setPixel(imageData, x, y, color);
            }
        }
    }
}

/** Draw a cloud shape (5 overlapping filled circles) centered at (cx, cy) */
export function drawCloud(imageData: ImageData, cx: number, cy: number, size: number, color: RGBA): void {
    cx = Math.floor(cx); cy = Math.floor(cy); size = Math.max(1, Math.floor(size));
    drawFilledCircle(imageData, cx, cy, size, color);
    drawFilledCircle(imageData, cx - Math.floor(size * 0.75), cy + Math.floor(size * 0.1), Math.floor(size * 0.65), color);
    drawFilledCircle(imageData, cx + Math.floor(size * 0.75), cy + Math.floor(size * 0.1), Math.floor(size * 0.65), color);
    drawFilledCircle(imageData, cx - Math.floor(size * 0.35), cy - Math.floor(size * 0.55), Math.floor(size * 0.6), color);
    drawFilledCircle(imageData, cx + Math.floor(size * 0.35), cy - Math.floor(size * 0.55), Math.floor(size * 0.6), color);
}

const _RAINBOW_COLORS: RGBA[] = [
    [220, 0, 0, 255],    // Red (outermost)
    [255, 140, 0, 255],  // Orange
    [240, 230, 0, 255],  // Yellow
    [0, 180, 0, 255],    // Green
    [0, 60, 220, 255],   // Blue (innermost)
];

/**
 * Draw a 5-band rainbow arc from (x1,y1) to (x2,y2), arching toward screen-top.
 * Bands from outer to inner: Red, Orange, Yellow, Green, Blue.
 */
export function drawRainbow(imageData: ImageData, x1: number, y1: number, x2: number, y2: number, bandWidth: number): void {
    x1 = Math.floor(x1); y1 = Math.floor(y1);
    x2 = Math.floor(x2); y2 = Math.floor(y2);
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const radius = dist / 2;
    const nBands = _RAINBOW_COLORS.length;
    const totalThickness = nBands * bandWidth;
    const outerR = radius;
    const innerR = Math.max(0, radius - totalThickness);

    // Upward perpendicular: choose perp to chord that has negative Y (screen-up)
    const ndx = dx / dist, ndy = dy / dist;
    const upPerpX = ndx >= 0 ? ndy : -ndy;
    const upPerpY = ndx >= 0 ? -ndx : ndx;

    const bx1 = Math.floor(mx - outerR - 1), bx2 = Math.ceil(mx + outerR + 1);
    const by1 = Math.floor(my - outerR - 1), by2 = Math.ceil(my + outerR + 1);

    for (let py = by1; py <= by2; py++) {
        for (let px = bx1; px <= bx2; px++) {
            const relX = px - mx, relY = py - my;
            const d = Math.sqrt(relX * relX + relY * relY);
            if (d < innerR || d > outerR) continue;
            if (relX * upPerpX + relY * upPerpY < 0) continue;
            const band = Math.floor((outerR - d) / bandWidth);
            if (band < 0 || band >= nBands) continue;
            setPixel(imageData, px, py, _RAINBOW_COLORS[band]);
        }
    }
}


// ─── Stamp Glyph drawing functions ───────────────────────────────────────────
// Each takes (imageData, cx, cy, r) and paints a fixed-colour glyph that fits
// entirely within ±r pixels of (cx, cy).  r is treated as the half-bounding-box.

/**
 * Cloud stamp glyph. Fits within ±r.
 * Internally uses size≈0.65r so the widest cloud circle (at ±1.4×size) stays within r.
 */
export function drawGlyphCloud(imageData: ImageData, cx: number, cy: number, r: number): void {
    const size = Math.max(3, Math.round(r * 0.65));
    const shadow: RGBA = [150, 155, 175, 255];
    const body: RGBA   = [235, 240, 255, 255];
    drawCloud(imageData, cx, cy, size, shadow);
    const inner = Math.max(2, Math.floor(size * 0.86));
    drawCloud(imageData, cx, cy - Math.floor(size * 0.07), inner, body);
}

const _CONCENTRIC_HEART_COLORS: RGBA[] = [
    [220,   0,   0, 255],  // outermost – red
    [255, 110,   0, 255],  // orange
    [245, 220,   0, 255],  // yellow
    [  0, 180,   0, 255],  // green
    [  0,  80, 220, 255],  // blue
    [150,   0, 220, 255],  // innermost – purple
];

/**
 * Concentric-band heart glyph. Six rainbow-coloured filled hearts.
 * Outermost heart drawn at 0.65×r so total extent ≈ 1.5×0.65r = r.
 */
export function drawGlyphConcentricHeart(imageData: ImageData, cx: number, cy: number, r: number): void {
    const n = _CONCENTRIC_HEART_COLORS.length;
    const outerR = Math.max(2, Math.round(r * 0.65));
    for (let i = 0; i < n; i++) {
        const ri = Math.max(1, Math.round(outerR * (n - i) / n));
        drawFilledHeart(imageData, cx, cy, ri, _CONCENTRIC_HEART_COLORS[i]);
    }
}

// ─── Butterfly SVG cache ──────────────────────────────────────────────────────
// The butterfly glyph is rendered by loading butterfly.svg via the browser's
// native SVG renderer.  The image is fetched once; subsequent calls blit from
// the cached element.  Until the image loads a simple ellipse fallback is used.

let _butterflyImg: HTMLImageElement | null = null;

/**
 * Start loading butterfly.svg from the server.  Call once at app startup.
 * `onReady` is invoked when the image is decoded and ready to draw.
 */
export function preloadButterflyGlyph(onReady?: () => void): void {
    if (_butterflyImg) { onReady?.(); return; }
    const img = new Image();
    img.onload = () => { _butterflyImg = img; onReady?.(); };
    img.src = new URL('butterfly.svg', document.baseURI).href;
}

/**
 * Butterfly glyph.  When butterfly.svg is loaded (via preloadButterflyGlyph)
 * the SVG is rendered at exactly (2r × 2r) pixels using the browser's native
 * SVG renderer, so the actual paths and colours from the file are used.
 * Before the image loads, a Monarch-coloured ellipse pair is drawn as a
 * placeholder so the tool is always usable.
 */
export function drawGlyphButterfly(imageData: ImageData, cx: number, cy: number, r: number): void {
    cx = Math.floor(cx); cy = Math.floor(cy); r = Math.max(6, Math.floor(r));

    if (_butterflyImg) {
        // Render the SVG into a tiny off-screen canvas and sample its pixels.
        const d = r * 2;
        const tmp = document.createElement('canvas');
        tmp.width = d; tmp.height = d;
        const ctx = tmp.getContext('2d')!;
        ctx.drawImage(_butterflyImg, 0, 0, d, d);
        const src = ctx.getImageData(0, 0, d, d);
        for (let dy = 0; dy < d; dy++) {
            for (let dx = 0; dx < d; dx++) {
                const si = (dy * d + dx) * 4;
                if (src.data[si + 3] < 64) continue; // skip transparent bg
                setPixel(imageData, cx - r + dx, cy - r + dy,
                    [src.data[si], src.data[si + 1], src.data[si + 2], 255]);
            }
        }
        return;
    }

    // ── Fallback: Monarch ellipses until SVG loads ────────────────────────────
    const darkVein: RGBA = [ 19,  16,  14, 255];
    const orange:   RGBA = [233, 122,  36, 255];
    const golden:   RGBA = [246, 181,  28, 255];
    const cream:    RGBA = [238, 229, 210, 255];

    const uOffX = r * 0.36, uOffY = r * -0.16;
    const uRx   = r * 0.44, uRy   = r * 0.28;
    const cosU = Math.cos(22 * Math.PI / 180), sinU = Math.sin(22 * Math.PI / 180);
    const lOffX = r * 0.25, lOffY = r * 0.30;
    const lRx   = r * 0.28, lRy   = r * 0.22;
    const cosL = Math.cos(8 * Math.PI / 180),  sinL = Math.sin(8 * Math.PI / 180);

    const drawPair = (offX: number, offY: number, rx: number, ry: number,
                      cosA: number, sinA: number, spot: boolean) => {
        const bnd = Math.ceil(Math.max(rx, ry)) + 2;
        for (let side = -1; side <= 1; side += 2) {
            const ocx = side * offX;
            for (let dy = -bnd; dy <= bnd; dy++) {
                for (let dx = -bnd; dx <= bnd; dx++) {
                    const rx2 = dx - ocx, ry2 = dy - offY;
                    const lx = rx2 * cosA + ry2 * (side * sinA);
                    const ly = -rx2 * (side * sinA) + ry2 * cosA;
                    const e = (lx / rx) ** 2 + (ly / ry) ** 2;
                    if (e > 1.0) continue;
                    const col = e > 0.88 ? darkVein : e > 0.68 ? orange
                               : (e > 0.30 || !spot) ? golden : cream;
                    setPixel(imageData, cx + dx, cy + dy, col);
                }
            }
        }
    };
    drawPair(lOffX, lOffY, lRx, lRy, cosL, sinL, false);
    drawPair(uOffX, uOffY, uRx, uRy, cosU, sinU, true);
    const bRx = Math.max(1, Math.round(r * 0.06)), bRy = Math.round(r * 0.38);
    for (let dy = -bRy; dy <= bRy; dy++)
        for (let dx = -bRx; dx <= bRx; dx++)
            if ((dx / bRx) ** 2 + (dy / bRy) ** 2 <= 1.0)
                setPixel(imageData, cx + dx, cy + dy, darkVein);
    drawFilledCircle(imageData, cx, cy - Math.round(r * 0.42),
        Math.max(1, Math.round(r * 0.085)), darkVein);
}

/** Copy a sub-rectangle out of a full-canvas ImageData without touching the DOM. */
export function extract_sub_image(source: ImageData, rect: Rect): ImageData {
    const result = new ImageData(rect.w, rect.h);
    for (let row = 0; row < rect.h; row++) {
        const srcOff = ((rect.y + row) * source.width + rect.x) * 4;
        const dstOff = row * rect.w * 4;
        result.data.set(source.data.subarray(srcOff, srcOff + rect.w * 4), dstOff);
    }
    return result;
}
