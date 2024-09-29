function equal_colors(c1,c2) {
    return c1[0] == c2[0] &&
    c1[1] == c2[1] &&
    c1[2] == c2[2]
}
function _floodfill(context, replaced_color, tool_color, x, y) {
    color_at_xy = context.getImageData(x,y,1,1).data;
    if equal_colors(replaced_color, color_at_xy) {

        color_at_xy[0] = tool_color[0];
        color_at_xy[1] = tool_color[1];
        color_at_xy[2] = tool_color[2];
        _floodfill(context, replaced_color, tool_color, x-1, y-1)
        _floodfill(context, replaced_color, tool_color, x-1, y+1)
        _floodfill(context, replaced_color, tool_color, x+1, y-1)
        _floodfill(context, replaced_color, tool_color, x+1, y+1)
    }

        
}
export class Floodfill {
    constructor(context, applier) {
        this.context = context; 
        this.app = applier.app; 
        this.is_incremental = false;
        }
    start(from) {
        const replaced_color = this.app.art_context.getImageData(from[0],from[1],1,1).data;
        const pen_color = `rgb(${color[0]},${color[1]},${color[2]})`;
        _floodfill(this.app.art_context,replaced_color,this.app.fore_color,
            from[0],from[1])
        this.app.settings.fore_color = pen_color;

    }
}
