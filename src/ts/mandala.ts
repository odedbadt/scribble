import {ClickAndDragTool} from './click_and_drag_tool'
import { Editor } from "./editor";
import { Vector2 } from './types';
import { parse_RGBA } from './utils';

function rotate(v:Vector2, w:number, h:number, a:number, mirror?:boolean) {
    const v2:Vector2 = {
        'x':(mirror ? -1 : 1)*(v.x-(w/2)),
        'y':v.y-(h/2)
    } 
    const v3:Vector2 = {
        'x':v2.x*Math.cos(a) - v2.y*Math.sin(a),
        'y':v2.x*Math.sin(a) + v2.y*Math.cos(a)
    }
    const v4:Vector2 = {
        'x':v3.x+(w/2),
        'y':v3.y+(h/2)
    }
    return v4;
}
export class mandala extends ClickAndDragTool {
    private _recorded_to: any;
    private _n: number;
    private _angles: Array<number>;
    constructor(context: CanvasRenderingContext2D,
                editor: Editor,
                tmp_context: CanvasRenderingContext2D) {
        super(context, editor, true, tmp_context);
        this._n = 8;
        const angles = []; 
        for (let j = 0; j < this._n;++j) {
            angles.push(Math.PI*2*(j/this._n));
        }
        this._angles = Array.from(angles);
    }

    hover_action(at: { x: any; y: any; }) {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.fore_color;
        const tmp_context = this.tmp_context!;
        const _this = this;
        this._angles.forEach((angle) => {
            const rotated = rotate(at, _this.w, _this.h, angle);
            tmp_context.beginPath();
            const r = this.app.settings.line_width / 2;
            tmp_context.ellipse(rotated.x, rotated.y, r, r, 0, 0, Math.PI * 2);
            tmp_context.fill();
        })
        return true;
    }
    editing_action(to: { x: any; y: any; }) {
        if (this._recorded_to) {
            const _this = this;
            Array.from([true, false]).forEach((mirror) => {
            this._angles.forEach((angle) => {
                const rotated_recorded = rotate(this._recorded_to, _this.w, _this.h, angle, mirror);
                const rotated_to = rotate(to, _this.w, _this.h, angle, mirror);
                _this.context.moveTo(rotated_recorded.x, rotated_recorded.y);
                _this.context.lineTo(rotated_to.x, rotated_to.y);
            });
        })
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
