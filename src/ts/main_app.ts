import { Editor } from "./editor"
import { Palette } from './palette'
import { ColorStack } from "./color_stack";
import { Rect } from "./types";
import { GoogleDrive } from "./gdrive"
import { WebGLRenderer, Scene, Camera, OrthographicCamera, ShaderMaterial, Mesh, PlaneGeometry, Texture, CanvasTexture } from "three"
import { FRAGMENT_SHADER_CODE, VERTEX_SHADER_CODE } from "./glsl_shader_code"
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
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;
    document_texture: Texture
    view_canvas: HTMLCanvasElement;
    view_context: any;
    // staging_canvas: HTMLCanvasElement;
    // staging_context: CanvasRenderingContext2D;
    // tool_canvas: HTMLCanvasElement;
    // tool_context: CanvasRenderingContext2D;
    // tool_tmp_canvas: HTMLCanvasElement;
    // tool_tmp_context: CanvasRenderingContext2D;
    editor: Editor;
    google_drive?: GoogleDrive;
    settings: {
        filled: boolean;
        fore_color: string;
        back_color: string;
        line_width: number;
    };
    state: {
        view_port: Rect;
        overlay_position: Rect;
    }
    color_stack: ColorStack;
    palette: Palette;
    palette_hl_canvas: HTMLCanvasElement;
    palette_sat_canvas: HTMLCanvasElement;
    renderer?: WebGLRenderer;
    scene?: Scene;
    camera?: OrthographicCamera;
    overlay_texture: Texture;
    document_material?: ShaderMaterial;
    constructor() {
        this.document_canvas = document.getElementById('art-canvas')! as HTMLCanvasElement;
        this.document_context = this.document_canvas.getContext('2d', { willReadFrequently: true, texImage3d:false }) as CanvasRenderingContext2D;
        this.document_texture = new Texture(this.document_canvas);
        this.overlay_texture = new Texture();
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;
        // this.staging_canvas = document.getElementById('staging-canvas')! as HTMLCanvasElement;
        // this.staging_context = this.staging_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D;
        // this.tool_canvas = document.getElementById('tool-canvas')! as HTMLCanvasElement;
        // this.tool_context = this.tool_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D;
        // this.tool_tmp_canvas = document.getElementById('tool-tmp-canvas')! as HTMLCanvasElement;
        // this.tool_tmp_context = this.tool_tmp_canvas.getContext('2d', { willReadFrequently: true })! as CanvasRenderingContext2D;
        this.palette_hl_canvas = document.getElementById('hl-selector-canvas')! as HTMLCanvasElement
        this.palette_sat_canvas = document.getElementById('sat-selector-canvas')! as HTMLCanvasElement
        this.palette = new Palette(this.palette_hl_canvas, this.palette_sat_canvas, [1, 0.5, 0.5])
        this.editor = new Editor(this);
        this.settings = {
            fore_color: 'rgba(0,0,0,255)',
            back_color: 'rgba(255,255,255,255)',
            line_width: 10,
            filled: true,
        }
        this.state = {
            view_port: {
                x: 0,
                y: 0,
                w: this.document_canvas.clientWidth,
                h: this.document_canvas.clientHeight
            },
            overlay_position: {
                x:100,
                y:100,
                w:200,
                h: 200
            }
        }
        this.document_context.imageSmoothingEnabled = false;
        this.document_context.globalCompositeOperation = 'source-over';
        // this.staging_context.imageSmoothingEnabled = false;
        // this.staging_context.globalCompositeOperation = 'source-over';
        // this.tool_context.globalCompositeOperation = 'source-over';
        // this.tool_context.imageSmoothingEnabled = false;
        this.color_stack = new ColorStack(this, 8, 100, 10000,
            document.getElementById('color-selector-div-fore')!,
            document.getElementById('color-selector-div-back')!,
            document.getElementsByClassName('color_stack_item')
        )
        //this.google_drive = new GoogleDrive(document.location.hash)
        this.init_canvases()
        this.init_camera();
        this.init_render_loop()
    }
    init_canvases() {
        const w = this.document_canvas.width;
        const h = this.document_canvas.height;
        this.document_context.fillStyle = 'blue'
        this.document_context.fillRect(0,0,w,h);
        this.document_context.beginPath();
        this.document_context.moveTo(0,0);
        this.document_context.lineTo(100,100);
        this.document_context.strokeStyle = 'black'
        this.document_context.moveTo(200,0);
        this.document_context.lineTo(0,200);
        this.document_context.stroke();


    }
    init_camera():Camera {
        // const aspect = this.view_canvas.clientWidth / this.view_canvas.clientHeight;
        // const w = this.view_canvas.width;
        // const h = this.view_canvas.height;
        // const camera = new OrthographicCamera(
        //     -w, // left
        //     w,  // right
        //     -h,           // top
        //     h,          // bottom
        //     0,                  // near
        //     10                    // far
        // );
        // camera.position.z = 1;
        // return camera
        const aspect = 1;
        const w = this.view_canvas.width;
        const h = this.view_canvas.height;
        const camera = new OrthographicCamera(
          0, // left
          w,  // right
          h,           // top
          0,          // bottom
          0,                  // near
          10                    // far
        );        
        camera.position.z = 1;

        return camera;
    }
    build_scene(): Scene {
        // Scene and orthographic camera
        const scene = new Scene();
        const document_texture = new CanvasTexture(
            this.document_canvas);
        document_texture.needsUpdate = true;
        document_texture.flipY = true;
        const document_material = new ShaderMaterial({
            uniforms: {
                uTexture: { value: document_texture },
            },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
        });
        const document_geometry = new PlaneGeometry(
            this.document_canvas.width,
            this.document_canvas.height
        );
        const document_rectangle = new Mesh(document_geometry,
            document_material);
        
        document_rectangle.position.set(
            this.document_canvas.width/2,
            this.document_canvas.height/2,
            0
        );
        this.editor.tool.tmp_canvas.getContext('2d')
        const overlay_texture = new Texture(this.editor.tool.tmp_canvas);

        const overlay_material = new ShaderMaterial({
            uniforms: {
                uTexture: { value: overlay_texture },
            },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
        });

        // document_rectangle.position.set(this.document_canvas.width/2,
        // this.document_canvas.height/2,0);

        const overlay_geometry = new PlaneGeometry(
            this.state.overlay_position.w,
            this.state.overlay_position.h);
        const overlay_rectangle = new Mesh(overlay_geometry,
            overlay_material);
        overlay_rectangle.position.set(
            this.state.overlay_position.x+ this.state.overlay_position.w/2,
            this.view_canvas.height-(this.state.overlay_position.y+ this.state.overlay_position.h/2),
            1)
        
        scene.add(document_rectangle);
        scene.add(overlay_rectangle);

        return scene


    }
    init_render_loop() {
        const renderer = new WebGLRenderer({ 
            antialias: true,
            canvas: this.view_canvas});
        const animate = () => {
            this.overlay_texture.needsUpdate = true;
            //this.document_texture.needsUpdate = true;
            const scene = this.build_scene()
    
            renderer.render(scene, this.init_camera());
            requestAnimationFrame(animate)
            //setTimeout(animate,100);
        }
        animate()
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
    load_image(url: string) {
        const img = new Image();

        img.addEventListener('load', () => {
            // Clear canvas and draw the image
            this.document_canvas.width = img.naturalWidth;
            this.document_canvas.height = img.naturalHeight;
            // a = w / h
            const view_canvas_aspect = this.view_canvas.clientWidth / this.view_canvas.clientHeight;
            const view_port_w = Math.min(img.naturalWidth, img.naturalHeight * view_canvas_aspect) / 2
            this.state.view_port = {
                'x': 0, 'y': 0, 'w': view_port_w,
                'h': view_port_w / view_canvas_aspect
            };
            
            this.document_context.drawImage(img, 0, 0, this.document_canvas.width, this.document_canvas.height);
            this.editor.art_to_view()
            this.editor.art_to_staging()
        });
        img.src = url;
    }
    init_load_save() {
        click_for_a_second('save_button', () => {
            // Generate a PNG from the canvas
            this.document_canvas.toBlob((blob) => {
                if (!blob) {
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
        file_input.addEventListener('change', (event: Event) => {
            const input = event.target as HTMLInputElement;

            if (input
                && input.files
                && input.files.length > 0
                && input.files[0]
                && input.files[0].type === 'image/png') {
                const file = input.files[0];
                const reader = new FileReader();

                reader.onload = (e) => {
                    if (e.target) {
                        this.load_image(e.target.result as string)
                    }
                };
                reader.readAsDataURL(file);
            } else {
                alert("Please select a valid PNG file.");
            }
            file_input.value = '';
        });
        document.getElementById('load_button')!.addEventListener('click', () => {
            file_input.click()
        });
        // document.getElementById('gdrive_button')!.addEventListener('click', () => {
        //     this.google_drive.open_picker(this.load_image.bind(this));//(s:string) => {console.log(s)});
        // });
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
        this.init_load_save()
    }
    forward_events_to_editor() {
        // canvas
        const fore = document.getElementById('fore')!!!;
        const canvas_area = document.getElementById('view-canvas')!!;
        ["pointerdown", "pointerup", "pointerout", "pointerleave", "pointermove", "click", "keydown"].forEach((ename) => {
            canvas_area.addEventListener(ename, (ev) => {
                ev.preventDefault()
                if (this.editor[ename as keyof Editor]) {
                    (this.editor[ename as keyof Editor] as Function)(ev);
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
        let img = new Image();
        img.src = "/palette.png";
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
            const tmp_back = this.settings.back_color;
            this.settings.back_color = this.settings.fore_color;
            this.settings.fore_color = tmp_back;
            document.getElementById('color-selector-div-fore')!.style.backgroundColor = this.settings.fore_color
            document.getElementById('color-selector-div-back')!.style.backgroundColor = this.settings.back_color
        })
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
                const art_x_before_zoom = this.state.view_port.x + event.offsetX /
                    this.view_canvas.clientWidth * this.state.view_port.w;
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

                const aspect = this.state.view_port.w / this.state.view_port.h;
                const ratio_h = Math.exp(deltaY / 1000);
                const delta_h = this.state.view_port.h * (ratio_h - 1)
                this.state.view_port.y = this.state.view_port.y - event.offsetY * delta_h / this.view_canvas.clientHeight;
                this.state.view_port.x = this.state.view_port.x - event.offsetX * delta_h * aspect / this.view_canvas.clientWidth;
                this.state.view_port.h = Math.max(1, this.state.view_port.h * ratio_h)
                this.state.view_port.w = this.state.view_port.h * aspect;
            } else {
                this.state.view_port.y = Math.max(0, this.state.view_port.y + deltaY / this.view_canvas.clientHeight * 100)
                this.state.view_port.x = Math.max(0, this.state.view_port.x + deltaX / this.view_canvas.clientWidth * 100)
            }
            this.editor.art_to_view();

            this.editor.art_to_staging()



        });
    }
    init() {
        // clear
        // this.staging_context.fillStyle = "rgba(255,255,255,0)"
        // this.staging_context.fillRect(0, 0, this.staging_canvas.width, this.staging_canvas.height)
        // forward pointer
        // bind pointer

        this.init_color_selector();
        this.init_buttons();
        this.forward_events_to_editor();
        this.select_tool('rect');
        //this.init_view_canvas_size();
        this.init_scroll();
    }
}
export function app_ignite() {
    (window as any).app = new MainApp();
    (window as any).app.init();
}

window.addEventListener('load', app_ignite);

