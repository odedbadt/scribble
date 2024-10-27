import { hsl_to_rgb } from "./utils";

export class Palette {
    _canvas: HTMLCanvasElement;
    _w: number;
    _h: number;
    private _saturation: number;
    constructor(canvas:HTMLCanvasElement, saturation:number) {
        this._canvas = canvas
        this._w = canvas.width;
        this._h = canvas.height;
        this._saturation  = saturation
    }
    plot() {
        const context:CanvasRenderingContext2D = this._canvas.getContext('2d')!
        const image_data = context.getImageData(0,0,this._w, this._h)
        const data = image_data.data;
        for (let y = 0; y < this._h; ++y) {
            for (let x = 0; x < this._w; ++x) {
                const hsl_val = this.get_hsl_color_at(x, y);
                const rgb_val = hsl_to_rgb(hsl_val);
                const offset = 4*(x + y * this._w)
                data[offset] = rgb_val[0]
                data[offset + 1] = rgb_val[1]
                data[offset + 2] = rgb_val[2]
                data[offset + 3] = 255;
            }
        }
        context.putImageData(image_data,0,0);

    }
    get_rgb_color_at(x:number, y:number):Uint8ClampedArray {
        const context:CanvasRenderingContext2D = this._canvas.getContext('2d')!
        const data = context.getImageData(x,y,1,1).data;
        return data;

    }
    get_hsl_color_at(x:number, y:number) {
        const h = x/this._w+0.5
        const l = Math.min(1.0,Math.max(0,0.5+(y/this._h-0.5)*1.25));
        return [h, this._saturation, l]
    }

}