export class EditingTool {
    constructor(editor) {
        this.h = 200;
        this.w = 200;
        this.x = 0;
        this.y = 0;
        this.safety = 0;
        this.editor = editor;
        this.app = editor.app;
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d', { willReadFrequently: true });
        this.staging_canvas = document.createElement("canvas");
        this.staging_context = this.staging_canvas.getContext('2d', { willReadFrequently: true });
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext('2d');
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.staging_canvas = document.createElement("canvas");
        this.staging_context = this.staging_canvas.getContext('2d');
        this.staging_canvas.width = this.w;
        this.staging_canvas.height = this.h;
        this.bounds = { x: 0, y: 0, w: 100, h: 100 };
    }
    extend_canvas(bounds) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.canvas.getContext('2d');
        const src_image_data = ctx.getImageData(0, 0, w, h);
        this.canvas.width = bounds.w;
        this.canvas.height = bounds.h;
        ctx.putImageData(src_image_data, -bounds.x, -bounds.y);
        this.editor.app.state.overlay_position = Object.assign({}, bounds);
        this.bounds = Object.assign({}, bounds);
    }
    select() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
export class NopTool extends EditingTool {
    constructor(editor) {
        super(editor);
    }
    select() {
        super.select();
    }
    start(at, buttons) {
        return false;
    }
    action(at) {
        return false;
    }
    stop(at) {
        return false;
    }
    hover(at) {
        return false;
    }
}
//# sourceMappingURL=editing_tool.js.map