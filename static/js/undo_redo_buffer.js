export class UndoRedoBuffer {
    constructor(size) {
        this.stack = new Array(size);
        this.hwm = 0;
        this.cursor = 0;
        
    }
    pop() {
        if (this.cursor <= 0) {
            console.log('N')
            return null;
        }
        this.cursor--
        console.log('S')
        return this.stack[this.cursor];
    }
    undo() {
        return this.pop();
    }
    redo() {
        if (this.cursor >this.hwm) {
            console.log('N')
            return null;
        }
        const v = this.stack[this.cursor]
        this.cursor++
        return v;

    }
    push(v) {
        this.stack[this.cursor] = v;
        this.cursor++;
        if (this.cursor > this.hwm) {
            this.hwm = this.cursor;
        }
        if (this.hwm > this.stack.length) {
            this.stack.length = this.stack.length*2;
        }
        console.log(this.stack, this.cursor)
    }
}