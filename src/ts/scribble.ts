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
        let mn = 300
        const hist:Map<string, number> = new Map<string, number>()
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const offset = (w*y+x)*4;
                if (context_data[offset + 3] <  mn) {
                    mn = context_data[offset + 3]
                }
                const  key:string = `${context_data[offset + 0]}_${context_data[offset + 1]}_${context_data[offset + 2]}_${context_data[offset + 3]}`
                hist.set(key,(hist.get(key) || 0) + 1)
                if (context_data[offset + 3] > 0) {
                    context_data[offset + 0] = tool_color[0];
                    context_data[offset + 1] = tool_color[1];
                    context_data[offset + 2] = tool_color[2];
                    context_data[offset + 3] = 255;
                }
            }
        }
        console.log(hist)
        this.context.putImageData(context_image_data, 0,0);
        const ctx = this.app.art_context;
        setTimeout(() => {
            const context_image_data2 = ctx.getImageData(0, 0, w, h)
            const context_data2 =  context_image_data2.data;
            const hist2:Map<string, number> = new Map<string, number>()
            for (let y = 0; y < h; ++y) {
                for (let x = 0; x < w; ++x) {
                    const offset = (w*y+x)*4;
                    const key:string = `${context_data2[offset + 0]}_${context_data2[offset + 1]}_${context_data2[offset + 2]}_${context_data[offset + 3]}`
                    hist2.set(key,(hist2.get(key) || 0) + 1)
                }
            }
            console.log(hist2)
        }, 1000)

        // nop, implemenet me
        this._recorded_to = null;
        return true
    }
}
