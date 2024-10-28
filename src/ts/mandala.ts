import {ClickAndDragTool} from './click_and_drag_tool'
import { Editor } from "./editor";
import { Filter } from './filter';
import { override_canvas_context } from './utils';

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
export class Mandala extends ClickAndDragTool {
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
        Array.from([true, false]).forEach((mirror) => {
                this._angles.forEach((angle) => {
                tmp_context.save()
                tmp_context.translate(_this.w/2, _this.h/2);
                tmp_context.rotate(angle);
                if (mirror) {
                    tmp_context.scale(-1,1);
                }
                tmp_context.translate(-_this.w/2, -_this.h/2);
                tmp_context.beginPath();
                const r = this.app.settings.line_width / 2;
                tmp_context.ellipse(at.x, at.y, r, r, 0, 0, Math.PI * 2);
                tmp_context.fill();
                tmp_context.restore();
            })
        })
        return true;
    }
    editing_action(to: { x: any; y: any; }) {
        if (this._recorded_to) {
            const _this = this;
            Array.from([true, false]).forEach((mirror) => {
                this._angles.forEach((angle) => {
                    _this.context.save()
                    _this.context.translate(_this.w/2, _this.h/2);
                    _this.context.rotate(angle);
                    if (mirror) {
                        _this.context.scale(-1,1);
                    }
                    _this.context.translate(-_this.w/2, -_this.h/2);
                    _this.context.moveTo(_this._recorded_to.x, _this._recorded_to.y);
                    _this.context.lineTo(to.x, to.y);
                    _this.context.stroke();
                    _this.context.restore();
                });
            })
        }
        this._recorded_to = to;
        return true;
    }
    editing_stop(at:Vector2):boolean {
        this._recorded_to = null;
        return true
    }
}
export class MandalaFilter extends Filter {
    override_canvas_context(context_to: CanvasRenderingContext2D, canvas_from: HTMLCanvasElement, keep?: boolean | undefined, avoid_native?: boolean | undefined): void {
        const w = canvas_from.width;
        const h = canvas_from.height;
        
        Array.from([true, false]).forEach((mirror) => {
            this._angles.forEach((angle) => {
                context_to.save()
                context_to.translate(w/2, h/2);
                context_to.rotate(angle);
                if (mirror) {
                    context_to.scale(-1,1);
                }
                context_to.translate(-w/2, -h/2);
                override_canvas_context(context_to, canvas_from, true, false)
                context_to.restore();
            });
        })
        throw new Error('Method not implemented.');
    }
    _n: number;
    _angles: number[];
    constructor() {
        super()
        this._n = 8;
        const angles = []; 
        for (let j = 0; j < this._n;++j) {
            angles.push(Math.PI*2*(j/this._n));
        }
        this._angles = Array.from(angles);
    }
}

