import { EditingToolApplier } from "./editing_tool_applier.js"
import { override_canvas_context } from "./utils.js"
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
    editor: EditingToolApplier;
    color_selector_element: HTMLCanvasElement;
    color_selector_context: CanvasRenderingContext2D;
    settings: { fore_color: string; back_color: string; line_width: number; };
    palette_canvas: HTMLCanvasElement;
    constructor() {
        this.art_canvas = document.getElementById('art-canvas')! as HTMLCanvasElement;
        this.art_context = this.art_canvas.getContext('2d', {willReadFrequently:true}) as CanvasRenderingContext2D;
        this.view_canvas = document.getElementById('view-canvas')!  as HTMLCanvasElement;
        this.view_context = this.view_canvas.getContext('2d', {willReadFrequently:true})  as CanvasRenderingContext2D;
        this.staging_canvas = document.getElementById('staging-canvas')!  as HTMLCanvasElement;
        this.staging_context = this.staging_canvas.getContext('2d',{willReadFrequently:true})! as CanvasRenderingContext2D;
        this.tool_canvas = document.getElementById('tool-canvas')!  as HTMLCanvasElement;
        this.tool_context = this.tool_canvas.getContext('2d')! as CanvasRenderingContext2D;
        this.tool_tmp_canvas = document.getElementById('tool-tmp-canvas')!  as HTMLCanvasElement;
        this.tool_tmp_context = this.tool_tmp_canvas.getContext('2d')! as CanvasRenderingContext2D;
        this.palette_canvas = document.getElementById('color-selector-canvas')!  as HTMLCanvasElement
        this.color_selector_element = this.palette_canvas;
        this.color_selector_context = this.color_selector_element.getContext('2d', {willReadFrequently:true})! as CanvasRenderingContext2D;
        this.editor = new EditingToolApplier(this);
        this.settings = {
            fore_color: 'rgba(0,0,0,255)',
            back_color: 'rgba(255,255,255,255)',
            line_width: 10
        }
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
                if (this.editor[ename as keyof EditingToolApplier]) {
                    (this.editor[ename as keyof EditingToolApplier]  as Function)(ev);
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
        this.color_selector_context = this.palette_canvas.getContext('2d',{willReadFrequently:true})!;
        let img = new Image();
        img.src = "/static/palette.png";
        img.onload = () => {
            this.color_selector_context.drawImage(img, 0, 0, 60, 160);
        }
        const _this = this

        this.palette_canvas.onpointerdown = (event:MouseEvent) => {
            event.preventDefault()
            const color = this.color_selector_context.getImageData(event.offsetX, event.offsetY, 1, 1).data;
            const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
            if (event.button == 0) {
                _this.settings.fore_color = sampled_color;
                _this.view_context.strokeStyle=sampled_color;
                document.getElementById('color-selector-div-fore')!.style.backgroundColor = sampled_color
            } else if (event.button == 2) {
                _this.settings.back_color = sampled_color;
                document.getElementById('color-selector-div-back')!.style.backgroundColor = sampled_color
            }
        }
        this.palette_canvas.addEventListener('contextmenu', (event:MouseEvent) => {
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
        this.select_tool('scribble')
    }
}
export function app_ignite() {
    (window as any).app = new MainApp();
    (window as any).app.init();
}


window.addEventListener('load', () => {app_ignite()});