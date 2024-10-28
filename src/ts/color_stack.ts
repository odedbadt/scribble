import { MainApp } from "./main_app";
import { dist2_to_set } from "./utils";

export class ColorStack {
    _depth: number
    _stack: Array<number[]>
    _color_stack_items: HTMLCollectionOf<Element>;
    _color_selector_div_fore: HTMLElement;
    _color_selector_div_back: HTMLElement;
    _stack_entry_threshold: number;
    color_depth: any;
    settings: any;
    view_context: any;
    private _app: MainApp;
    constructor(
        app:MainApp, 
        depth:number, 
        stack_entry_threshold:number,
        color_selector_div_fore:HTMLElement,
        color_selector_div_back:HTMLElement,
        color_stack_items:HTMLCollectionOf<Element>) {
        this._app = app
        this._depth = depth
        this._stack_entry_threshold = stack_entry_threshold
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
            const slot:HTMLElement = slots[j] as HTMLElement
            if (j < l) {
                const color = this._stack.at(l-1-j)
                if (color == undefined) {
                    continue;
                }
                const color_string = `rgba(${color[0]},${color[1]},${color[2]},255)`;
                slot.style.backgroundColor = color_string;
                slot.addEventListener('click', (event) => {
                    _this.select_color(color, event.button ==  0, false)
                })
            }
        }
    }

    select_color(color:number[], is_fore:boolean, update_stack?:boolean) {
        if (update_stack) {
            const d = dist2_to_set(color, this._stack);
            if (d == null || d > this._stack_entry_threshold) {
                this._stack.push(color);
                if (this._stack.length > this._depth) {
                    this._stack.shift();
                }
            }
            this.refresh_color_stack()
        }
        const color_string = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        if (is_fore) {
            this._app.settings.fore_color = color_string;
            this._app.view_context.strokeStyle = color_string;
            this._color_selector_div_fore.style.backgroundColor = color_string
        } else  {
            this._app.settings.back_color = color_string;
            this._color_selector_div_back.style.backgroundColor = color_string
        }
    }

}