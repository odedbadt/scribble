import { signal, Signal } from "@preact/signals";

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
}

let _layer_counter = 0;

function make_layer(width: number, height: number, name?: string): Layer {
    _layer_counter++;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    context.imageSmoothingEnabled = false;
    return {
        id: `layer-${_layer_counter}`,
        name: name ?? `Layer ${_layer_counter}`,
        visible: true,
        canvas,
        context,
    };
}

export class LayerStack {
    layers: Signal<Layer[]>;
    active_index: Signal<number>;
    composite_canvas: HTMLCanvasElement;
    private _composite_context: CanvasRenderingContext2D;

    constructor(width: number, height: number) {
        this.composite_canvas = document.createElement('canvas');
        this.composite_canvas.width = width;
        this.composite_canvas.height = height;
        this._composite_context = this.composite_canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this._composite_context.imageSmoothingEnabled = false;

        const initial_layer = make_layer(width, height, 'Layer 1');
        _layer_counter = 1; // reset so first explicit add_layer yields "Layer 2"
        this.layers = signal<Layer[]>([initial_layer]);
        this.active_index = signal<number>(0);
    }

    get active_layer(): Layer {
        const idx = this.active_index.peek();
        const layers = this.layers.peek();
        return layers[idx] ?? layers[0];
    }

    get width(): number { return this.composite_canvas.width; }
    get height(): number { return this.composite_canvas.height; }

    add_layer(): Layer {
        const layers = this.layers.peek().slice();
        const new_layer = make_layer(this.composite_canvas.width, this.composite_canvas.height);
        layers.push(new_layer);
        this.layers.value = layers;
        this.active_index.value = layers.length - 1;
        return new_layer;
    }

    /**
     * Removes the layer at `index`.  Returns a snapshot for undo, or null if
     * this is the last remaining layer.
     */
    delete_layer(index: number): { layer: Layer; index: number } | null {
        const layers = this.layers.peek();
        if (layers.length <= 1) return null;
        const layer = layers[index];
        const new_layers = layers.slice();
        new_layers.splice(index, 1);
        this.layers.value = new_layers;
        this.active_index.value = Math.min(this.active_index.peek(), new_layers.length - 1);
        return { layer, index };
    }

    /** Re-inserts a previously deleted layer at its original position. */
    restore_layer(layer: Layer, index: number): void {
        const layers = this.layers.peek().slice();
        layers.splice(index, 0, layer);
        this.layers.value = layers;
        this.active_index.value = index;
    }

    move_layer(from_index: number, to_index: number): void {
        if (from_index === to_index) return;
        const layers = this.layers.peek().slice();
        const [layer] = layers.splice(from_index, 1);
        layers.splice(to_index, 0, layer);
        // Keep active index tracking the same layer
        let active = this.active_index.peek();
        if (active === from_index) {
            active = to_index;
        } else if (from_index < active && to_index >= active) {
            active--;
        } else if (from_index > active && to_index <= active) {
            active++;
        }
        this.layers.value = layers;
        this.active_index.value = active;
    }

    set_visible(index: number, visible: boolean): void {
        const layers = this.layers.peek().slice();
        layers[index] = { ...layers[index], visible };
        this.layers.value = layers;
    }

    set_active(index: number): void {
        this.active_index.value = index;
    }

    /** Composites all visible layers onto composite_canvas. */
    recomposite(): void {
        const w = this.composite_canvas.width;
        const h = this.composite_canvas.height;
        this._composite_context.clearRect(0, 0, w, h);
        for (const layer of this.layers.peek()) {
            if (layer.visible) {
                this._composite_context.drawImage(layer.canvas, 0, 0);
            }
        }
    }

    /**
     * Resizes all layer canvases and the composite canvas.
     * offset_x / offset_y shift the existing pixel content (for _grow_left / _grow_top).
     */
    resize_all(new_w: number, new_h: number, offset_x: number = 0, offset_y: number = 0): void {
        for (const layer of this.layers.peek()) {
            const img = layer.context.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
            layer.canvas.width = new_w;
            layer.canvas.height = new_h;
            layer.context.imageSmoothingEnabled = false;
            layer.context.putImageData(img, offset_x, offset_y);
        }
        this.composite_canvas.width = new_w;
        this.composite_canvas.height = new_h;
        this._composite_context.imageSmoothingEnabled = false;
    }
}
