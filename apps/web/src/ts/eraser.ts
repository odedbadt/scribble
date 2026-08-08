import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { parseColor, RGBA } from "./pixel_utils";
import { color_token_registry } from "./color_token_registry";
import { tool_erase_token_canvas, tool_erase_ghost_canvas } from "./utils";
import { ghost_layer } from "./ghost_layer";

export class EraserTool extends ScribbleTool {
    constructor() {
        super();
    }

    editing_start() {
        this._stroke_color = parseColor(settings.peek<string>(SettingName.BackColor));
        this._prev = null;
        this.editing_drag(this.drag_start!, this.drag_start!);
    }

    commit_to_document(_color: string | null = null) {
        // In token mode, erase from the token canvas instead of drawing back-color
        const active_token_idx = color_token_registry.active_index.peek();
        if (active_token_idx !== null) {
            if (!this.canvas_bounds_mapping) return;
            const token = color_token_registry.tokens[active_token_idx];
            tool_erase_token_canvas(this.canvas!, this.canvas_bounds_mapping, token.context);
            token.dirty.value++;
            return;
        }
        // In ghost mode, erase from the ghost canvas
        if (ghost_layer.enabled.peek()) {
            if (!this.canvas_bounds_mapping) return;
            tool_erase_ghost_canvas(this.canvas!, this.canvas_bounds_mapping, ghost_layer.context);
            ghost_layer.dirty.value++;
            return;
        }
        super.commit_to_document(settings.peek<string>(SettingName.BackColor));
    }

    hover_color(): RGBA {
        return parseColor(settings.peek<string>(SettingName.BackColor));
    }
}
