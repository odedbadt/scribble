export class CircleTool {
    constructor(context) {
            this.context = context;
            this.is_incremental = false;
        }
    action(from, to) {
        const r = Math.sqrt((to[0] - from[0])*(to[0] - from[0])+
        (to[1] - from[1])*(to[1] - from[1]))
        this.context.ellipse(
                from[0],from[1],r,r,0,0,Math.PI*2);
        this.context.fill();
        return true

    }
}
