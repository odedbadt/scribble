
export class RectTool {
    constructor(context) {
            this.context = context;
            this.is_incremental = false;


        }

    action(from, to) {
        this.context.rect(
                from[0],from[1],to[0] - from[0], to[1] - from[1]);
        this.context.fill();
    }

}

