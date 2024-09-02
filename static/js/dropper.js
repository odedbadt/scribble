export class Dropper {
    constructor(context, applier) {
        this.context = context; 
        this.app = applier.app; 
        this.is_incremental = false;
        }
    start(from) {
        const color = this.app.art_context.getImageData(from[0],from[1],1,1).data;
        const pen_color = `rgb(${color[0]},${color[1]},${color[2]})`;        
        this.app.settings.fore_color = pen_color;

    }

}