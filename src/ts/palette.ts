import { hsl_to_rgb } from "./utils";

// _hl_canvas  = narrow vertical hue strip  (x ignored; y → hue 0..2)
// _sat_canvas = 2-D SL square              (x → saturation, y → lightness top=1)
export class Palette {
    _hl_canvas: HTMLCanvasElement;
    _hl_w: number;
    _hl_h: number;
    private _sat_canvas: HTMLCanvasElement;
    _sat_w: number;
    private _sat_h: number;
    private _rgb_color: number[];
    private _hsl_color: number[];

    constructor(hl_canvas: HTMLCanvasElement, sat_canvas: HTMLCanvasElement, initial_color_hsl: number[]) {
        this._hl_canvas = hl_canvas;
        this._hl_w = hl_canvas.width;
        this._hl_h = hl_canvas.height;
        this._sat_canvas = sat_canvas;
        this._rgb_color = hsl_to_rgb(initial_color_hsl);
        this._hsl_color = initial_color_hsl;
        this._sat_w = sat_canvas.width;
        this._sat_h = sat_canvas.height;
    }

    // Vertical rainbow strip: y → hue at full saturation / mid lightness.
    // A 1-px horizontal hairline marks the current hue.
    _plot_hl() {
        const ctx = this._hl_canvas.getContext('2d', { willReadFrequently: true })!;
        this._hl_w = this._hl_canvas.width;
        this._hl_h = this._hl_canvas.height;
        const img = ctx.getImageData(0, 0, this._hl_w, this._hl_h);
        const d = img.data;
        const ind_y = Math.round((this._hsl_color[0] / 2) * this._hl_h);
        for (let y = 0; y < this._hl_h; y++) {
            const h = (y / this._hl_h) * 2;
            let rgb = hsl_to_rgb([h, 1.0, 0.5]);
            if (y === ind_y) {
                rgb = [255 - rgb[0], 255 - rgb[1], 255 - rgb[2]];
            }
            for (let x = 0; x < this._hl_w; x++) {
                const off = 4 * (x + y * this._hl_w);
                d[off] = rgb[0]; d[off + 1] = rgb[1]; d[off + 2] = rgb[2]; d[off + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    }

    // 2-D SL square at the current hue: x → saturation (0..1), y → lightness (top=1, bottom=0).
    // A 1-px crosshair marks the current S+L position.
    _plot_sat() {
        const ctx = this._sat_canvas.getContext('2d', { willReadFrequently: true })!;
        this._sat_w = this._sat_canvas.width;
        this._sat_h = this._sat_canvas.height;
        const img = ctx.getImageData(0, 0, this._sat_w, this._sat_h);
        const d = img.data;
        const ind_x = Math.round(this._hsl_color[1] * this._sat_w);
        const ind_y = Math.round((1 - this._hsl_color[2]) * this._sat_h);
        for (let y = 0; y < this._sat_h; y++) {
            const l = 1 - y / this._sat_h;
            for (let x = 0; x < this._sat_w; x++) {
                const s = x / this._sat_w;
                let rgb = hsl_to_rgb([this._hsl_color[0], s, l]);
                if (x === ind_x || y === ind_y) {
                    rgb = [255 - rgb[0], 255 - rgb[1], 255 - rgb[2]];
                }
                const off = 4 * (x + y * this._sat_w);
                d[off] = rgb[0]; d[off + 1] = rgb[1]; d[off + 2] = rgb[2]; d[off + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    }

    plot() {
        this._plot_hl();
        this._plot_sat();
    }

    get_rgb_color(): number[] {
        return this._rgb_color;
    }

    // Hue strip click: only updates hue; saturation and lightness are preserved.
    hl_click(x: number, y: number) {
        const h = Math.max(0, Math.min(2, (y / this._hl_h) * 2));
        this._hsl_color = [h, this._hsl_color[1], this._hsl_color[2]];
        this._rgb_color = hsl_to_rgb(this._hsl_color);
        this.plot();
    }

    // SL square click: updates both saturation (x) and lightness (y).
    sat_click(x: number, y: number) {
        const s = Math.max(0, Math.min(1, x / this._sat_w));
        const l = Math.max(0, Math.min(1, 1 - y / this._sat_h));
        this._hsl_color = [this._hsl_color[0], s, l];
        this._rgb_color = hsl_to_rgb(this._hsl_color);
        this.plot();
    }
}