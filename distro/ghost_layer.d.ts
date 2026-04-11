import { Signal } from "@preact/signals";
/**
 * "Invisible ink" layer.
 * Drawing tools commit here instead of the document when ghost mode is active.
 * The canvas is never rendered — pixels are 100% invisible until the RevealBrush
 * sweeps over them and copies them to the document canvas.
 */
export declare class GhostLayer {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    /** When true, all drawing tools commit to ghost canvas instead of document. */
    readonly enabled: Signal<boolean>;
    /** Incremented whenever ghost canvas changes (for external listeners). */
    readonly dirty: Signal<number>;
    constructor();
    resize(w: number, h: number): void;
}
export declare const ghost_layer: GhostLayer;
//# sourceMappingURL=ghost_layer.d.ts.map