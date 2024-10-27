import { Editor } from "./editor"
import { override_canvas_context } from "./utils"
import { Palette} from './palette'
function click_for_a_second(id:string, callback:Function) {
    const elem = document.getElementById(id);
    if (elem) {
        elem.addEventListener('click', () =>{
            elem.classList.add('pressed')
            callback()
            window.setTimeout(() => {
            elem.classList.remove('pressed')
            },120)

        })
    }
}
export class MainApp {
    art_canvas: HTMLCanvasElement;
    art_context: any;
    view_canvas: HTMLCanvasElement;
    view_context: any;
    staging_canvas: HTMLCanvasElement;
    staging_context: CanvasRenderingContext2D;
    tool_canvas: HTMLCanvasElement;
    tool_context: CanvasRenderingContext2D;
    tool_tmp_canvas: HTMLCanvasElement;
    tool_tmp_context: CanvasRenderingContext2D;
    editor: Editor;
    settings: {
        filled: boolean; fore_color: string; back_color: string; line_width: number; 
};
    color_stack: any;
    palette: Palette;
    palette_hl_canvas: HTMLCanvasElement;
    palette_sat_canvas: HTMLCanvasElement;
    constructor() {
        this.art_canvas = document.getElementById('art-canvas')! as HTMLCanvasElement;
        this.art_context = this.art_canvas.getContext('2d', {willReadFrequently:true}) as CanvasRenderingContext2D;

        this.view_canvas = document.getElementById('view-canvas')!  as HTMLCanvasElement;
        this.view_context = this.view_canvas.getContext('2d', {willReadFrequently:true})  as CanvasRenderingContext2D;
        this.staging_canvas = document.getElementById('staging-canvas')!  as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d',{willReadFrequently:true})! as CanvasRenderingContext2D;
        this.tool_canvas = document.getElementById('tool-canvas')!  as HTMLCanvasElement;
        this.tool_context = this.tool_canvas.getContext('2d', {willReadFrequently:true})! as CanvasRenderingContext2D;
        this.tool_tmp_canvas = document.getElementById('tool-tmp-canvas')!  as HTMLCanvasElement;
        this.tool_tmp_context = this.tool_tmp_canvas.getContext('2d', {willReadFrequently:true})! as CanvasRenderingContext2D;
        this.palette_hl_canvas = document.getElementById('hl-selector-canvas')!  as HTMLCanvasElement
        this.palette_sat_canvas = document.getElementById('sat-selector-canvas')!  as HTMLCanvasElement
        this.palette = new Palette(this.palette_hl_canvas, this.palette_sat_canvas, [1,0.5,0.5])
        this.editor = new Editor(this);
        this.settings = {
            fore_color: 'rgba(0,0,0,255)',
            back_color: 'rgba(255,255,255,255)',
            line_width: 10,
            filled: true,

        }
        this.art_context.imageSmoothingEnabled = false;
        this.art_context.globalCompositeOperation = 'source-over';
        this.staging_context.imageSmoothingEnabled = false;
        this.staging_context.globalCompositeOperation = 'source-over';
        this.tool_context.globalCompositeOperation = 'source-over';
        this.tool_context.imageSmoothingEnabled = false;
        this.color_stack = new Array<string>(8);
    }
    select_tool(tool_name:string) {
        const _this = this;
        const button = document.getElementsByClassName(tool_name)[0];
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(other_button => {
            other_button.classList.remove('pressed')
        });
        button.classList.add('pressed')
        _this.editor.select_tool(tool_name)
    }
    init_load_save() {
        const art_canvas = this.art_canvas;
        const art_context = this.art_context
        const view_context = this.view_context
        const staging_context = this.staging_context
        click_for_a_second('save_button',() => {
            // Generate a PNG from the canvas
            art_canvas.toBlob(function(blob) {
                if (!blob)  {
                    alert('invalid choice, not saving')
                    return
                }

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'image.png';  // Set the file name for download
                link.click();
            }, 'image/png');
        });
        const file_input = document.getElementById('file_input')! as HTMLInputElement
        file_input.addEventListener('change', (event:Event) =>{
            const input = event.target as HTMLInputElement;

            if (input
                && input.files
                && input.files.length > 0
                && input.files[0]
                && input.files[0].type === 'image/png') {
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (e.target) {
                        const img = new Image();
                        img.onload = function() {
                            // Clear canvas and draw the image
                            art_context.clearRect(0, 0, art_canvas.width, art_canvas.height);
                            art_context.drawImage(img, 0, 0, art_canvas.width, art_canvas.height);
                            override_canvas_context(view_context, art_canvas)
                            override_canvas_context(staging_context, art_canvas)
                        };
                        img.src = e.target.result as string;
                    }
                };
                reader.readAsDataURL(file);
            } else {
                alert("Please select a valid PNG file.");
            }
            file_input.value = '';
        });
        document.getElementById('load_button')!.addEventListener('click',() => {
            file_input.click()
        });
    }
    init_undo_redo_buttons() {
        const _this = this;
        click_for_a_second('undo_button',() => {
                _this.editor.undo()
            }
        )
        click_for_a_second('redo_button',() => {
            _this.editor.redo()
        }
    )
    }
    init_buttons() {
        const _this = this;
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(button => {
            const button_class_list = button.classList;
            if (button_class_list[0] != 'button') {
                button.addEventListener('click', event => {
                    _this.select_tool(button_class_list[0])
                })
            }
        })
        this.init_undo_redo_buttons()
        this.init_load_save()
    }
    forward_events_to_editor() {
        // canvas
        const fore = document.getElementById('fore')!!!;
        const canvas_area = document.getElementById('view-canvas')!!;
        ["pointerdown", "pointerup","pointerout", "pointerleave", "pointermove", "click", "keydown"].forEach((ename) =>
        {
            canvas_area.addEventListener(ename, (ev) => {
                ev.preventDefault()
                if (this.editor[ename as keyof Editor]) {
                    (this.editor[ename as keyof Editor]  as Function)(ev);
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
    select_color(color:string, is_fore:boolean, update_stack:boolean) {
        if (is_fore) {
        this.settings.fore_color = color;
        } else {
            this.settings.back_color = color;
        }
        document.getElementById(is_fore ?
            'color-selector-div-fore' :
            'color-selector-div-back')!.style.backgroundColor = color;
        if (update_stack) {
            if (this.color_stack.indexOf(color) == -1) {
                this.color_stack.push(color);
                this.refresh_color_stack()
            }

        }
 
    }
    refresh_color_stack() {
        const slots = document.getElementsByClassName('color_stack_item')
        const l = this.color_stack.length;
        const _this = this;
        for (let j = 0; j < slots.length; ++j) {
            const slot:HTMLElement = slots[j]! as HTMLElement
            if (j < l) {
                const color = this.color_stack.at(l-1-j)
                slot.style.backgroundColor = color;
                slot.addEventListener('click', (event) => {
                    _this.select_color(color, event.button ==  0, false)
                })
            }
        }
    }
    color_chosen(color:number[], is_fore:boolean) {
        const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        this.color_stack.push(sampled_color);
        if (this.color_stack.length > 8) {
            this.color_stack.shift();
        }
        this.refresh_color_stack()
        if (is_fore) {
            this.settings.fore_color = sampled_color;
            this.view_context.strokeStyle=sampled_color;
            document.getElementById('color-selector-div-fore')!.style.backgroundColor = sampled_color
        } else  {
            this.settings.back_color = sampled_color;
            document.getElementById('color-selector-div-back')!.style.backgroundColor = sampled_color
        }

    }
    init_color_selector() {
        let img = new Image();
        img.src = "/static/palette.png";
        this.palette_hl_canvas.width = this.palette_hl_canvas.offsetWidth;
        this.palette_hl_canvas.height = this.palette_hl_canvas.offsetHeight;
        this.palette_sat_canvas.width = this.palette_sat_canvas.offsetWidth;
        this.palette_sat_canvas.height = this.palette_sat_canvas.offsetHeight;
        this.palette.plot()
 
        const _this = this;
        const palette = this.palette;
        const hl_callback = (event:MouseEvent) => {
            if (event.buttons == 0) {
                return
            }
            event.preventDefault()
            palette.hl_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            _this.color_chosen(rgb_color, event.button == 0);
        }
        this.palette_hl_canvas.onpointermove = hl_callback
        this.palette_hl_canvas.onpointermove = hl_callback
        const sat_callback = (event:MouseEvent) => {
            if (event.buttons == 0) {
                return
            }
            event.preventDefault()
            palette.sat_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            _this.color_chosen(rgb_color, event.button == 0);
        }

        this.palette_sat_canvas.onpointermove = sat_callback
        this.palette_sat_canvas.onpointerdown = sat_callback
        this.palette_hl_canvas.addEventListener('contextmenu', (event:MouseEvent) => {
            event.preventDefault();
        });
        this.palette_sat_canvas.addEventListener('contextmenu', (event:MouseEvent) => {
            event.preventDefault();
        });
        document.getElementById('colorswap')!!.addEventListener('click', () => {
            const tmp_back = _this.settings.back_color;
            _this.settings.back_color = _this.settings.fore_color;
            _this.settings.fore_color = tmp_back;
            document.getElementById('color-selector-div-fore')!.style.backgroundColor = _this.settings.fore_color
            document.getElementById('color-selector-div-back')!.style.backgroundColor = _this.settings.back_color
        })
    }
    clear_context(context:CanvasRenderingContext2D) {
        context.fillStyle = "rgba(255,255,255,255)"
        context.fillRect(0,0,this.view_canvas.width,this.view_canvas.height);
        context.fill();
    }
    clear_art_canvas() {
        this.clear_context(this.art_context)
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
        resizeObserver.observe(document.getElementById('canvas-area')!);

    }
    init() {
        // clear
        this.view_context.fillStyle = "rgba(255,255,255,0)"
        this.view_context.fillRect(0,0,this.view_canvas.width,this.view_canvas.height);
        this.staging_context.fillStyle = "rgba(255,255,255,0)"
        this.staging_context.fillRect(0,0,this.staging_canvas.width,this.staging_canvas.height)
        this.clear_art_canvas();
        // forward pointer
        // bind pointer
        const _this = this;
        this.init_color_selector();
        this.init_buttons();    
        this.forward_events_to_editor();
        this.select_tool('scribble');
        this.init_view_canvas_size();
    }
}
export function app_ignite() {
    (window as any).app = new MainApp();
    (window as any).app.init();
}


window.addEventListener('load', () => {app_ignite()});