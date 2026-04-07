import { set_pending_glyph, GlyphFn } from "./glyph_sizing_tool";
import { drawGlyphCloud, drawGlyphConcentricHeart, drawGlyphSVG, preloadSVG } from "./pixel_utils";

const THUMBNAIL_SIZE = 80;
const THUMB_RADIUS   = 36;

// ── Coded (pixel-drawn) glyphs ────────────────────────────────────────────────
interface CodedGlyph {
    kind: 'coded';
    id: string;
    label: string;
    fn: GlyphFn;
}

interface SelectionGlyph {
    kind: 'selection';
    id: string;
    label: string;
}

interface SVGGlyph {
    kind: 'svg';
    filename: string;  // e.g. "butterfly.svg"
    url: string;       // absolute URL for fetch/img
    label: string;
}

type GalleryItem = CodedGlyph | SelectionGlyph | SVGGlyph;

const CODED_GLYPHS: (CodedGlyph | SelectionGlyph)[] = [
    { kind: 'coded',     id: 'cloud',            label: 'Cloud',      fn: drawGlyphCloud },
    { kind: 'coded',     id: 'concentric_heart', label: 'Heart',      fn: drawGlyphConcentricHeart },
    { kind: 'selection', id: 'selection',        label: 'Selection' },
];

function filename_to_label(filename: string): string {
    return filename.replace(/\.svg$/i, '').replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function render_coded_thumbnail(fn: GlyphFn): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = THUMBNAIL_SIZE;
    const imageData = new ImageData(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    fn(imageData, THUMBNAIL_SIZE / 2, THUMBNAIL_SIZE / 2, THUMB_RADIUS);
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    return canvas;
}

function render_selection_thumbnail(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = THUMBNAIL_SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#555';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    const m = 12;
    ctx.strokeRect(m, m, THUMBNAIL_SIZE - m * 2, THUMBNAIL_SIZE - m * 2);
    ctx.fillStyle = '#555';
    for (const hx of [m, THUMBNAIL_SIZE / 2, THUMBNAIL_SIZE - m])
        for (const hy of [m, THUMBNAIL_SIZE / 2, THUMBNAIL_SIZE - m])
            ctx.fillRect(hx - 2, hy - 2, 4, 4);
    return canvas;
}

function render_svg_thumbnail(url: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = THUMBNAIL_SIZE;
    const imageData = new ImageData(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    drawGlyphSVG(url, imageData, THUMBNAIL_SIZE / 2, THUMBNAIL_SIZE / 2, THUMB_RADIUS);
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    return canvas;
}

function make_item_el(item: GalleryItem, onClick: () => void): HTMLElement {
    const el = document.createElement('div');
    el.className = 'gallery-item';

    let thumb: HTMLCanvasElement;
    if (item.kind === 'coded') {
        thumb = render_coded_thumbnail(item.fn);
    } else if (item.kind === 'selection') {
        thumb = render_selection_thumbnail();
    } else {
        thumb = render_svg_thumbnail(item.url);
    }
    thumb.className = 'gallery-thumbnail';
    el.appendChild(thumb);

    const label = document.createElement('span');
    label.className = 'gallery-label';
    label.textContent = item.label;
    el.appendChild(label);

    el.addEventListener('click', onClick);
    return el;
}

export class StampGallery {
    private _modal: HTMLElement;
    private _grid: HTMLElement;

    constructor(private _on_activate: (toolName: string) => void) {
        this._modal = document.getElementById('stamp-gallery-modal')!;
        this._grid  = this._modal.querySelector('.gallery-grid')!;
        this._modal.addEventListener('click', (e) => {
            if (e.target === this._modal) this.close();
        });
        this._build_coded();
    }

    open(): void {
        this._modal.classList.add('open');
        // Refresh SVG stamps each time (picks up any newly added files)
        this._load_svg_stamps();
    }

    close(): void {
        this._modal.classList.remove('open');
    }

    private _build_coded(): void {
        // Clear any existing coded items first
        this._grid.querySelectorAll('.gallery-item-coded').forEach(el => el.remove());
        for (const g of CODED_GLYPHS) {
            const el = make_item_el(g, () => this._pick(g));
            el.classList.add('gallery-item-coded');
            this._grid.appendChild(el);
        }
    }

    private async _load_svg_stamps(): Promise<void> {
        // Remove old SVG items
        this._grid.querySelectorAll('.gallery-item-svg').forEach(el => el.remove());

        let files: string[];
        try {
            const res = await fetch(new URL('stamps/index.json', document.baseURI).href);
            if (!res.ok) return;
            files = await res.json();
        } catch {
            return;
        }

        for (const filename of files) {
            const url = new URL(`stamps/${filename}`, document.baseURI).href;
            const item: SVGGlyph = { kind: 'svg', filename, url, label: filename_to_label(filename) };

            const el = make_item_el(item, () => this._pick(item));
            el.classList.add('gallery-item-svg');
            this._grid.appendChild(el);

            // Pre-load SVG; refresh thumbnail when loaded
            preloadSVG(url, () => {
                const thumb = el.querySelector('.gallery-thumbnail') as HTMLCanvasElement;
                if (!thumb) return;
                const imageData = new ImageData(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
                drawGlyphSVG(url, imageData, THUMBNAIL_SIZE / 2, THUMBNAIL_SIZE / 2, THUMB_RADIUS);
                thumb.getContext('2d')!.putImageData(imageData, 0, 0);
            });
        }
    }

    private _pick(item: GalleryItem): void {
        this.close();
        if (item.kind === 'selection') {
            this._on_activate('selection');
            return;
        }
        if (item.kind === 'coded') {
            set_pending_glyph(item.fn);
        } else {
            // SVG stamp: bind the URL into a closure
            const url = item.url;
            set_pending_glyph((imageData, cx, cy, r) => drawGlyphSVG(url, imageData, cx, cy, r));
        }
        this._on_activate('glyph_sizing');
    }
}
