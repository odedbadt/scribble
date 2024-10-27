import {ClickAndDragTool} from './click_and_drag_tool'
import { Editor } from "./editor";
import { parse_RGBA } from './utils';
export class ScribbleTool extends ClickAndDragTool {
    private _recorded_to: any;
    constructor(context: CanvasRenderingContext2D,
                editor: Editor,
                tmp_context: CanvasRenderingContext2D) {
        super(context, editor, true, tmp_context);
    }

    hover_action(at: { x: any; y: any; }) {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.fore_color;
        this.tmp_context.beginPath();
        const r = this.app.settings.line_width / 2;
        this.tmp_context.ellipse(at.x, at.y, r, r, 0, 0, Math.PI * 2);
        this.tmp_context.fill();
        return true;
    }
    editing_action(to: { x: any; y: any; }) {
        if (this._recorded_to) {
            this.context.moveTo(this._recorded_to.x, this._recorded_to.y);
            this.context.lineTo(to.x, to.y);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_stop(at:Vector2):boolean {
        this._recorded_to = null;
        return true
    }
}
