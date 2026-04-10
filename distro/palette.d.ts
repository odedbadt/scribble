export declare class Palette {
    _hl_canvas: HTMLCanvasElement;
    _hl_w: number;
    _hl_h: number;
    private _sat_canvas;
    _sat_w: number;
    private _sat_h;
    private _rgb_color;
    private _hsl_color;
    private _hl_indicator_x;
    private _hl_indicator_y;
    constructor(hl_canvas: HTMLCanvasElement, sat_canvas: HTMLCanvasElement, initial_color_hsl: number[]);
    _plot_hl(): void;
    _plot_sat(): void;
    plot(): void;
    get_rgb_color_at(x: number, y: number): Uint8ClampedArray;
    get_rgb_color(): number[];
    _hl_canvas_xy_to_hl(x: number, y: number): number[];
    _sat_canvas_to_sat(x: number, y: number): number;
    hl_click(x: number, y: number): void;
    sat_click(x: number, y: number): void;
}
//# sourceMappingURL=palette.d.ts.map