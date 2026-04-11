import { signal, Signal } from "@preact/signals";

/**
 * "Invisible ink" layer.
 * Drawing tools commit here instead of the document when ghost mode is active.
 * The canvas is never rendered — pixels are 100% invisible until the RevealBrush
 * sweeps over them and copies them to the document canvas.
 */
export class GhostLayer {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    /** When true, all drawing tools commit to ghost canvas instead of document. */
    readonly enabled: Signal<boolean> = signal(false);
    /** Incremented whenever ghost canvas changes (for external listeners). */
    readonly dirty: Signal<number> = signal(0);

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1;
        this.canvas.height = 1;
        this.context = this.canvas.getContext('2d', { willReadFrequently: true })!;
        (this.context as CanvasRenderingContext2D).imageSmoothingEnabled = false;
    }

    resize(w: number, h: number) {
        if (this.canvas.width === w && this.canvas.height === h) return;
        const saved = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.width = w;
        this.canvas.height = h;
        (this.context as CanvasRenderingContext2D).imageSmoothingEnabled = false;
        if (saved.width > 0 && saved.height > 0) {
            this.context.putImageData(saved, 0, 0);
        }
    }
}

export const ghost_layer = new GhostLayer();
