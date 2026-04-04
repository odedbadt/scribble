import { MainApp } from "./main_app";
import { SettingName, settings } from "./settings_registry";
import { dist2, dist2_to_set } from "./utils";

export class ColorStack {
    _depth: number
    _stack: Array<number[]>
    _color_stack_items: HTMLCollectionOf<Element>;
    _color_selector_div_fore: HTMLElement;
    _color_selector_div_back: HTMLElement;
    _pairwise_threshold: number;
    color_depth: any;
    settings: any;
    view_context: any;
    private _app: MainApp;
    private _adjacent_threshold: number;
    // Last palette-picked color not yet committed to the stack (set before a stroke starts).
    private _pending_fore: number[] | null = null;
    private _pending_back: number[] | null = null;
    // Guard to prevent signal subscriptions from re-staging while select_color is running.
    _suppress_signal_stage = false;
    constructor(
        app: MainApp,
        depth: number,
        pairwise_threshold: number,
        adjacent_threshold: number,
        color_selector_div_fore: HTMLElement,
        color_selector_div_back: HTMLElement,
        color_stack_items: HTMLCollectionOf<Element>) {
        this._app = app
        this._depth = depth
        this._pairwise_threshold = pairwise_threshold
        this._adjacent_threshold = adjacent_threshold

        this._stack = new Array<number[]>()
        this._color_stack_items = color_stack_items;
        this._color_selector_div_fore = color_selector_div_fore
        this._color_selector_div_back = color_selector_div_back

    }
    refresh_color_stack() {
        const slots = this._color_stack_items;
        const l = this._stack.length;
        const _this = this;
        for (let j = 0; j < slots.length; ++j) {
            const slot: HTMLElement = slots[j] as HTMLElement
            if (j < l) {
                const color = this._stack[l - 1 - j]
                if (color == undefined) {
                    continue;
                }
                const color_string = `rgba(${color[0]},${color[1]},${color[2]},255)`;
                slot.style.backgroundColor = color_string;
                slot.addEventListener('click', (event) => {
                    _this.select_color(color, event.button == 0, false, false, true)
                })
            }
        }
    }

    select_color(color: number[], is_fore: boolean, update_stack?: boolean, force?: boolean, from_stack?: boolean) {
        if (update_stack) {
            if (force || this._stack.length == 0 ||
                dist2_to_set(color, this._stack) > this._pairwise_threshold &&
                dist2(color, this._stack[this._stack.length - 1]) > this._adjacent_threshold) {
                this._stack.push(color);
                if (this._stack.length > this._depth) {
                    this._stack.shift();
                }
            }
            this.refresh_color_stack()
        } else {
            // Stage color so it can be committed when actually used in a stroke.
            // If picked from the stack itself, clear the pending slot so it won't re-enter.
            if (is_fore) this._pending_fore = from_stack ? null : color;
            else this._pending_back = from_stack ? null : color;
        }
        const color_string = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        this._suppress_signal_stage = true;
        if (is_fore) {
            settings.set(SettingName.ForeColor, color_string);
            this._color_selector_div_fore.style.backgroundColor = color_string
        } else {
            settings.set(SettingName.BackColor, color_string);
            this._color_selector_div_back.style.backgroundColor = color_string
        }
        this._suppress_signal_stage = false;
    }

    /**
     * Called from signal subscriptions when a color is changed externally (e.g. by the dropper).
     * Stages the color as pending so it enters the history on next stroke.
     */
    stage_from_signal(color: number[], is_fore: boolean) {
        if (this._suppress_signal_stage) return;
        if (is_fore) this._pending_fore = color;
        else this._pending_back = color;
    }

    /** Call when a stroke actually starts, to commit the staged color to the history stack. */
    commit_pending(is_fore: boolean) {
        const pending = is_fore ? this._pending_fore : this._pending_back;
        if (!pending) return;
        if (is_fore) this._pending_fore = null;
        else this._pending_back = null;
        // Skip if an identical color is already anywhere in the stack.
        if (this._stack.length > 0 && dist2_to_set(pending, this._stack) === 0) return;
        this._stack.push(pending);
        if (this._stack.length > this._depth) this._stack.shift();
        this.refresh_color_stack();
    }

}