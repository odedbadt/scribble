import { ClickAndDragTool } from './click_and_drag_tool'
import { Editor } from "./editor";
import { Vector2 } from './types';
import { parse_RGBA } from './utils';

function rotate(v: Vector2, w: number, h: number, a: number, mirror?: boolean) {
    const v2: Vector2 = {
        'x': (mirror ? -1 : 1) * (v.x - (w / 2)),
        'y': v.y - (h / 2)
    }
    const v3: Vector2 = {
        'x': v2.x * Math.cos(a) - v2.y * Math.sin(a),
        'y': v2.x * Math.sin(a) + v2.y * Math.cos(a)
    }
    const v4: Vector2 = {
        'x': v3.x + (w / 2),
        'y': v3.y + (h / 2)
    }
    return v4;
}
export class mandala extends ClickAndDragTool {
    private _recorded_to: any;
    private _n: number;
    private _angles: Array<number>;
    constructor(editor: Editor,
    ) {
        super(editor);
        this._n = 8;
        const angles = [];
        for (let j = 0; j < this._n; ++j) {
            angles.push(Math.PI * 2 * (j / this._n));
        }
        this._angles = Array.from(angles);
        this.applied_canvas.width = this.editor.app.document_canvas.width;
        this.applied_canvas.height = this.editor.app.document_canvas.height;
        this.w = 1000;//this.applied_canvas.width;
        this.h = 1000;//this.applied_canvas.height ;
        
        this.top_left = { x: 0, y: 0 }
    }

    hover_action(at: { x: any; y: any; }) {
        if (!this.staging_context) {
            return false;
        }
        this.staging_context.fillStyle = this.app.settings.fore_color;
        const tmp_context = this.staging_context!;
        this._angles.forEach((angle) => {
            const rotated = rotate(at, this.w, this.h, angle);
            tmp_context.beginPath();
            const r = this.app.settings.line_width / 2;
            tmp_context.ellipse(rotated.x, rotated.y, r, r, 0, 0, Math.PI * 2);
            tmp_context.fill();
        })
        return true;
    }
    editing_action(to: { x: any; y: any; }) {
        if (!document.getElementById('mandala_canvas')) {
            document.getElementById('canvas-area')!.appendChild(this.staging_canvas); // OD: for testing
            this.staging_canvas.setAttribute('id', 'mandala_canvas')
        }
        this.applied_context.fillStyle = 'rgb(1,1,1,0)'
        this.applied_context.fillRect(0,0, this.w, this.h);
        this.staging_context.fillStyle = 'rgb(1,1,1,0)'
        this.staging_context.fillRect(0,0, this.w, this.h);   
        this.applied_context.beginPath();
        this.staging_context.beginPath();          
        if (this._recorded_to) {
            Array.from([true, false]).forEach((mirror) => {
                this._angles.forEach((angle) => {
                    const rotated_recorded = rotate(this._recorded_to, this.w, this.h, angle, mirror);
                    const rotated_to = rotate(to, this.w, this.h, angle, mirror);
                    this.applied_context.moveTo(rotated_recorded.x, rotated_recorded.y);
                    this.applied_context.lineTo(rotated_to.x, rotated_to.y);
                    this.staging_context.moveTo(rotated_recorded.x, rotated_recorded.y);
                    this.staging_context.lineTo(rotated_to.x, rotated_to.y);
                });
            })
        }
        this._recorded_to = to;
        this.applied_context.stroke();
        this.staging_context.stroke();
        return true;
    }
    editing_stop(at: Vector2): boolean {
        this._recorded_to = null;
        return true
    }
}
