import { OrthographicCamera } from "three";
import { Signal } from "@preact/signals";
import { Rect, RectToRectMapping } from "./types";
import { LayerStack } from "./layer_stack";
export declare class ScribRenderer {
    layer_stack: LayerStack;
    view_canvas: HTMLCanvasElement;
    overlay_canvas_signal: Signal<HTMLCanvasElement>;
    overlay_canvas_bounds_signal: Signal<RectToRectMapping>;
    document_dirty_signal: Signal<number>;
    view_port_signal: Signal<Rect>;
    anchor_canvas_signal: Signal<HTMLCanvasElement>;
    constructor(layer_stack: LayerStack, overlay_canvas_signal: Signal<HTMLCanvasElement>, overlay_canvas_bounds_signal: Signal<RectToRectMapping>, document_dirty_signal: Signal<number>, view_port_signal: Signal<Rect>, anchor_canvas_signal: Signal<HTMLCanvasElement>);
    init(): void;
    init_camera(vp: Rect): OrthographicCamera;
    init_render_loop(): void;
}
//# sourceMappingURL=scrib_renderer.d.ts.map