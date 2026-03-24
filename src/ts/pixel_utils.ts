// Pixel-perfect drawing utilities - no anti-aliasing ever
import { Vector2 } from "./types";

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
