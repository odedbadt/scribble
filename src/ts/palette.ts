import { hsl_to_rgb } from "./utils";

export class Palette {
    _hl_canvas: HTMLCanvasElement;
    _hl_w: number;
    _hl_h: number;
    private _sat_canvas: HTMLCanvasElement;
    _sat_w: number;
    private _sat_h: number;
    private _rgb_color: number[];
    private _hsl_color: number[];
    constructor(hl_canvas:HTMLCanvasElement, sat_canvas:HTMLCanvasElement, initial_color_hsl:number[]) {
        this._hl_canvas = hl_canvas
        this._hl_w = hl_canvas.width;
        this._hl_h = hl_canvas.height;
        this._sat_canvas = sat_canvas;
        this._rgb_color = hsl_to_rgb(initial_color_hsl);
        this._hsl_color = initial_color_hsl;
        this._sat_w = sat_canvas.width;
        this._sat_h = sat_canvas.height;
    }
    _plot_hl() {
        const hl_context:CanvasRenderingContext2D = this._hl_canvas.getContext('2d', {willReadFrequently:true})!
        const hl_image_data = hl_context.getImageData(0,0,this._hl_w, this._hl_h)
        const hl_data = hl_image_data.data;
        for (let y = 0; y < this._hl_h; ++y) {
            for (let x = 0; x < this._hl_w; ++x) {
                const hl = this._hl_canvas_xy_to_hl(x, y)
                const h = hl[0];
                const l = hl[1];
                const hsl_val =  [h, this._hsl_color[1], l];
                const rgb_val = hsl_to_rgb(hsl_val);
                const offset = 4*(x + y * this._hl_w)
                hl_data[offset] = rgb_val[0]
                hl_data[offset + 1] = rgb_val[1]
                hl_data[offset + 2] = rgb_val[2]
                hl_data[offset + 3] = 255;
            }
        }
        hl_context.putImageData(hl_image_data, 0, 0);

    }
    _plot_sat() {
        const sat_context:CanvasRenderingContext2D = this._sat_canvas.getContext('2d', {willReadFrequently:true})!
        const sat_image_data = sat_context.getImageData(0,0,this._sat_w, this._sat_h)
        const sat_data = sat_image_data.data;
        for (let y = 0; y < this._sat_h; ++y) {
            for (let x = 0; x < this._sat_w; ++x) {
                const sat = this._sat_canvas_to_sat(x, y);
                const rgb_val = hsl_to_rgb([this._hsl_color[0], sat, this._hsl_color[2]]);
                const offset = 4*(x + y * this._sat_w);
                sat_data[offset] = rgb_val[0];
                sat_data[offset + 1] = rgb_val[1];
                sat_data[offset + 2] = rgb_val[2];
                sat_data[offset + 3] = 255;
            }
        }
        sat_context.putImageData(sat_image_data, 0, 0);

    }

    plot() {
        this._plot_hl();
        this._plot_sat();
    }
    get_rgb_color_at(x:number, y:number):Uint8ClampedArray {
        const context:CanvasRenderingContext2D = this._hl_canvas.getContext('2d')!
        const data = context.getImageData(x,y,1,1).data;
        return data;

    }
    get_rgb_color():number[] {
        return this._rgb_color;
    }
    _hl_canvas_xy_to_hl(x:number, y:number):number[] {
        const h = 2*(x / this._hl_w-0.5);
        const l = Math.min(1.0, Math.max(0, 0.5 + (y / this._hl_h - 0.5) * 1.25));
        return [h,l]
    }
    _sat_canvas_to_sat(x:number, y:number):number {
        return y/this._sat_h
    }
    hl_click(x:number, y:number) {
        const hl = this._hl_canvas_xy_to_hl(x, y)
        this._hsl_color = [hl[0], this._hsl_color[1], hl[1]]
        this._rgb_color = hsl_to_rgb(this._hsl_color);
        this.plot()
    }
    sat_click(x:number, y:number) {
        this._hsl_color = [this._hsl_color[0], this._sat_canvas_to_sat(x,y), this._hsl_color[2]]
        this._rgb_color = hsl_to_rgb(this._hsl_color);
        this.plot()
    }

}