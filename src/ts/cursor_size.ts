import { ClickAndDragTool } from "./click_and_drag_tool"
import { SettingName, settings } from "./settings_registry";
import { state_registry, StateValue } from "./state_registry";
import { Vector2 } from "./types";

export class CursorSize extends ClickAndDragTool {
    start(at: Vector2, buttons: number) {
        super.start(at, buttons);
    }

    editing_drag(from: Vector2, to: Vector2) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r < 1) return;

        const rb = Math.ceil(r) + 2;
        this.extend_canvas_mapping({ x: from.x - rb, y: from.y - rb, w: rb * 2, h: rb * 2 }, false);

        const ctx = this.context!;
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.ellipse(rb, rb, r, r, 0, 0, Math.PI * 2);
        ctx.stroke();

        settings.set(SettingName.LineWidth, Math.round(2 * r));
        this.publish_signals();
    }

    hover(at: Vector2): boolean {
        return false;
    }

    stop(at: Vector2) {
        super.stop(at);
        state_registry.pop(StateValue.SelectedToolName);
    }

    commit_to_document() {
        // intentionally empty — preview circle must not be committed to the document
    }
}
