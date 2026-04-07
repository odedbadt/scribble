import { set_pending_glyph, GlyphFn } from "./glyph_sizing_tool";
import { drawGlyphCloud, drawGlyphButterfly, drawGlyphConcentricHeart, preloadButterflyGlyph } from "./pixel_utils";
import { state_registry, StateValue } from "./state_registry";

const THUMBNAIL_SIZE = 64;
const THUMB_RADIUS   = 28; // radius inside 64×64 thumbnail

interface GlyphDef {
    id: string;
    label: string;
    fn?: GlyphFn;  // undefined → selection tool shortcut
}

const GLYPHS: GlyphDef[] = [
    { id: 'cloud',            label: 'Cloud ☁',             fn: drawGlyphCloud },
    { id: 'butterfly',        label: 'Butterfly 🦋',         fn: drawGlyphButterfly },
    { id: 'concentric_heart', label: 'Heart ♥',              fn: drawGlyphConcentricHeart },
    { id: 'selection',        label: 'Selection ⬚',          fn: undefined },
];

function render_thumbnail(fn: GlyphFn): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width  = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;
    const ctx = canvas.getContext('2d')!;
    const imageData = new ImageData(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    fn(imageData, THUMBNAIL_SIZE / 2, THUMBNAIL_SIZE / 2, THUMB_RADIUS);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function render_selection_thumbnail(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width  = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#333';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 44, 44);
    // corner handles
    ctx.fillStyle = '#333';
    for (const [hx, hy] of [[10,10],[54,10],[10,54],[54,54],[32,10],[32,54],[10,32],[54,32]]) {
        ctx.fillRect(hx - 2, hy - 2, 4, 4);
    }
    return canvas;
}

export class StampGallery {
    private _modal: HTMLElement;

    constructor(private _on_activate_glyph: (toolName: string) => void) {
        this._modal = document.getElementById('stamp-gallery-modal')!;
        this._build_thumbnails();
        this._modal.addEventListener('click', (e) => {
            if (e.target === this._modal) this.close();
        });
        // Re-render the butterfly thumbnail once the SVG is loaded from the server.
        preloadButterflyGlyph(() => this._refresh_butterfly_thumbnail());
    }

    open(): void {
        this._modal.classList.add('open');
    }

    close(): void {
        this._modal.classList.remove('open');
    }

    private _build_thumbnails(): void {
        for (const glyph of GLYPHS) {
            const slot = document.getElementById(`gallery-item-${glyph.id}`);
            if (!slot) continue;
            const thumb = glyph.fn
                ? render_thumbnail(glyph.fn)
                : render_selection_thumbnail();
            thumb.className = 'gallery-thumbnail';
            slot.prepend(thumb);
            slot.addEventListener('click', () => this._pick(glyph));
        }
    }

    /** Replace the butterfly thumbnail once the SVG has loaded. */
    private _refresh_butterfly_thumbnail(): void {
        const slot = document.getElementById('gallery-item-butterfly');
        if (!slot) return;
        const old = slot.querySelector('.gallery-thumbnail');
        if (old) slot.removeChild(old);
        const thumb = render_thumbnail(drawGlyphButterfly);
        thumb.className = 'gallery-thumbnail';
        slot.prepend(thumb);
    }

    private _pick(glyph: GlyphDef): void {
        this.close();
        if (!glyph.fn) {
            // "Selection" → activate selection tool normally
            this._on_activate_glyph('selection');
            return;
        }
        set_pending_glyph(glyph.fn);
        this._on_activate_glyph('glyph_sizing');
    }
}
