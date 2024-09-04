export class UndoRedoBuffer {
    constructor(size) {
        this.stack = new Array(size);
        this.hwm = 0;
        this.cursor = 0;
        
    }
    pop() {
        if (this.cursor <= 0) {
            return null;
        }
        this.cursor--
        return this.stack[this.cursor];
    }
    push(v) {
        this.stack[this.cursor++] = v;
        if (this.cursor > this.hwm) {
            this.hwm = this.cursor;
        }
        if (this.hwm > this.stack.length) {
            this.stack.length = this.stack.length*2;
        }
        console.log(this.stack, this.cursor)
    }
    // undo() {
    //     return this.pop();
    //     // if (this.cursor == this.start) {
    //     //     return null;
    //     // }
    //     // const v = this.buffer[(this.cursor - 1) % this.size];
    //     // this.cursor = (this.cursor - 1 + this.size) % this.size;


    //     // return v;

    // }
    // // redo() {
    //     if (this.cursor == this.end) {
    //         return null;
    //     }
    //     const v = this.buffer[(this.cursor - 1) % this.size];
    //     this.cursor = (this.cursor + 1) % this.size;


    //     return v;
        
    // }
    // has_redo() {

    // }
}