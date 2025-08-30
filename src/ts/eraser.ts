import { ClickAndDragTool } from "./click_and_drag_tool"
import { Editor } from "./editor";
import { ScribbleTool } from "./scribble";
import { SettingName, settings } from "./settings_registry";
import { Vector2 } from "./types";
import { extend_canvas_mapping, rect_union } from "./utils";

export class EraserTool extends ScribbleTool {

    constructor() {
        super();
        this._stroke_color = settings.peek<string>(SettingName.LineWidth);
    }
}