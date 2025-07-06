import { Editor } from "./editor"
import { MainApp } from "./main_app";
import { Rect, Vector2, RectToRectMapping } from "./types";
import { Signal, signal, computed, effect } from "@preact/signals";

export abstract class EditingTool {
    canvas: HTMLCanvasElement | null = null;
    context: CanvasRenderingContext2D | null = null;
    canvas_bounds_mapping: RectToRectMapping | null = null;
    canvas_bounds_mapping_signal: Signal<RectToRectMapping> | null = null;

    zero: Vector2 | null = null
    safety = 0
    canvas_signal: Signal<HTMLCanvasElement | null> | null = null;
    document_context: CanvasRenderingContext2D | null = null;
    document_canvas: HTMLCanvasElement | null = null;

    constructor() {

    }
    init_editor(editor: Editor) {
        this.document_context = editor.document_context;
        this.document_canvas = editor.document_canvas;
    }
    abstract select(): void
    abstract start(at: Vector2, buttons: number): void;
    abstract drag(at: Vector2): void;
    stop(at: Vector2): void {
        this.canvas_signal!.value = null;
    }
    abstract hover(at: Vector2): void;

}
export class NopTool extends EditingTool {

    select() {
    }
    start(at: Vector2, buttons: number) {
    }
    drag(at: Vector2) {
    }
    stop(at: Vector2) {
    }
    hover(at: Vector2) {
    }
}
