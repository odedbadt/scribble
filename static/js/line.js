export class LineTool {
    constructor(context) {
        this.context = context; 
        this.is_incremental = false;

        }
    action(from, to) {
        this.context.moveTo(
            from[0],from[1]);
        this.context.lineTo(
            to[0],to[1]);
        
        this.context.stroke();
    }

}
