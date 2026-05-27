import { EditingTool } from "./editing_tool";
import { Vector2 } from "./types";
import { Signal, ReadonlySignal } from "@preact/signals";

export class Dropper extends EditingTool {
    private _buttons: number = 0;

    constructor(
        private _fore_color: Signal<string>,
        private _fill_color: Signal<string>,
        private _back_color: Signal<string>,
        private _selected_tool_name: Signal<string>,
        private _previous_tool_name: ReadonlySignal<string | undefined>,
    ) {
        super();
    }

    private _pick(at: Vector2) {
        const result = this.layer_stack?.topmost_layer_at(at.x, at.y);
        if (!result) return; // fully transparent at this pixel
        const data = result.layer.context.getImageData(at.x, at.y, 1, 1).data;
        const color_string = `rgba(${data[0]},${data[1]},${data[2]},255)`;
        const target = (this._buttons & 4)
            ? this._fill_color
            : (this._buttons & 1)
            ? this._fore_color
            : this._back_color;
        target.value = color_string;
    }

    start(at: Vector2, buttons: number) {
        this._buttons = buttons;
        this._pick(at);
    }

    drag(at: Vector2) {
        this._pick(at);
    }

    hover(at: Vector2): boolean {
        return false;
    }

    select() {}

    stop(at: Vector2) {
        super.stop(at);
        const prev = this._previous_tool_name.peek();
        if (prev !== undefined) {
            this._selected_tool_name.value = prev;
        }
    }
}
