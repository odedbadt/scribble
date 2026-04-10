import { MainApp } from "./main_app";
export type ColorSlot = 'line' | 'fill' | 'back';
export declare class ColorStack {
    _depth: number;
    _stack: Array<number[]>;
    _color_stack_items: HTMLCollectionOf<Element>;
    _color_selector_div_line: HTMLElement;
    _color_selector_div_fill: HTMLElement;
    _color_selector_div_back: HTMLElement;
    _pairwise_threshold: number;
    color_depth: any;
    settings: any;
    view_context: any;
    private _app;
    private _adjacent_threshold;
    private _pending_line;
    private _pending_fill;
    private _pending_back;
    _suppress_signal_stage: boolean;
    constructor(app: MainApp, depth: number, pairwise_threshold: number, adjacent_threshold: number, color_selector_div_line: HTMLElement, color_selector_div_fill: HTMLElement, color_selector_div_back: HTMLElement, color_stack_items: HTMLCollectionOf<Element>);
    refresh_color_stack(): void;
    select_color(color: number[], slot: ColorSlot, update_stack?: boolean, force?: boolean, from_stack?: boolean): void;
    /**
     * Called from signal subscriptions when a color is changed externally (e.g. by the dropper).
     * Stages the color as pending so it enters the history on next stroke.
     */
    stage_from_signal(color: number[], slot: ColorSlot): void;
    /** Call when a stroke actually starts, to commit the staged color to the history stack. */
    commit_pending(slot: ColorSlot): void;
}
//# sourceMappingURL=color_stack.d.ts.map