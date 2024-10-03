import { EditingToolApplier } from './editing_tool_applier.js'

class MainApp {
    constructor() {
        this.art_canvas = document.getElementById('art-canvas');
        this.art_context = this.art_canvas.getContext('2d', {willReadFrequently:true});
        this.view_canvas = document.getElementById('view-canvas');
        this.view_context = this.view_canvas.getContext('2d', {willReadFrequently:true});
        this.settings = {
            fore_color: 'rgba(0,0,0,255)',
            line_width: 10
        }
        this.staging_canvas = document.getElementById('staging-canvas');
        this.staging_context = this.staging_canvas.getContext('2d',{willReadFrequently:true});
        this.tool_canvas = document.getElementById('tool-canvas');
        this.tool_context = this.tool_canvas.getContext('2d',{willReadFrequently:true});
        this.editor = new EditingToolApplier(this);


    }
    select_tool(tool_name) {
        const _this = this;
        const button = document.getElementsByClassName(tool_name)[0];
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(other_button => {
            other_button.classList.remove('pressed')
        });
        button.classList.add('pressed')
        _this.editor.select_tool(tool_name)

    }
    init_undo_redo_buttons() {
        function click_for_a_second(classname, callback) {
            const elem = document.getElementsByClassName(classname)[0]
            elem.addEventListener('click', () =>{
                elem.classList.add('pressed')
                callback()
                window.setTimeout(() => {
                elem.classList.remove('pressed')
                },120)
            })
        }
        const _this = this;
        click_for_a_second('undo',() => {
        
                _this.editor.undo()
            
            }
        )
        click_for_a_second('redo',() => {
        
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
    }
    forward_events_to_editor() {
        // canvas
        const fore = document.getElementById('fore');
        const canvas_area = document.getElementById('canvas-area');
        ["mousedown", "mouseup","mouseout","mousemove", "click", "keydown"].forEach((ename) =>
        {
            canvas_area.addEventListener(ename, (ev) => {
                if (this.editor[ename]) {
                    this.editor[ename](ev);
                }
            })
        } 
        )
        // body
        document.body.addEventListener("keydown", (ev) => 
            this.editor.keydown(ev))

    }
    init_color_selector() {
        const palette_canvas = document.getElementById('color-selector-canvas')
        this.color_selector_element = palette_canvas;
        this.color_selector_context = palette_canvas.getContext('2d',{willReadFrequently:true});
        var img = new Image();
        img.src = "/static/palette.png";
        img.onload = () => {
            this.color_selector_context.drawImage(img, 0, 0, 80, 180);
        }
        const _this = this

        palette_canvas.onclick = (event) => {
            const color = this.color_selector_context.getImageData(event.offsetX, event.offsetY, 1, 1).data;
            const pen_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
            document.getElementById('color-selector-div').style.backgroundColor = pen_color
            
            _this.settings.fore_color = pen_color;
            _this.view_context.strokeStyle=pen_color;

        }        
    }
    clear_context(context) {
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



        //forward mouse


        // bind mouse
        const _this = this;

        this.init_color_selector();
        this.init_buttons();
        this.forward_events_to_editor();

        this.select_tool('scribble')

    }
}
export function app_ignite() {
    window.app = new MainApp();
    window.app.init();
    
}
window.addEventListener('load', () => {app_ignite()});