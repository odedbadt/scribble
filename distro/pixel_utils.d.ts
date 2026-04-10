import { Rect } from "./types";
export type RGBA = [number, number, number, number];
/**
 * Set a single pixel in ImageData
 */
export declare function setPixel(imageData: ImageData, x: number, y: number, color: RGBA): void;
/**
 * Get a single pixel from ImageData
 */
export declare function getPixel(imageData: ImageData, x: number, y: number): RGBA;
/**
 * Bresenham's line algorithm - draws a pixel-perfect line with no anti-aliasing
 */
export declare function drawLine(imageData: ImageData, x0: number, y0: number, x1: number, y1: number, color: RGBA): void;
/**
 * Draw a thick line using Bresenham + filled circles at each point
 */
export declare function drawThickLine(imageData: ImageData, x0: number, y0: number, x1: number, y1: number, radius: number, color: RGBA): void;
/**
 * Midpoint circle algorithm - draws a pixel-perfect circle outline with no anti-aliasing
 */
export declare function drawCircle(imageData: ImageData, cx: number, cy: number, radius: number, color: RGBA): void;
/**
 * Draw a filled circle using horizontal scanlines - no anti-aliasing
 */
export declare function drawFilledCircle(imageData: ImageData, cx: number, cy: number, radius: number, color: RGBA): void;
/**
 * Draw a filled rectangle - no anti-aliasing
 */
export declare function drawFilledRect(imageData: ImageData, x: number, y: number, w: number, h: number, color: RGBA): void;
/**
 * Draw a rectangle outline - no anti-aliasing
 */
export declare function drawRect(imageData: ImageData, x: number, y: number, w: number, h: number, color: RGBA): void;
export declare function drawThickRect(imageData: ImageData, x: number, y: number, w: number, h: number, thickness: number, color: RGBA): void;
export declare function drawThickCircle(imageData: ImageData, cx: number, cy: number, radius: number, thickness: number, color: RGBA): void;
/**
 * Parse a CSS color string to RGBA array
 */
export declare function parseColor(color: string): RGBA;
export declare function drawFilledHeart(imageData: ImageData, cx: number, cy: number, r: number, color: RGBA): void;
export declare function drawHeartOutline(imageData: ImageData, cx: number, cy: number, r: number, thickness: number, color: RGBA): void;
export declare function drawFilledStraightSouthHeart(imageData: ImageData, cx: number, cy: number, r: number, color: RGBA): void;
export declare function drawStraightSouthHeartOutline(imageData: ImageData, cx: number, cy: number, r: number, thickness: number, color: RGBA): void;
export declare function drawPolygonOutline(imageData: ImageData, vertices: {
    x: number;
    y: number;
}[], thickness: number, color: RGBA): void;
export declare function drawFilledPolygon(imageData: ImageData, vertices: {
    x: number;
    y: number;
}[], color: RGBA): void;
/** Draw a cloud shape (5 overlapping filled circles) centered at (cx, cy) */
export declare function drawCloud(imageData: ImageData, cx: number, cy: number, size: number, color: RGBA): void;
/**
 * Draw a 5-band rainbow arc from (x1,y1) to (x2,y2), arching toward screen-top.
 * Bands from outer to inner: Red, Orange, Yellow, Green, Blue.
 */
export declare function drawRainbow(imageData: ImageData, x1: number, y1: number, x2: number, y2: number, bandWidth: number): void;
/**
 * Cloud stamp glyph. Fits within ±r.
 * Internally uses size≈0.65r so the widest cloud circle (at ±1.4×size) stays within r.
 */
export declare function drawGlyphCloud(imageData: ImageData, cx: number, cy: number, r: number): void;
/**
 * Concentric-band heart glyph. Six rainbow-coloured filled hearts.
 * Outermost heart drawn at 0.65×r so total extent ≈ 1.5×0.65r = r.
 */
export declare function drawGlyphConcentricHeart(imageData: ImageData, cx: number, cy: number, r: number): void;
/** Pre-load an SVG by URL. `onReady` fires once the image is decoded. */
export declare function preloadSVG(url: string, onReady?: () => void): void;
/**
 * Draw an SVG stamp into imageData at (cx, cy) with radius r.
 * Renders using the browser's native SVG renderer.
 * Falls back to a simple placeholder square until the SVG loads.
 */
export declare function drawGlyphSVG(url: string, imageData: ImageData, cx: number, cy: number, r: number): void;
/**
 * For every pixel in `imageData` that is non-transparent (alpha > 0) and,
 * if `matchColor` is provided, matches that color exactly — replace it with
 * the corresponding pixel from the tiled `pattern`.
 *
 * `docOffX` / `docOffY` are the document-space coordinates of `imageData`'s
 * top-left corner, so the pattern tiles consistently across the whole canvas.
 */
export declare function applyPatternFill(imageData: ImageData, docOffX: number, docOffY: number, pattern: ImageData, matchColor?: RGBA): void;
/** Copy a sub-rectangle out of a full-canvas ImageData without touching the DOM. */
export declare function extract_sub_image(source: ImageData, rect: Rect): ImageData;
//# sourceMappingURL=pixel_utils.d.ts.map