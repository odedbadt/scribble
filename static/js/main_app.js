import { ScribbleTool } from './scribble.js'
import { LineTool } from './line.js'
import { RectTool } from './rect.js'
import { CircleTool } from './circle.js'
import { EditingToolApplier } from './editing_tool_applier.js'

// function norm2(v) {
//     return v[0]*v[0]+v[1]*v[1]
// }
// function vec_minus(v1,v2) {
//     return [v2[0] - v1[0], v2[1] - v1[1]]
// }
// function dist2(v1,v2) {
//     return norm2(vec_minus(v2,v1));
// }
const tool_js_classes = {
    scribble: ScribbleTool,
    rect: RectTool,
    line: LineTool,
    circle: CircleTool,
}
class MainApp {
    constructor() {
        this.art_canvas = document.getElementById('art-canvas');
        this.art_context = this.art_canvas.getContext('2d', {willReadFrequently:true});
        this.view_canvas = document.getElementById('view-canvas');
        this.view_context = this.view_canvas.getContext('2d', {willReadFrequently:true});
        this.view_context.fillStyle='black';
        this.view_context.lineWidth=20;
        this.view_context.lineCap="round";      
        this.settings = {
            fore_color: 'black',
            line_width: 10
        }
        this.staging_canvas = document.getElementById('staging-canvas');
        this.staging_context = this.staging_canvas.getContext('2d',{willReadFrequently:true});
        this.tool_canvas = document.getElementById('tool-canvas');
        this.tool_context = this.tool_canvas.getContext('2d',{willReadFrequently:true});


    }
    init_buttons() {
        const button_list = document.getElementsByClassName('button');
        const _this = this;
        Array.from(button_list).forEach(button => {
            const button_class_list = button.classList;
            const tool_js_class = tool_js_classes[button_class_list[0]];
            const editor = tool_js_class ? new EditingToolApplier(_this, tool_js_class) : null;
            if (editor) {
                button.addEventListener('click', event => {
                    Array.from(button_list).forEach(other_button => {
                        other_button.classList.remove('pressed')
                    });    

                    button.classList.add('pressed')
                    this.active_tool = editor;
                    if (editor) {
                        editor.select_tool();
                    }
                })
            }
        })
    }
    init_color_selector() {
        const palette_canvas = document.getElementById('color_selector')
        this.color_selector_element = palette_canvas;
        this.color_selector_context = palette_canvas.getContext('2d',{willReadFrequently:true});
        var img = new Image();
        img.src = "/static/palette.png"; // Replace with the path to your image
        img.onload = () => {
            this.color_selector_context.drawImage(img, 0, 0, 
                25, 100, 0, 0, 100,200);
                //palette_canvas.width, palette_canvas.height);
        }
        const _this = this

        palette_canvas.onclick = (event) => {
            const color = this.color_selector_context.getImageData(event.offsetX, event.offsetY, 1, 1).data;
            const pen_color = `rgb(${color[0]},${color[1]},${color[2]})`;
            _this.settings.fore_color = pen_color;
            _this.view_context.strokeStyle=pen_color;

        }        
    }
    init() {
        // clear
        this.view_context.clearRect(0,0,this.view_canvas.width,this.view_canvas.height);
        this.staging_context.clearRect(0,0,this.staging_canvas.width,this.staging_canvas.height)
        this.tool_context.clearRect(0,0,200,200)


        //forward mouse
        const fore = document.getElementById('fore');
        const canvas_area = document.getElementById('canvas-area');

        ["mousedown", "mouseup","mouseout","mousemove"].forEach((ename) =>
        {
            canvas_area.addEventListener(ename, (ev) => {
                if (this.active_tool && this.active_tool[ename]) {
                    this.active_tool[ename](ev);
                }
            })
        } 
        )

        // bind mouse
        const _this = this;

        this.init_color_selector();
        this.init_buttons();

    }
}
export function app_ignite() {
    console.log('here');
    window.app = new MainApp();
    window.app.init()
}
window.addEventListener('load', () => {app_ignite()});