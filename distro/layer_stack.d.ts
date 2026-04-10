import { Signal } from "@preact/signals";
export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
}
export declare class LayerStack {
    layers: Signal<Layer[]>;
    active_index: Signal<number>;
    composite_canvas: HTMLCanvasElement;
    private _composite_context;
    /** Holds the composite of all visible layers *above* the active layer. */
    above_composite_canvas: HTMLCanvasElement;
    private _above_composite_context;
    constructor(width: number, height: number);
    get active_layer(): Layer;
    get width(): number;
    get height(): number;
    add_layer(): Layer;
    /**
     * Removes the layer at `index`.  Returns a snapshot for undo, or null if
     * this is the last remaining layer.
     */
    delete_layer(index: number): {
        layer: Layer;
        index: number;
    } | null;
    /** Re-inserts a previously deleted layer at its original position. */
    restore_layer(layer: Layer, index: number): void;
    move_layer(from_index: number, to_index: number): void;
    set_visible(index: number, visible: boolean): void;
    set_locked(index: number, locked: boolean): void;
    set_active(index: number): void;
    /**
     * When set, recomposite_split() uses this order instead of layers.peek().
     * Used during drag to show a live preview without mutating the layers signal.
     */
    preview_order: Layer[] | null;
    /**
     * Index of the layer currently in pan mode, or null.
     * When set, canvas pointer events pan this layer instead of drawing.
     */
    pan_layer_index: number | null;
    /**
     * Composites visible layers onto two canvases split by the active layer:
     *  - composite_canvas      ← layers at or below the active layer
     *  - above_composite_canvas ← layers strictly above the active layer
     *
     * When preview_order is set (drag), the active layer's position is determined
     * by its position within preview_order.
     */
    recomposite(): void;
    /**
     * Returns the topmost visible layer (and its index) that has a non-transparent
     * pixel at (x, y), or null if all layers are transparent there.
     */
    topmost_layer_at(x: number, y: number): {
        layer: Layer;
        index: number;
    } | null;
    /**
     * Returns the topmost visible layer (and its index) that has any non-transparent
     * pixel within a circle of `radius` pixels around (cx, cy).
     * This is more robust than `topmost_layer_at` when the drag_start may be slightly
     * off a stroke — it finds the highest layer with paint anywhere in the brush area.
     * Falls back to `topmost_layer_at` when radius <= 0.
     */
    topmost_layer_in_radius(cx: number, cy: number, radius: number, min_index?: number): {
        layer: Layer;
        index: number;
    } | null;
    /**
     * Resizes all layer canvases and the composite canvas.
     * offset_x / offset_y shift the existing pixel content (for _grow_left / _grow_top).
     */
    resize_all(new_w: number, new_h: number, offset_x?: number, offset_y?: number): void;
}
//# sourceMappingURL=layer_stack.d.ts.map