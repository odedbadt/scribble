import { Editor } from "./editor"
import { Palette } from './palette'
import { ColorStack } from "./color_stack";
import { Rect, RectToRectMapping } from "./types";
//import { GoogleDrive } from "./gdrive"
import { Signal, signal, computed, effect } from "@preact/signals";
import { ScribRenderer } from "./scrib_renderer";

function click_for_a_second(id: string, callback: Function) {
    const elem = document.getElementById(id);
    if (elem) {
        elem.addEventListener('πlick', () => {
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
    private scrib_renderer: ScribRenderer
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;

    view_canvas: HTMLCanvasElement;
    editor: Editor;
    // google_drive?: GoogleDrive;
    palette: Palette;
    tool_canvas_signal: any;
    tool_bounds_signal: any;
    settings: { fore_color: string; back_color: string; line_width: number; filled: boolean; };
    view_port_signal: Signal<Rect>;

    constructor() {
        this.document_canvas = document.getElementById('document-canvas')! as HTMLCanvasElement;
        this.document_context = this.document_canvas.getContext('2d', { willReadFrequently: true, texImage3d: false }) as CanvasRenderingContext2D;
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;
        this.palette = new Palette(
            document.getElementById('hl-selector-canvas')! as HTMLCanvasElement,
            document.getElementById('sat-selector-canvas')! as HTMLCanvasElement, [1, 0.5, 0.5]);

        this.tool_canvas_signal = signal<HTMLCanvasElement>()
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
            this.tool_canvas_signal,
            this.tool_bounds_signal,
            this.view_port_signal);
        this.scrib_renderer = new ScribRenderer(this.tool_canvas_signal,
            this.tool_bounds_signal);

        this.editor.init_
        this.settings = {
            fore_color: 'rgba(255,0,0,255)',
            back_color: 'rgba(255,255,255,255)',
            line_width: 10,
            filled: true,
        }
        this.init_canvases();
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
        const w = this.document_canvas.width;
        const h = this.document_canvas.height;
        this.document_context.clearRect(0, 0, w, h);



    }



    select_tool(tool_name: string) {

        const button = document.getElementsByClassName(tool_name)[0];
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(other_button => {
            other_button.classList.remove('pressed')
        });
        button.classList.add('pressed')
        this.editor.select_tool(tool_name)
    }
    // load_image(url: string) {
    //     const img = new Image();

    //     img.addEventListener('load', () => {
    //         // Clear canvas and draw the image
    //         this.document_canvas.width = img.naturalWidth;
    //         this.document_canvas.height = img.naturalHeight;
    //         // a = w / h
    //         const view_canvas_aspect = this.view_canvas.clientWidth / this.view_canvas.clientHeight;
    //         const view_port_w = Math.min(img.naturalWidth, img.naturalHeight * view_canvas_aspect) / 2
    //         this.view_port_signal.value = {
    //             'x': 0, 'y': 0, 'w': view_port_w,
    //             'h': view_port_w / view_canvas_aspect
    //         };

    //         this.document_context.drawImage(img, 0, 0, this.document_canvas.width, this.document_canvas.height);
    //     });
    //     img.src = url;
    // }
    // init_load_save() {
    //     click_for_a_second('save_button', () => {
    //         // Generate a PNG from the canvas
    //         this.document_canvas.toBlob((blob) => {
    //             if (!blob) {
    //                 alert('invalid choice, not saving')
    //                 return
    //             }

    //             const link = document.createElement('a');
    //             link.href = URL.createObjectURL(blob);
    //             link.download = 'image.png';  // Set the file name for download
    //             link.click();
    //         }, 'image/png');
    //     });
    //     const file_input = document.getElementById('file_input')! as HTMLInputElement
    //     file_input.addEventListener('change', (event: Event) => {
    //         const input = event.target as HTMLInputElement;

    //         if (input
    //             && input.files
    //             && input.files.length > 0
    //             && input.files[0]
    //             && input.files[0].type === 'image/png') {
    //             const file = input.files[0];
    //             const reader = new FileReader();

    //             reader.onload = (e) => {
    //                 if (e.target) {
    //                     this.load_image(e.target.result as string)
    //                 }
    //             };
    //             reader.readAsDataURL(file);
    //         } else {
    //             alert("Please select a valid PNG file.");
    //         }
    //         file_input.value = '';
    //     });
    //     document.getElementById('load_button')!.addEventListener('click', () => {
    //         file_input.click()
    //     });
    //     // document.getElementById('gdrive_button')!.addEventListener('click', () => {
    //     //     this.google_drive.open_picker(this.load_image.bind(this));//(s:string) => {console.log(s)});
    //     // });
    // }
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

        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(button => {
            const button_class_list = button.classList;
            if (button_class_list[0] != 'button') {
                button.addEventListener('click', event => {
                    this.select_tool(button_class_list[0])
                })
            }
        })
        this.init_undo_redo_buttons()
        //this.init_load_save()
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

    // init_color_selector() {
    //     let img = new Image();
    //     img.src = "/palette.png";
    //     this.palette_hl_canvas.width = this.palette_hl_canvas.offsetWidth;
    //     this.palette_hl_canvas.height = this.palette_hl_canvas.offsetHeight;
    //     this.palette_sat_canvas.width = this.palette_sat_canvas.offsetWidth;
    //     this.palette_sat_canvas.height = this.palette_sat_canvas.offsetHeight;
    //     this.palette.plot()


    //     const palette = this.palette;
    //     const hl_callback = (event: MouseEvent) => {
    //         if (event.buttons == 0) {
    //             return
    //         }
    //         event.preventDefault()
    //         palette.hl_click(event.offsetX, event.offsetY);
    //         const rgb_color = palette.get_rgb_color();
    //         this.color_stack.select_color(rgb_color, !!(event.buttons & 1), true);
    //     }
    //     this.palette_hl_canvas.addEventListener('pointermove', hl_callback)
    //     this.palette_hl_canvas.addEventListener('pointerup', hl_callback)
    //     this.palette_hl_canvas.addEventListener('pointerdown', hl_callback)
    //     this.palette_hl_canvas.addEventListener('click', hl_callback)
    //     const sat_callback = (event: MouseEvent) => {
    //         if (event.buttons == 0) {
    //             return
    //         }
    //         event.preventDefault()
    //         palette.sat_click(event.offsetX, event.offsetY);
    //         const rgb_color = palette.get_rgb_color();
    //         this.color_stack.select_color(rgb_color, !!(event.buttons & 1), true);
    //     }
    //     this.palette_sat_canvas.addEventListener('pointermove', sat_callback)
    //     this.palette_sat_canvas.addEventListener('pointerdown', sat_callback)
    //     this.palette_sat_canvas.addEventListener('pointerup', sat_callback)
    //     this.palette_sat_canvas.addEventListener('click', sat_callback)

    //     this.palette_sat_canvas.onpointermove = sat_callback
    //     this.palette_sat_canvas.onpointerup = sat_callback
    //     this.palette_hl_canvas.addEventListener('contextmenu', (event: MouseEvent) => {
    //         event.preventDefault();
    //     });
    //     this.palette_sat_canvas.addEventListener('contextmenu', (event: MouseEvent) => {
    //         event.preventDefault();
    //     });
    //     document.getElementById('color-selector-div-back')!!.addEventListener('click', () => {
    //         const tmp_back = this.settings.back_color;
    //         this.settings.back_color = this.settings.fore_color;
    //         this.settings.fore_color = tmp_back;
    //         document.getElementById('color-selector-div-fore')!.style.backgroundColor = this.settings.fore_color
    //         document.getElementById('color-selector-div-back')!.style.backgroundColor = this.settings.back_color
    //     })
    // }
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
    init_scroll() {
        this.view_canvas.addEventListener('wheel', (event) => {
            event.preventDefault()
            // Get the modifiers pressed
            const ctrl_key = event.ctrlKey;

            // Access scroll properties
            const deltaX = event.deltaX; // Horizontal scroll
            const deltaY = event.deltaY; // Vertical scroll


            // Perform actions based on modifiers and scroll direction
            if (ctrl_key) {
                // Zoom:;
                // view_port.h, w changes
                // cursor in before and in after change has to be contant
                const art_x_before_zoom = this.view_port_signal.value.x + event.offsetX /
                    this.view_canvas.clientWidth * this.view_port_signal.value.w;
                /* equations:
                // view_port_x_before + cursor_x*view_port_w_before / view_canvas_w = 
                // view_port_x_after + cursor_x*view_port_w_after  / view_canvas_w
                // view_port_y_before + cursor_x*view_port_h_before / view_canvas_h = 
                // view_port_y_after + cursor_x*view_port_h_after  / view_canvas_h
                // thus:
                // view_port_y_after = view_port_y_before + cursor_y*(view_port_h_before-view_port_h_after) / view_canvas_h
                // view_port_x_after = view_port_x_before + cursor_x*(view_port_w_before-view_port_w_after) / view_canvas_w
                // view_port_y_after = view_port_y_before + cursor_y*deltaY/ view_canvas_h
                // view_port_x_after = view_port_y_after*aspect;
                */

                const aspect = this.view_port_signal.value.w / this.view_port_signal.value.h;
                const ratio_h = Math.exp(deltaY / 1000);
                const delta_h = this.view_port_signal.value.h * (ratio_h - 1)
                this.view_port_signal.value.y = this.view_port_signal.value.y - event.offsetY * delta_h / this.view_canvas.clientHeight;
                this.view_port_signal.value.x = this.view_port_signal.value.x - event.offsetX * delta_h * aspect / this.view_canvas.clientWidth;
                this.view_port_signal.value.h = Math.max(1, this.view_port_signal.value.h * ratio_h)
                this.view_port_signal.value.w = this.view_port_signal.value.h * aspect;
            } else {
                this.view_port_signal.value.y = Math.max(0, this.view_port_signal.value.y + deltaY / this.view_canvas.clientHeight * 100)
                this.view_port_signal.value.x = Math.max(0, this.view_port_signal.value.x + deltaX / this.view_canvas.clientWidth * 100)
            }
        });
    }
    init() {
        // clear
        // this.staging_context.fillStyle = "rgba(255,255,255,0)"
        // this.staging_context.fillRect(0, 0, this.staging_canvas.width, this.staging_canvas.height)
        // forward pointer
        // bind pointer

        //this.init_color_selector();
        this.init_buttons();
        this.forward_events_to_editor();
        this.select_tool('scribble');
        //this.init_view_canvas_size();
        this.init_scroll();
    }
}
function test_signals() {
    const s1: Signal<number> = signal(1);
    effect(() => {
        console.log('E', s1.value)
    })
    console.log('A')
    s1.value = 1;
    console.log('B')
    s1.value = 2;
    console.log('C')
    s1.value = 3;
    console.log('D')
}
export function app_ignite() {
    (window as any).app = new MainApp();
    (window as any).app.init();
}

window.addEventListener('load', app_ignite);

