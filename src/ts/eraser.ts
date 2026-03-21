import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { parseColor, RGBA } from "./pixel_utils";

export class EraserTool extends ScribbleTool {

    constructor() {
        super();
    }

    editing_start() {
        const colorStr = settings.peek<string>(SettingName.BackColor);
        this._stroke_color = parseColor(colorStr);
    }

    commit_to_document(_color: string | null = null) {
        super.commit_to_document(settings.peek<string>(SettingName.BackColor));
    }
}
