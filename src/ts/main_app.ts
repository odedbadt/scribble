import { Editor } from "./editor"
import { Palette } from './palette'
import { ColorStack } from "./color_stack";
import { LayerStack } from "./layer_stack";
import { LayerPanel } from "./layer_panel";
import { Rect, RectToRectMapping } from "./types";
//import { GoogleDrive } from "./gdrive"
import { Signal, signal, computed, effect } from "@preact/signals";
import { ScribRenderer } from "./scrib_renderer";
import { SettingName, settings } from './settings_registry'
import { StateValue, state_registry } from "./state_registry";
import { mandala_mode } from "./mandala_mode";
import { anchor_manager } from "./anchor_manager";
function click_for_a_second(id: string, callback: Function) {
    const elem = document.getElementById(id);
    if (elem) {
        elem.addEventListener('click', () => {
            elem.classList.add('pressed')
            callback()
            window.setTimeout(() => {
                elem.classList.remove('pressed')
            }, 120)

        })
    }
}

/** Parse an `rgba(r,g,b,a)` string into a `[r,g,b]` array, or null on failure. */
function parse_rgba_string(s: string): number[] | null {
    if (!s) return null;
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}
export class MainApp {
    public overlay_canvas_signal = signal<CanvasRenderingContext2D>();
    private scrib_renderer: ScribRenderer;
    private anchor_canvas_signal = signal<HTMLCanvasElement>(null as any);
    private _anchor_canvas: HTMLCanvasElement = document.createElement('canvas');
    layer_stack: LayerStack;

    /** Active layer canvas — used by legacy helpers that reference document_canvas. */
    get document_canvas(): HTMLCanvasElement { return this.layer_stack.composite_canvas; }
    /** Active layer context. */
    get document_context(): CanvasRenderingContext2D { return this.layer_stack.active_layer.context; }

    view_canvas: HTMLCanvasElement;
    editor: Editor;
    // google_drive?: GoogleDrive;
    color_stack: ColorStack;
    layer_panel: LayerPanel;
    palette: Palette;
    palette_hl_canvas: HTMLCanvasElement;
    palette_sat_canvas: HTMLCanvasElement;
    tool_canvas_signal: any;
    tool_bounds_signal: any;
    document_dirty_signal: Signal<number>;
    view_port_signal: Signal<Rect>;

    constructor() {
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;

        // Initialise canvases to match viewport before creating layers
        const init_w = this.view_canvas.clientWidth || 800;
        const init_h = this.view_canvas.clientHeight || 600;

        this.layer_stack = new LayerStack(init_w, init_h);

        this.palette = new Palette(
            document.getElementById('hl-selector-canvas')! as HTMLCanvasElement,
            document.getElementById('sat-selector-canvas')! as HTMLCanvasElement, [1, 1, 0.5]);
        this.palette_hl_canvas = document.getElementById('hl-selector-canvas')! as HTMLCanvasElement
        this.palette_sat_canvas = document.getElementById('sat-selector-canvas')! as HTMLCanvasElement
        this.color_stack = new ColorStack(this, 36, 100, 10000,
            document.getElementById('color-selector-div-fore')!,
            document.getElementById('color-selector-div-back')!,
            document.getElementsByClassName('color_stack_item')
        )
        // Seed the stack with the initial foreground color so it appears from the start.
        this.color_stack.select_color(this.palette.get_rgb_color(), true, true, true);
        this.tool_canvas_signal = signal<HTMLCanvasElement>()
        this.document_dirty_signal = signal<number>(0)
        this.tool_bounds_signal = signal<RectToRectMapping>(
            {
                from: { x: 0, y: 0, w: 200, h: 200 },
                to: { x: 0, y: 0, w: 200, h: 200 }
            }
        )
        this.view_port_signal = signal<Rect>({
            x: 0, y: 0, w: init_w, h: init_h
        })
        this.editor = new Editor(this.layer_stack,
            this.view_canvas,
            this.tool_canvas_signal,
            this.tool_bounds_signal,
            this.view_port_signal,
            this.document_dirty_signal);
        this.scrib_renderer = new ScribRenderer(this.layer_stack,
            this.tool_canvas_signal,
            this.tool_bounds_signal,
            this.document_dirty_signal,
            this.view_port_signal,
            this.anchor_canvas_signal);

        this.layer_panel = new LayerPanel(this.editor, document.getElementById('layer-panel')!);

        // Re-render anchor overlay whenever anchors change
        anchor_manager.dirty.subscribe(() => this._redraw_anchor_canvas());

        settings.bulkSet({
            fore_color: 'rgba(255,0,0,255)',
            back_color: 'rgba(255,255,255,255)',
            line_width: 10,
            filled: true,
        });
        this.init_canvases();
        this.scrib_renderer.init();
    }
    init_canvases() {
        const w = this.view_canvas.clientWidth;
        const h = this.view_canvas.clientHeight;
        this.view_canvas.width = w;
        this.view_canvas.height = h;
        this.layer_stack.resize_all(w, h);
        this.view_port_signal.value = { x: 0, y: 0, w, h };
    }


    _perform_select_tool(tool_name: string) {
        const button = document.getElementsByClassName(tool_name)[0];
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(other_button => {
            // Mode-toggle buttons keep their pressed state when switching tools
            if (!other_button.classList.contains('mandala') &&
                other_button.id !== 'layers-btn' &&
                other_button.id !== 'anchor-btn') {
                other_button.classList.remove('pressed');
            }
        });
        button.classList.add('pressed')
        this.editor.select_tool(tool_name)
    }
    select_tool(tool_name: string) {
        state_registry.set<string>(StateValue.SelectedToolName, tool_name);
        this._perform_select_tool(tool_name);
    }
    load_image(url: string) {
        const img = new Image();
        img.addEventListener('load', () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            this.layer_stack.resize_all(w, h);
            this.layer_stack.active_layer.context.drawImage(img, 0, 0);
            // Keep current viewport size (zoom level); reset pan to origin
            const vp = this.view_port_signal.value;
            this.view_port_signal.value = { x: 0, y: 0, w: vp.w, h: vp.h };
            this.document_dirty_signal.value++;
            // Loading a new image resets undo history (old history is invalid after resize)
            this.editor.clear_undo_history();
        });
        img.src = url;
    }
    init_load_save() {
        document.getElementById('save_button')!.addEventListener('click', async () => {
            // Recomposite all layers, then export the composite canvas
            this.layer_stack.recomposite();
            const composite = this.layer_stack.composite_canvas;
            const w = composite.width;
            const h = composite.height;
            const ctx = composite.getContext('2d')!;
            const imageData = ctx.getImageData(0, 0, w, h);
            const offscreen = document.createElement('canvas');
            offscreen.width = w;
            offscreen.height = h;
            const offCtx = offscreen.getContext('2d')!;
            offCtx.putImageData(imageData, 0, 0);
            const blob = await new Promise<Blob | null>(resolve =>
                offscreen.toBlob(resolve, 'image/png'));
            if (!blob) return;
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: 'image.png',
                types: [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        });
        const file_input = document.getElementById('file_input')! as HTMLInputElement;
        file_input.addEventListener('change', (event: Event) => {
            const input = event.target as HTMLInputElement;
            if (input?.files?.[0]?.type === 'image/png') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target) this.load_image(e.target.result as string);
                };
                reader.readAsDataURL(input.files[0]);
            }
            file_input.value = '';
        });
        document.getElementById('load_button')!.addEventListener('click', () => {
            file_input.click();
        });
    }
    init_undo_redo_buttons() {
        click_for_a_second('undo_button', () => {
            this.editor.undo()
        }
        )
        click_for_a_second('redo_button', () => {
            this.editor.redo()
        }
        )
    }

    init_buttons() {

        // Toolbar fold button: exclusive page flip (only one page visible at a time)
        const fold_btn = document.getElementById('toolbar-fold-btn')!;
        const toolbar_page1 = document.getElementById('toolbar-page-1')!;
        const toolbar_page2 = document.getElementById('toolbar-page-2')!;
        fold_btn.addEventListener('click', () => {
            const is_open = toolbar_page2.classList.toggle('open');
            toolbar_page1.classList.toggle('hidden', is_open);
            fold_btn.textContent = is_open ? '▲' : '▼';
        });

        // Mandala button: toggle mode, independent of tool selection
        const mandala_button = document.getElementsByClassName('mandala')[0] as HTMLElement;
        const mandala_panel = document.getElementById('mandala-panel')!;
        const mandala_n_val = document.getElementById('mandala-n-val')!;
        const mandala_mirror_btn = document.getElementById('mandala-mirror')!;

        const rect_button = document.getElementsByClassName('rect')[0] as HTMLElement;
        mandala_button.addEventListener('click', () => {
            mandala_mode.enabled = !mandala_mode.enabled;
            if (!mandala_mode.enabled) {
                anchor_manager.set_mandala_center(-1);
                mandala_mode.center = null;
                this.editor.tool.pointer_leave?.();
            }
            mandala_button.classList.toggle('pressed', mandala_mode.enabled);
            mandala_panel.classList.toggle('visible', mandala_mode.enabled);
            rect_button.classList.toggle('tool-disabled', mandala_mode.enabled);
            // If rect was selected when mandala turns on, switch to scribble
            if (mandala_mode.enabled && state_registry.peek<string>(StateValue.SelectedToolName) === 'rect') {
                this.select_tool('scribble');
            }
        });

        document.getElementById('mandala-n-minus')!.addEventListener('click', () => {
            mandala_mode.n = Math.max(1, mandala_mode.n - 1);
            mandala_n_val.textContent = String(mandala_mode.n);
        });
        document.getElementById('mandala-n-plus')!.addEventListener('click', () => {
            mandala_mode.n = Math.min(32, mandala_mode.n + 1);
            mandala_n_val.textContent = String(mandala_mode.n);
        });
        document.getElementById('mandala-mirror')!.addEventListener('click', () => {
            mandala_mode.mirror = !mandala_mode.mirror;
            mandala_mirror_btn.textContent = mandala_mode.mirror ? 'on' : 'off';
            mandala_mirror_btn.classList.toggle('pressed', mandala_mode.mirror);
        });

        const fillstyle_button = document.getElementsByClassName('fillstyle')[0] as HTMLElement;
        const fillable_buttons = document.getElementsByClassName('fillable');
        fillstyle_button.addEventListener('click', () => {
            const filled = !settings.peek<boolean>(SettingName.Filled);
            settings.set(SettingName.Filled, filled);
            fillstyle_button.classList.toggle('filled', filled);
            Array.from(fillable_buttons).forEach(btn => btn.classList.toggle('filled', filled));
        });

        // Layers button: toggles the layer panel
        const layers_btn = document.getElementById('layers-btn')!;
        layers_btn.addEventListener('click', () => {
            this.layer_panel.toggle();
            layers_btn.classList.toggle('pressed', this.layer_panel['_open']);
        });

        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(button => {
            const button_class_list = button.classList;
            if (button_class_list[0] != 'button' && button_class_list[0] != 'mandala' && button_class_list[0] != 'fillstyle') {
                button.addEventListener('click', event => {
                    if (mandala_mode.enabled && button_class_list[0] === 'rect') return;
                    this.select_tool(button_class_list[0])
                })
            }
        })

        // Contextual tool control buttons (up to two per tool).
        // Each entry defines icon, toggle, and optional pressed-state check.
        // Add entries here when a tool needs a contextual control.
        type ToolCtrl = { icon: () => string; toggle: () => void; is_pressed?: () => boolean };
        settings.set(SettingName.HeartSouth, 'smooth');
        settings.set(SettingName.BezierClosed, false);
        settings.set(SettingName.BezierManualCP, false);
        settings.set(SettingName.EraserMode, 'backcolor');

        const tool_ctrl_defs: Record<string, ToolCtrl> = {
            'heart': {
                icon: () => settings.peek<string>(SettingName.HeartSouth) === 'straight' ? '♥V' : '♥∪',
                toggle: () => {
                    const straight = settings.peek<string>(SettingName.HeartSouth) !== 'straight';
                    settings.set(SettingName.HeartSouth, straight ? 'straight' : 'smooth');
                },
                is_pressed: () => settings.peek<string>(SettingName.HeartSouth) === 'straight',
            },
            'bezier': {
                icon: () => settings.peek<boolean>(SettingName.BezierManualCP) ? '⌃●' : '⌃○',
                toggle: () => settings.set(SettingName.BezierManualCP, !settings.peek<boolean>(SettingName.BezierManualCP)),
                is_pressed: () => settings.peek<boolean>(SettingName.BezierManualCP),
            },
            'eraser': {
                icon: () => settings.peek<string>(SettingName.EraserMode) === 'hole' ? '⊘' : '⬜',
                toggle: () => {
                    const next = settings.peek<string>(SettingName.EraserMode) === 'hole' ? 'backcolor' : 'hole';
                    settings.set(SettingName.EraserMode, next);
                },
                is_pressed: () => settings.peek<string>(SettingName.EraserMode) === 'hole',
            },
        };
        const tool_ctrl_btn = document.getElementById('tool-ctrl-btn') as HTMLElement;
        tool_ctrl_btn.style.display = 'none';
        tool_ctrl_btn.addEventListener('click', () => {
            const current_tool = state_registry.peek<string>(StateValue.SelectedToolName) ?? '';
            const ctrl = tool_ctrl_defs[current_tool];
            if (!ctrl) return;
            ctrl.toggle();
            tool_ctrl_btn.textContent = ctrl.icon();
            tool_ctrl_btn.classList.toggle('pressed', ctrl.is_pressed?.() ?? false);
        });

        const tool_ctrl_2_defs: Record<string, ToolCtrl> = {
            'bezier': {
                icon: () => settings.peek<boolean>(SettingName.BezierClosed) ? '⊃●' : '⊃○',
                toggle: () => settings.set(SettingName.BezierClosed, !settings.peek<boolean>(SettingName.BezierClosed)),
                is_pressed: () => settings.peek<boolean>(SettingName.BezierClosed),
            },
        };
        const tool_ctrl_btn_2 = document.getElementById('tool-ctrl-btn-2') as HTMLElement;
        tool_ctrl_btn_2.style.display = 'none';
        tool_ctrl_btn_2.addEventListener('click', () => {
            const current_tool = state_registry.peek<string>(StateValue.SelectedToolName) ?? '';
            const ctrl2 = tool_ctrl_2_defs[current_tool];
            if (!ctrl2) return;
            ctrl2.toggle();
            tool_ctrl_btn_2.textContent = ctrl2.icon();
            tool_ctrl_btn_2.classList.toggle('pressed', ctrl2.is_pressed?.() ?? false);
        });

        const select_tool_signal = state_registry.use_signal<string>(StateValue.SelectedToolName, 'scribble');
        select_tool_signal.subscribe((tool_name) => {
            const ctrl = tool_ctrl_defs[tool_name];
            tool_ctrl_btn.style.display = ctrl ? 'flex' : 'none';
            if (ctrl) {
                tool_ctrl_btn.textContent = ctrl.icon();
                tool_ctrl_btn.classList.toggle('pressed', ctrl.is_pressed?.() ?? false);
            }
            const ctrl2 = tool_ctrl_2_defs[tool_name];
            tool_ctrl_btn_2.style.display = ctrl2 ? 'flex' : 'none';
            if (ctrl2) {
                tool_ctrl_btn_2.textContent = ctrl2.icon();
                tool_ctrl_btn_2.classList.toggle('pressed', ctrl2.is_pressed?.() ?? false);
            }
            this._perform_select_tool(tool_name);
        })
        this.init_undo_redo_buttons()
        this.init_load_save()
    }
    forward_events_to_editor() {
        // canvas
        const fore = document.getElementById('fore')!!!;
        const canvas_area = document.getElementById('view-canvas')!!;
        ["pointerdown", "pointerup", "pointerout", "pointerleave", "pointermove", "click", "keydown"].forEach((ename) => {
            canvas_area.addEventListener(ename, (ev) => {
                ev.preventDefault();
                if (ename === 'pointerdown') {
                    // Commit staged palette color to history the moment a stroke begins.
                    const is_fore = !((ev as MouseEvent).button === 2);
                    this.color_stack.commit_pending(is_fore);
                }
                const method = ename as keyof Editor
                if (this.editor[method]) {
                    this.editor[method](ev);
                }
                if (ename === 'pointermove' || ename === 'pointerleave' || ename === 'pointerdown') {
                    this._redraw_anchor_canvas();
                }
            })
        }
        )
        this.view_canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // Commit the stroke even if pointerup fires outside the canvas
        document.addEventListener('pointerup', (ev) => {
            if (this.editor.tool?.drag_start) {
                this.editor.pointerup(ev as MouseEvent);
            }
        });

        // body
        document.body.addEventListener("keydown", (ev) =>
            this.editor.keydown(ev))
    }

    init_color_selector() {
        this.palette_hl_canvas.width = this.palette_hl_canvas.offsetWidth;
        this.palette_hl_canvas.height = this.palette_hl_canvas.offsetHeight;
        this.palette_sat_canvas.width = this.palette_sat_canvas.offsetWidth;
        this.palette_sat_canvas.height = this.palette_sat_canvas.offsetHeight;
        this.palette.plot()


        const palette = this.palette;
        // Tracks which canvas owns the current drag gesture; null means no drag in progress.
        let activeCanvas: 'hl' | 'sat' | null = null;
        // When false (default), colors are only pushed to the stack on pointer release.
        // When true, every drag position is pushed (old behavior).
        let trackColorOnDrag = false;

        const trackToggleBtn = document.getElementById('color-stack-live-track')!;
        trackToggleBtn.addEventListener('click', () => {
            trackColorOnDrag = !trackColorOnDrag;
            trackToggleBtn.classList.toggle('pressed', trackColorOnDrag);
        });

        const apply_hl = (event: MouseEvent, commit: boolean) => {
            palette.hl_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            const is_fore = !!(event.buttons & 1);
            if (trackColorOnDrag) {
                // Live mode: push on every interaction with distance filtering.
                this.color_stack.select_color(rgb_color, is_fore, true, false);
            } else {
                // Default mode: just set the color and stage it; push when stroke starts.
                this.color_stack.select_color(rgb_color, is_fore, false);
            }
        };
        const apply_sat = (event: MouseEvent, commit: boolean) => {
            palette.sat_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            const is_fore = !!(event.buttons & 1);
            if (trackColorOnDrag) {
                this.color_stack.select_color(rgb_color, is_fore, true, false);
            } else {
                this.color_stack.select_color(rgb_color, is_fore, false);
            }
        };

        this.palette_hl_canvas.addEventListener('pointerdown', (event: MouseEvent) => {
            activeCanvas = 'hl';
            event.preventDefault();
            apply_hl(event, false);
        });
        this.palette_hl_canvas.addEventListener('pointermove', (event: MouseEvent) => {
            if (activeCanvas !== 'hl' || event.buttons === 0) return;
            event.preventDefault();
            apply_hl(event, false);
        });
        this.palette_hl_canvas.addEventListener('pointerup', (event: MouseEvent) => {
            if (activeCanvas === 'hl') {
                event.preventDefault();
                apply_hl(event, true);
            }
            activeCanvas = null;
        });
        // Commit the last in-bounds HL position when the pointer leaves mid-drag.
        this.palette_hl_canvas.addEventListener('pointerleave', (event: MouseEvent) => {
            if (activeCanvas === 'hl' && event.buttons !== 0) {
                apply_hl(event, false);
            }
        });

        this.palette_sat_canvas.addEventListener('pointerdown', (event: MouseEvent) => {
            activeCanvas = 'sat';
            event.preventDefault();
            apply_sat(event, false);
        });
        this.palette_sat_canvas.addEventListener('pointermove', (event: MouseEvent) => {
            if (activeCanvas !== 'sat' || event.buttons === 0) return;
            event.preventDefault();
            apply_sat(event, false);
        });
        this.palette_sat_canvas.addEventListener('pointerup', (event: MouseEvent) => {
            if (activeCanvas === 'sat') {
                event.preventDefault();
                apply_sat(event, true);
            }
            activeCanvas = null;
        });
        // Commit the last in-bounds SAT position when the pointer leaves mid-drag.
        this.palette_sat_canvas.addEventListener('pointerleave', (event: MouseEvent) => {
            if (activeCanvas === 'sat' && event.buttons !== 0) {
                apply_sat(event, false);
            }
        });

        // Clear activeCanvas if the pointer is released anywhere outside both canvases.
        document.addEventListener('pointerup', () => { activeCanvas = null; });
        this.palette_hl_canvas.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
        });
        this.palette_sat_canvas.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
        });
        document.getElementById('color-selector-div-back')!!.addEventListener('click', () => {
            const tmp_back = settings.peek(SettingName.BackColor);
            settings.set(SettingName.BackColor, settings.peek(SettingName.ForeColor));
            settings.set(SettingName.ForeColor, tmp_back);
            document.getElementById('color-selector-div-fore')!.style.backgroundColor = settings.peek(SettingName.ForeColor);
            document.getElementById('color-selector-div-back')!.style.backgroundColor = settings.peek(SettingName.BackColor);
        })
        settings.get(SettingName.ForeColor).subscribe((color_string: string) => {
            document.getElementById('color-selector-div-fore')!.style.backgroundColor = color_string;
            const rgb = parse_rgba_string(color_string);
            if (rgb) this.color_stack.stage_from_signal(rgb, true);
        });
        settings.get(SettingName.BackColor).subscribe((color_string: string) => {
            document.getElementById('color-selector-div-back')!.style.backgroundColor = color_string;
            const rgb = parse_rgba_string(color_string);
            if (rgb) this.color_stack.stage_from_signal(rgb, false);
        });
    }
    clear_context(context: CanvasRenderingContext2D) {
        context.fillStyle = "rgba(255,255,255,255)"
        context.fillRect(0, 0, this.view_canvas.width, this.view_canvas.height);
        context.fill();
    }
    clear_art_canvas() {
        //this.clear_context(this.document_context)
    }
    init_view_canvas_size() {
        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                // asserting entry == view-canvas
                const view_canvas = entry.target as HTMLCanvasElement;
                view_canvas.width = entry.contentRect.width;
                view_canvas.height = entry.contentRect.height;
            })
        })
        document.querySelectorAll('#canvas-area canvas')!.forEach((e: Element) => {
            resizeObserver.observe(e);
        })

    }
    _redraw_anchor_canvas() {
        const docW = this.layer_stack.composite_canvas.width;
        const docH = this.layer_stack.composite_canvas.height;
        const c = this._anchor_canvas;
        c.width = docW;
        c.height = docH;
        const ctx = c.getContext('2d')!;
        ctx.clearRect(0, 0, docW, docH);
        const imageData = ctx.getImageData(0, 0, docW, docH);
        const snap_r = this.editor.snap_radius_doc();
        const dot_r = this.editor.snap_radius_doc() * (5 / 14); // DOT_RADIUS_SCREEN_PX / SNAP_RADIUS_SCREEN_PX
        anchor_manager.draw_onto(imageData, this.editor._last_doc_pos, snap_r, dot_r);
        ctx.putImageData(imageData, 0, 0);
        this.anchor_canvas_signal.value = anchor_manager.anchors.length > 0 ? c : undefined as any;
    }

    init_anchor_button() {
        const btn = document.getElementById('anchor-btn')!;
        btn.addEventListener('click', () => {
            this.editor.anchor_edit_mode = !this.editor.anchor_edit_mode;
            btn.classList.toggle('pressed', this.editor.anchor_edit_mode);
            if (!this.editor.anchor_edit_mode) {
                this.editor.tool.pointer_leave();
            }
        });
    }

    init_scroll() {
        this.view_canvas.addEventListener('wheel', (event) => {
            event.preventDefault();

            const ctrl_key = event.ctrlKey;
            const deltaX = event.deltaX;
            const deltaY = event.deltaY;

            const vp = this.view_port_signal.value;
            const doc_w = this.document_canvas.width;
            const doc_h = this.document_canvas.height;
            const clamp_pos = (x: number, y: number, w: number, h: number) => ({
                x: Math.max(0, Math.min(x, Math.max(0, doc_w - w))),
                y: Math.max(0, Math.min(y, Math.max(0, doc_h - h))),
                w,
                h,
            });
            if (ctrl_key) {
                const aspect = vp.w / vp.h;
                const ratio_h = Math.exp(deltaY / 1000);
                const new_h = Math.max(1, Math.min(vp.h * ratio_h, doc_h));
                const new_w = new_h * aspect;
                const delta_h = vp.h * (ratio_h - 1);
                const raw_x = vp.x - event.offsetX * delta_h * aspect / this.view_canvas.clientWidth;
                const raw_y = vp.y - event.offsetY * delta_h / this.view_canvas.clientHeight;
                this.view_port_signal.value = clamp_pos(raw_x, raw_y, new_w, new_h);
            } else {
                const raw_x = vp.x + deltaX / this.view_canvas.clientWidth * vp.w;
                const raw_y = vp.y + deltaY / this.view_canvas.clientHeight * vp.h;
                this.view_port_signal.value = clamp_pos(raw_x, raw_y, vp.w, vp.h);
            }
        }, { passive: false });
    }
    init() {
        // clear
        // this.staging_context.fillStyle = "rgba(255,255,255,0)"
        // this.staging_context.fillRect(0, 0, this.staging_canvas.width, this.staging_canvas.height)
        // forward pointer
        // bind pointer

        this.init_color_selector();
        this.init_buttons();
        this.init_anchor_button();
        this.forward_events_to_editor();
        //this.select_tool('circle');
        //this.init_view_canvas_size();
        this.init_scroll();
    }
}
function test_signals() {
    const s1: Signal<number> = signal(1);
    s1.subscribe((v) => {
        console.log('value:', v)
    })
    // effect(() => {
    //     console.log('E', s1.value)
    // })
    // console.log('A')
    // s1.value = 1;
    // console.log('B')
    // s1.value = 2;
    // console.log('C')
    // s1.value = 3;
    // console.log('D')
}
export function app_ignite() {
    (window as any).app = new MainApp();
    (window as any).app.init();
}

window.addEventListener('load', app_ignite);



