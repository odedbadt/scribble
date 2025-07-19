import { EditingTool } from "./editing_tool";
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { extend_canvas_mapping, tool_to_document } from "./utils";

export class ClearAllTool extends EditingTool {

    select() {
        if (this.document_canvas == null) {
            throw new Error("Cannot select tool if editor is not full initialized")
        }
        const dw = this.document_canvas.clientWidth;
        const dh = this.document_canvas.clientHeight;
        extend_canvas_mapping(this, { x: 0, y: 0, w: dw, h: dh });
        const w = this.canvas!.clientWidth;
        const h = this.canvas!.clientHeight;
        const color = settings.peek<string>(SettingName.BackColor);
        this.context!.fillStyle = color;
        this.context!.fillRect(0, 0, w, h);
        this.stop({ x: 0, y: 0 });

    }
    start(at: Vector2, buttons: number): boolean {
        throw new Error("Method not implemented.");
    }
    drag(at: Vector2): boolean {
        throw new Error("Method not implemented.");
    }
    stop(at: Vector2) {
        if (this.document_context == null) {
            throw new Error("Cannot stop tool if editor is not full initialized")
        }
        tool_to_document(this.canvas!,
            this.canvas_bounds_mapping_signal!.value, this.document_context);
        console.log('A');
        this.canvas_bounds_mapping_signal!.value = this.canvas_bounds_mapping_signal!.value;
        console.log('B');
    }
    select_action() {

    }
    hover(): boolean {
        return false
    }
}
