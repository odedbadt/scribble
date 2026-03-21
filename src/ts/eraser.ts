import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { parseColor, RGBA } from "./pixel_utils";

export class EraserTool extends ScribbleTool {
    // Eraser uses white (or could use background color)
    private _eraser_color: RGBA = [255, 255, 255, 255];

    constructor() {
        super();
        this._stroke_color = this._eraser_color;
    }

    editing_start() {
        const colorStr = settings.peek<string>(SettingName.BackColor);
        this._stroke_color = parseColor(colorStr);
    }
}
