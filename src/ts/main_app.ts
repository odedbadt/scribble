import { Editor } from "./editor"
import { Palette } from './palette'
import { ColorStack } from "./color_stack";
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
export class MainApp {
    public overlay_canvas_signal = signal<CanvasRenderingContext2D>();
    private scrib_renderer: ScribRenderer;
    private anchor_canvas_signal = signal<HTMLCanvasElement>(null as any);
    private _anchor_canvas: HTMLCanvasElement = document.createElement('canvas');
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;

    view_canvas: HTMLCanvasElement;
    editor: Editor;
    // google_drive?: GoogleDrive;
    color_stack: ColorStack;
    palette: Palette;
    palette_hl_canvas: HTMLCanvasElement;
    palette_sat_canvas: HTMLCanvasElement;
    tool_canvas_signal: any;
    tool_bounds_signal: any;
    document_dirty_signal: Signal<number>;
    view_port_signal: Signal<Rect>;

    constructor() {
        this.document_canvas = document.getElementById('document-canvas')! as HTMLCanvasElement;
        this.document_context = this.document_canvas.getContext('2d', { willReadFrequently: true, texImage3d: false }) as CanvasRenderingContext2D;
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;
        this.palette = new Palette(
            document.getElementById('hl-selector-canvas')! as HTMLCanvasElement,
            document.getElementById('sat-selector-canvas')! as HTMLCanvasElement, [1, 0.5, 0.5]);
        this.palette_hl_canvas = document.getElementById('hl-selector-canvas')! as HTMLCanvasElement
        this.palette_sat_canvas = document.getElementById('sat-selector-canvas')! as HTMLCanvasElement
        this.color_stack = new ColorStack(this, 8, 100, 10000,
            document.getElementById('color-selector-div-fore')!,
            document.getElementById('color-selector-div-back')!,
            document.getElementsByClassName('color_stack_item')
        )
        this.tool_canvas_signal = signal<HTMLCanvasElement>()
        this.document_dirty_signal = signal<number>(0)
        this.tool_bounds_signal = signal<RectToRectMapping>(
            {
                from: { x: 0, y: 0, w: 200, h: 200 },
                to: { x: 0, y: 0, w: 200, h: 200 }
            }
        )
        this.view_port_signal = signal<Rect>({
            x: 0, y: 0, w:
                this.document_canvas.width, h: this.document_canvas.height
        })
        this.editor = new Editor(this.document_canvas,
            this.view_canvas,
            this.tool_canvas_signal,
            this.tool_bounds_signal,
            this.view_port_signal,
            this.document_dirty_signal);
        this.scrib_renderer = new ScribRenderer(this.tool_canvas_signal,
            this.tool_bounds_signal,
            this.document_dirty_signal,
            this.view_port_signal,
            this.anchor_canvas_signal);

        // Re-render anchor overlay whenever anchors change
        anchor_manager.dirty.subscribe(() => this._redraw_anchor_canvas());

        this.editor.init_
        settings.bulkSet({
            fore_color: 'rgba(255,0,0,255)',
            back_color: 'rgba(255,255,255,255)',
            line_width: 10,
            filled: true,
        });
        this.init_canvases();
        this.editor.push_undo_snapshot(); // save initial blank state
        this.scrib_renderer.init();
    }

    // this.color_  ck = new ColorStack(this, 8, 100, 10000,
    // document.getElementById('color-selector-div-fore')!,
    // document.getElementById('color-selector-div-back')!,
    // document.getElementsByClassName('color_stack_item')


    //this.google_drive = new GoogleDrive(document.location.hash)
    // this.init_canvases()
    //         this.init_canvases();
    // this.scrib_renderer.init_render_loop();

    //     }
    init_canvases() {
        const w = this.view_canvas.clientWidth;
        const h = this.view_canvas.clientHeight;
        this.view_canvas.width = w;
        this.view_canvas.height = h;
        this.document_canvas.width = w;
        this.document_canvas.height = h;
        this.view_port_signal.value = { x: 0, y: 0, w, h };
        this.document_context.clearRect(0, 0, w, h);



    }


    _perform_select_tool(tool_name: string) {
        const button = document.getElementsByClassName(tool_name)[0];
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(other_button => {
            // Mandala is a mode toggle — don't clear it when switching tools
            if (!other_button.classList.contains('mandala')) {
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
            this.document_canvas.width = img.naturalWidth;
            this.document_canvas.height = img.naturalHeight;
            this.document_context.drawImage(img, 0, 0);
            // Keep current viewport size (zoom level); reset pan to origin
            const vp = this.view_port_signal.value;
            this.view_port_signal.value = { x: 0, y: 0, w: vp.w, h: vp.h };
            this.document_dirty_signal.value++;
            this.editor.push_undo_snapshot();
        });
        img.src = url;
    }
    init_load_save() {
        document.getElementById('save_button')!.addEventListener('click', async () => {
            // Read pixels via getImageData to avoid Chrome GPU-transfer issue
            // (document_canvas is used as a WebGL texture, which can cause toBlob to return empty)
            const w = this.document_canvas.width;
            const h = this.document_canvas.height;
            const imageData = this.document_context.getImageData(0, 0, w, h);
            const offscreen = document.createElement('canvas');
            offscreen.width = w;
            offscreen.height = h;
            const ctx = offscreen.getContext('2d')!;
            ctx.putImageData(imageData, 0, 0);
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

        // Mandala button: toggle mode, independent of tool selection
        const mandala_button = document.getElementsByClassName('mandala')[0] as HTMLElement;
        const mandala_panel = document.getElementById('mandala-panel')!;
        const mandala_n_val = document.getElementById('mandala-n-val')!;
        const mandala_mirror_btn = document.getElementById('mandala-mirror')!;

        const rect_button = document.getElementsByClassName('rect')[0] as HTMLElement;
        mandala_button.addEventListener('click', () => {
            mandala_mode.enabled = !mandala_mode.enabled;
            if (!mandala_mode.enabled) {
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
        const select_tool_signal = state_registry.use_signal<string>(StateValue.SelectedToolName, 'scribble');
        select_tool_signal.subscribe((tool_name) => {
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
                const method = ename as keyof Editor
                if (this.editor[method]) {
                    this.editor[method](ev);
                }
                if (ename === 'pointermove' || ename === 'pointerleave') {
                    this._redraw_anchor_canvas();
                }
            })
        }
        )
        this.view_canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
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
        const hl_callback = (event: MouseEvent) => {
            if (event.buttons == 0) {
                return
            }
            event.preventDefault()
            palette.hl_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            this.color_stack.select_color(rgb_color, !!(event.buttons & 1), true);
        }
        this.palette_hl_canvas.addEventListener('pointermove', hl_callback)
        this.palette_hl_canvas.addEventListener('pointerup', hl_callback)
        this.palette_hl_canvas.addEventListener('pointerdown', hl_callback)
        this.palette_hl_canvas.addEventListener('click', hl_callback)
        const sat_callback = (event: MouseEvent) => {
            if (event.buttons == 0) {
                return
            }
            event.preventDefault()
            palette.sat_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            this.color_stack.select_color(rgb_color, !!(event.buttons & 1), true);
        }
        this.palette_sat_canvas.addEventListener('pointermove', sat_callback)
        this.palette_sat_canvas.addEventListener('pointerdown', sat_callback)
        this.palette_sat_canvas.addEventListener('pointerup', sat_callback)
        this.palette_sat_canvas.addEventListener('click', sat_callback)

        this.palette_sat_canvas.onpointermove = sat_callback
        this.palette_sat_canvas.onpointerup = sat_callback
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

        });
        settings.get(SettingName.BackColor).subscribe((color_string: string) => {
            document.getElementById('color-selector-div-back')!.style.backgroundColor = color_string;
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
        const docW = this.document_canvas.width;
        const docH = this.document_canvas.height;
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
        let dragging = false;

        btn.addEventListener('pointerdown', (e: PointerEvent) => {
            e.preventDefault();
            dragging = true;
            btn.setPointerCapture(e.pointerId);
        });

        btn.addEventListener('pointerup', (e: PointerEvent) => {
            if (!dragging) return;
            dragging = false;
            const canvas_area = document.getElementById('canvas-area')!;
            const rect = canvas_area.getBoundingClientRect();
            const view_x = e.clientX - rect.left;
            const view_y = e.clientY - rect.top;
            if (view_x >= 0 && view_y >= 0 && view_x <= rect.width && view_y <= rect.height) {
                const doc_pt = this.editor.view_coords_to_doc_coords({ x: view_x, y: view_y });
                anchor_manager.add(doc_pt);
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



