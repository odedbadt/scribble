import {ClickAndDragTool} from './click_and_drag_tool.js'
import { EditingToolApplier } from "./editing_tool_applier.js";
import { parse_RGBA } from './utils.js';
export class ScribbleTool extends ClickAndDragTool {
    private _recorded_to: any;
    constructor(context: CanvasRenderingContext2D,
                applier: EditingToolApplier,
                tmp_context: CanvasRenderingContext2D) {
        super(context, applier, true, tmp_context);
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
        const w = this.w;
        const h = this.h;
        const context_image_data = this.context.getImageData(0, 0, w, h)
        const context_data =  context_image_data.data;
    
        const tool_color = parse_RGBA(this.app.settings.fore_color);
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const offset = (w*y+x)*4;
                if (context_data[offset + 3] != 255) {
                    context_data[offset + 0] = tool_color[0];
                    context_data[offset + 1] = tool_color[1];
                    context_data[offset + 2] = tool_color[2];
                }
            }
        }
        this.context.putImageData(context_image_data, 0,0);

        // nop, implemenet me
        this._recorded_to = null;
        return true
    }
}
