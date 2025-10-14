import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { SettingName, settings } from "./settings_registry";
import { state_registry, StateValue } from "./state_registry";
import { Vector2, unit_rect } from "./types";
export class CursorSize extends ClickAndDragTool {
    start(at: Vector2, buttons: number) {
        settings.set(SettingName.LineWidth, 0.5);
    }
    editing_drag(from: Vector2, to: Vector2) {

        const margin = 0
        const r = Math.sqrt((to.x - from.x) * (to.x - from.x) +
            (to.y - from.y) * (to.y - from.y));
        const rb = r * 1.05;
        const extended_canvas_bounding_rect = { x: from.x - rb, y: from.y - rb, w: rb * 2, h: rb * 2 }
        this.context!.beginPath();
        this.context!.strokeStyle = 'black'
        this.context!.ellipse(rb, rb, r, r, 0, 0, Math.PI * 2);
        this.context!.stroke();
        settings.set(SettingName.LineWidth, 2 * r);
    }
    hover(at: Vector2): boolean {
        return false
    }
    stop(at: Vector2): boolean {
        super.stop(at);
        this.canvas_signal!.value = null;
        //const select_tool_signal = state_registry.use_signal<string>(StateValue.SelectedToolName, 'scribble');
        //select_tool_signal.value = 'rect';
        state_registry.pop(StateValue.SelectedToolName)
        return false;
    }
    editing_stop(at: Vector2) {
    }
    commit_to_document() {

    }

}