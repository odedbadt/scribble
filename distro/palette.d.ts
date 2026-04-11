export declare class Palette {
    _hl_canvas: HTMLCanvasElement;
    _hl_w: number;
    _hl_h: number;
    private _sat_canvas;
    _sat_w: number;
    private _sat_h;
    private _rgb_color;
    private _hsl_color;
    constructor(hl_canvas: HTMLCanvasElement, sat_canvas: HTMLCanvasElement, initial_color_hsl: number[]);
    _plot_hl(): void;
    _plot_sat(): void;
    plot(): void;
    get_rgb_color(): number[];
    hl_click(x: number, y: number): void;
    sat_click(x: number, y: number): void;
}
//# sourceMappingURL=palette.d.ts.map