/**
 * Tests for the invisible-ink ghost layer pipeline:
 *   reveal_ghost_to_document, tool_to_ghost_canvas, tool_erase_ghost_canvas
 */
import { reveal_ghost_to_document, tool_to_ghost_canvas, tool_erase_ghost_canvas } from '../distro/utils.js';

function assert(val, msg) {
    if (val) return;
    throw new Error(`Assertion failed: ${msg}`);
}

function assert_eq(actual, expected, msg) {
    if (actual === expected) return;
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

// ---------------------------------------------------------------------------
// Minimal Canvas / Context mock (no browser needed)
// ---------------------------------------------------------------------------

class MockImageData {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
    }
}

class MockContext {
    constructor(width, height) {
        this.canvas = { width, height };
        this._imageData = new MockImageData(width, height);
    }

    getImageData(x, y, w, h) {
        const out = new MockImageData(w, h);
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const src = 4 * ((y + dy) * this.canvas.width + (x + dx));
                const dst = 4 * (dy * w + dx);
                out.data[dst]     = this._imageData.data[src];
                out.data[dst + 1] = this._imageData.data[src + 1];
                out.data[dst + 2] = this._imageData.data[src + 2];
                out.data[dst + 3] = this._imageData.data[src + 3];
            }
        }
        return out;
    }

    putImageData(imageData, x, y) {
        const w = imageData.width;
        const h = imageData.height;
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const src = 4 * (dy * w + dx);
                const dst = 4 * ((y + dy) * this.canvas.width + (x + dx));
                this._imageData.data[dst]     = imageData.data[src];
                this._imageData.data[dst + 1] = imageData.data[src + 1];
                this._imageData.data[dst + 2] = imageData.data[src + 2];
                this._imageData.data[dst + 3] = imageData.data[src + 3];
            }
        }
    }

    /** Helper: set a single pixel in the backing store. */
    setPixel(x, y, r, g, b, a) {
        const off = 4 * (y * this.canvas.width + x);
        this._imageData.data[off]     = r;
        this._imageData.data[off + 1] = g;
        this._imageData.data[off + 2] = b;
        this._imageData.data[off + 3] = a;
    }

    /** Helper: read a single pixel from the backing store. */
    getPixel(x, y) {
        const off = 4 * (y * this.canvas.width + x);
        return Array.from(this._imageData.data.slice(off, off + 4));
    }
}

class MockCanvas {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this._ctx = new MockContext(width, height);
    }
    getContext(_type, _opts) {
        return this._ctx;
    }
}

/**
 * Build a 1:1 RectToRectMapping for a canvas of size W×H.
 * from is in unit-rect coords (0..1); to is in pixel coords.
 */
function full_mapping(w, h) {
    return {
        from: { x: 0, y: 0, w: 1, h: 1 },
        to:   { x: 0, y: 0, w: w, h: h },
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function test_reveal_copies_ghost_pixel_to_document() {
    const W = 4, H = 4;
    const tool_canvas   = new MockCanvas(W, H);
    const ghost_ctx     = new MockContext(W, H);
    const doc_ctx       = new MockContext(W, H);

    // Ghost has a red pixel at (1,1)
    ghost_ctx.setPixel(1, 1, 200, 0, 0, 255);

    // Tool canvas marks (1,1) as covered (any non-zero alpha)
    tool_canvas._ctx.setPixel(1, 1, 255, 255, 255, 255);

    reveal_ghost_to_document(tool_canvas, full_mapping(W, H), ghost_ctx, doc_ctx);

    // Document should now have the red pixel
    const doc_px = doc_ctx.getPixel(1, 1);
    assert_eq(doc_px[0], 200, 'doc R after reveal');
    assert_eq(doc_px[3], 255, 'doc A after reveal');

    // Ghost pixel should be consumed (transparent)
    const ghost_px = ghost_ctx.getPixel(1, 1);
    assert_eq(ghost_px[3], 0, 'ghost pixel consumed after reveal');
}

function test_reveal_only_affects_covered_pixels() {
    const W = 4, H = 4;
    const tool_canvas = new MockCanvas(W, H);
    const ghost_ctx   = new MockContext(W, H);
    const doc_ctx     = new MockContext(W, H);

    // Ghost has pixels at (0,0) and (2,2)
    ghost_ctx.setPixel(0, 0, 100, 0, 0, 255);
    ghost_ctx.setPixel(2, 2, 0, 200, 0, 255);

    // Tool only covers (0,0)
    tool_canvas._ctx.setPixel(0, 0, 255, 255, 255, 255);

    reveal_ghost_to_document(tool_canvas, full_mapping(W, H), ghost_ctx, doc_ctx);

    // (0,0): revealed
    const px00 = doc_ctx.getPixel(0, 0);
    assert_eq(px00[0], 100, 'revealed pixel R');
    assert_eq(ghost_ctx.getPixel(0, 0)[3], 0, 'revealed pixel consumed from ghost');

    // (2,2): NOT covered by tool — must stay untouched in both ghost and doc
    const px22_ghost = ghost_ctx.getPixel(2, 2);
    assert_eq(px22_ghost[3], 255, 'uncovered ghost pixel must remain');
    const px22_doc = doc_ctx.getPixel(2, 2);
    assert_eq(px22_doc[3], 0, 'uncovered doc pixel must stay empty');
}

function test_reveal_leaves_existing_doc_pixels_untouched() {
    const W = 4, H = 4;
    const tool_canvas = new MockCanvas(W, H);
    const ghost_ctx   = new MockContext(W, H);
    const doc_ctx     = new MockContext(W, H);

    // Document already has a blue pixel at (3,3)
    doc_ctx.setPixel(3, 3, 0, 0, 255, 255);

    // Ghost has nothing — tool covers (3,3)
    tool_canvas._ctx.setPixel(3, 3, 255, 255, 255, 255);

    reveal_ghost_to_document(tool_canvas, full_mapping(W, H), ghost_ctx, doc_ctx);

    // The existing blue pixel must not be erased
    const px = doc_ctx.getPixel(3, 3);
    assert_eq(px[2], 255, 'existing doc blue pixel preserved');
    assert_eq(px[3], 255, 'existing doc alpha preserved');
}

function test_tool_to_ghost_writes_actual_color() {
    const W = 4, H = 4;
    const tool_canvas = new MockCanvas(W, H);
    const ghost_ctx   = new MockContext(W, H);

    // Tool canvas has a green pixel with pre-multiplied alpha=255
    tool_canvas._ctx.setPixel(2, 1, 0, 180, 0, 255);

    tool_to_ghost_canvas(tool_canvas, full_mapping(W, H), ghost_ctx);

    // Ghost should have that pixel with alpha=255 (full color written)
    const px = ghost_ctx.getPixel(2, 1);
    assert_eq(px[3], 255, 'ghost alpha after write');
    assert_eq(px[1], 180, 'ghost green channel');
}

function test_tool_erase_ghost_clears_pixels() {
    const W = 4, H = 4;
    const tool_canvas = new MockCanvas(W, H);
    const ghost_ctx   = new MockContext(W, H);

    // Ghost has a pixel
    ghost_ctx.setPixel(1, 2, 255, 0, 0, 255);

    // Tool covers (1,2)
    tool_canvas._ctx.setPixel(1, 2, 255, 255, 255, 255);

    tool_erase_ghost_canvas(tool_canvas, full_mapping(W, H), ghost_ctx);

    const px = ghost_ctx.getPixel(1, 2);
    assert_eq(px[3], 0, 'ghost pixel erased');
}

function test_reveal_no_op_when_ghost_empty() {
    const W = 4, H = 4;
    const tool_canvas = new MockCanvas(W, H);
    const ghost_ctx   = new MockContext(W, H);
    const doc_ctx     = new MockContext(W, H);

    // Existing doc pixel
    doc_ctx.setPixel(0, 0, 50, 50, 50, 255);

    // Tool covers everything
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
            tool_canvas._ctx.setPixel(x, y, 255, 255, 255, 255);

    reveal_ghost_to_document(tool_canvas, full_mapping(W, H), ghost_ctx, doc_ctx);

    // No ghost pixels → document must be unchanged
    const px = doc_ctx.getPixel(0, 0);
    assert_eq(px[0], 50, 'doc pixel unchanged when ghost empty');
}

function test_reveal_called_twice_incremental() {
    // Simulates: draw ghost stroke, reveal part now, reveal rest later.
    // Ensures second reveal only copies pixels that were NOT already consumed.
    const W = 4, H = 4;
    const tool1 = new MockCanvas(W, H);
    const tool2 = new MockCanvas(W, H);
    const ghost_ctx = new MockContext(W, H);
    const doc_ctx   = new MockContext(W, H);

    // Ghost has red at (0,0) and blue at (3,3)
    ghost_ctx.setPixel(0, 0, 200, 0, 0, 255);
    ghost_ctx.setPixel(3, 3, 0, 0, 200, 255);

    // First reveal covers (0,0) only
    tool1._ctx.setPixel(0, 0, 255, 255, 255, 255);
    reveal_ghost_to_document(tool1, full_mapping(W, H), ghost_ctx, doc_ctx);

    assert_eq(doc_ctx.getPixel(0, 0)[0], 200, 'first reveal: red pixel at (0,0)');
    assert_eq(ghost_ctx.getPixel(0, 0)[3], 0,  'first reveal: (0,0) consumed from ghost');
    assert_eq(ghost_ctx.getPixel(3, 3)[3], 255, 'first reveal: (3,3) still in ghost');

    // Second reveal covers (3,3)
    tool2._ctx.setPixel(3, 3, 255, 255, 255, 255);
    reveal_ghost_to_document(tool2, full_mapping(W, H), ghost_ctx, doc_ctx);

    assert_eq(doc_ctx.getPixel(3, 3)[2], 200, 'second reveal: blue pixel at (3,3)');
    assert_eq(ghost_ctx.getPixel(3, 3)[3], 0,  'second reveal: (3,3) consumed');

    // (0,0) must still be red in doc (not wiped by second pass)
    assert_eq(doc_ctx.getPixel(0, 0)[0], 200, 'first-revealed pixel unchanged by second reveal');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const tests = [
    test_reveal_copies_ghost_pixel_to_document,
    test_reveal_only_affects_covered_pixels,
    test_reveal_leaves_existing_doc_pixels_untouched,
    test_tool_to_ghost_writes_actual_color,
    test_tool_erase_ghost_clears_pixels,
    test_reveal_no_op_when_ghost_empty,
    test_reveal_called_twice_incremental,
];

let failed = 0;
for (const t of tests) {
    try {
        t();
        console.log(`  ✓ ${t.name}`);
    } catch (e) {
        console.error(`  ✗ ${t.name}: ${e.message}`);
        failed++;
    }
}
if (failed > 0) {
    console.error(`\n${failed} test(s) failed.`);
    process.exit(1);
} else {
    console.log('\nAll ghost layer tests passed.');
}
