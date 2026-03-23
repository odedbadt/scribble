import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { parseColor, RGBA } from "./pixel_utils";

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
        super.commit_to_document(settings.peek<string>(SettingName.BackColor));
    }

    hover_color(): RGBA {
        return parseColor(settings.peek<string>(SettingName.BackColor));
    }
}
