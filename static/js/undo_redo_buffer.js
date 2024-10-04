/*
COMPLETELY EMPTY:

0
^

ONLY BLANK CANVAS:

01
X
 ^

BLANK CANVAS + FIRST LINE:

012
XA
US^

CURSOR: INDEX 2
ON SCREEN: A (INDEX 1)
UNDO: INDEX 0
REDO: NONE
UNDO = CURSOR - 2

BLANK CANVAS + FIRST LINE + SECOND LINE:

0123
XAB
 US^

CURSOR: INDEX 3
ON SCREEN: B (INDEX 2)
UNDO: INDEX 1
REDO: NONE
UNDO = CURSOR - 2

BLANK CANVAS + FIRST LINE + SECOND LINE + UNDO:

0123
XAB
US^

CURSOR: INDEX 2
ON SCREEN: A (INDEX 2)
UNDO: INDEX 0
REDO: INDEX 2
UNDO = CURSOR - 2
REDO = CURSOR

01
XA
^R

XAB
 ^|

...
...
XABCDEF
    U^|

ABCDEF
  USR
    

*/
export class UndoRedoBuffer {
    constructor(size) {
        this.stack = new Array(size);
        this.hwm = 0;
        this.cursor = 0;        
    }
    undo() {
        if (this.cursor <= 1) {
            return
        }
        const v = this.stack[this.cursor-2] || null;
        this.cursor--;
        
        return v;
    }
    redo() {
        if (this.cursor >= this.hwm) {
            return
        }
        const v = this.stack[this.cursor] || null;
        this.cursor++;
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
        
    }
}