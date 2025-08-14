import { batch } from "@preact/signals";
import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { settings, SettingName } from "./settings_registry";
import { Vector2, unit_rect } from "./types";
import { parse_RGBA, tool_to_document } from "./utils";

export abstract class ClickTool extends EditingTool {
    init() {
        this.start = this.start.bind(this);
        this.drag = this.drag.bind(this);
        this.stop = this.stop.bind(this);
    }
    select() {
    }
    drag(at: Vector2) {
    }
    stop(at: Vector2) {
        if (this.document_context == null) {
            throw new Error("Cannot stop tool if editor is not full initialized")
        }
        this.editing_stop(at);
        const color = settings.peek<string>(SettingName.ForeColor);
        const color_array = parse_RGBA(color)
        tool_to_document(this.canvas!,
            this.canvas_bounds_mapping_signal!.value, this.document_context, color_array);
        batch(() => {
            this.canvas_bounds_mapping_signal!.value = this.canvas_bounds_mapping_signal!.value;
            this.canvas_signal!.value = this.canvas;
        });
    }
    editing_stop(at: Vector2) {
        // nop, implemenet me
    }


}
