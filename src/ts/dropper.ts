import { ClickTool } from "./click_tool"
import { EditingTool } from "./editing_tool";
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { state_registry, StateValue } from "./state_registry";
import { Vector2 } from "./types";
export class Dropper extends EditingTool {

    start(at: Vector2, buttons: number) {
        if (this.document_context == null) {
            throw new Error("Cannot edit if editor is not full initialized")
        }
        const color = this.document_context.getImageData(at.x, at.y, 1, 1).data;
        const is_fore = !!(buttons & 1);
        settings.set(is_fore ? SettingName.ForeColor : SettingName.BackColor,
            color);
    }

    hover(at: Vector2): boolean {
        return false
    }
    select() {

    }
    drag(at: Vector2) {

    }
    stop(at: Vector2): boolean {
        super.stop(at);
        this.canvas_signal!.value = null;
        state_registry.pop(StateValue.SelectedToolName)
        return false;
    }
}
