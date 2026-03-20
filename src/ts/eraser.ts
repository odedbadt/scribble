import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { RGBA } from "./pixel_utils";

export class EraserTool extends ScribbleTool {
    // Eraser uses white (or could use background color)
    private _eraser_color: RGBA = [255, 255, 255, 255];

    constructor() {
        super();
        this._stroke_color = this._eraser_color;
    }

    editing_start() {
        this._stroke_color = this._eraser_color;
    }

    editing_stop() {
        // Commit with eraser color
        this.commit_to_document('rgba(255, 255, 255, 255)');
    }
}
