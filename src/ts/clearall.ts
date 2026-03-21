import { EditingTool } from "./editing_tool";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";

export class ClearAllTool extends EditingTool {

    select() {
        if (this.document_canvas == null || this.document_context == null) {
            throw new Error("Cannot select tool if editor is not fully initialized")
        }
        const color = settings.peek<string>(SettingName.BackColor);
        this.document_context.fillStyle = color;
        this.document_context.fillRect(0, 0, this.document_canvas.width, this.document_canvas.height);
        this.document_dirty_signal!.value++;
        this.push_undo_snapshot?.();
    }
    start(at: Vector2, buttons: number) {}
    drag(at: Vector2) {}
    stop(at: Vector2) {}
    hover(at: Vector2) {}
}
