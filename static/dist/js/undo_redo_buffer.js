"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndoRedoBuffer = void 0;
/*
COMPLETELY EMPTY STACK WITH LINE DRWN:


-1|
 ^

next_index: INDEX: -1
ON SCREEN: A
UNDO: NULL
REDO: NULL

ONLY BLANK CANVAS:

SECOND LINE DRAWN:

A
^

next_index: INDEX 0
ON SCREEN: B
UNDO: -1
REDO: NONE
UNDO = next_index - 2

BLANK CANVAS + FIRST LINE + SECOND LINE:

0123
XAB
 US^

next_index: INDEX 3
ON SCREEN: B (INDEX 2)
UNDO: INDEX 1
REDO: NONE
UNDO = next_index - 2

BLANK CANVAS + FIRST LINE + SECOND LINE + UNDO:

0123
XAB
US^

next_index: INDEX 2
ON SCREEN: A (INDEX 1)
UNDO: INDEX 0
REDO: INDEX 2
UNDO = next_index - 2
REDO = next_index

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
class UndoRedoBuffer {
    constructor(size, log_level) {
        this.stack = new Array(size);
        this.next_index = 0;
        this.high_water_mark = 0; // abuse of notation, h.w.m. of "next" actually
        this._log_level = log_level;
        this.log(`INIT ${this.next_index}, ${this.high_water_mark}`);
        //, ${v.data[0]}, ${v.data[1]}, ${v.data[2]}`)
    }
    dump_to_canvas() {
        if (!this._log_level) {
            return;
        }
        const canvas = document.getElementById('dbg-canvas');
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgb(128,128,128)';
        context.fillRect(0, 0, 800, 80);
        for (let j = 0; j < this.high_water_mark; ++j) {
            const v = this.stack[j];
            if (v && v.data) {
                context.putImageData(v, j * 82, 0);
            }
            else if (v) {
                context.fillStyle = 'rgb(255,128,128)';
                context.fillRect(j * 82, 0, 80, 80);
            }
            else {
                context.fillStyle = 'rgb(128,255,128)';
                context.fillRect(j * 82, 0, 80, 80);
            }
        }
        context.fillStyle = 'rgb(255,0,0)';
        context.fillRect(this.next_index * 82 + 20, 60, 5, 10);
        context.fillStyle = 'rgb(0,0,255)';
        context.fillRect(this.high_water_mark * 82 + 20, 70, 5, 10);
    }
    log(msg) {
        if (this._log_level) {
            console.log(msg);
            try {
                document.getElementById('dbg').style.visibility = 50;
                document.getElementById('dbg').style.visibility = 'visible';
                document.getElementById('dbg').innerHTML = msg;
            }
            catch (_a) {
            }
        }
    }
    undo() {
        if (this.next_index <= 1) {
            this.log(`UNDO RET ${this.next_index}, ${this.high_water_mark}`);
            if (this.next_index == 1) {
                this.next_index--;
            }
            this.dump_to_canvas();
            return null;
        }
        const v = this.stack[this.next_index - 2] || null;
        this.next_index--;
        this.log(`UNDO ${this.next_index}, ${this.high_water_mark} `);
        this.dump_to_canvas();
        return v;
    }
    redo() {
        if (this.next_index >= this.high_water_mark) {
            this.dump_to_canvas();
            return;
        }
        const v = this.stack[this.next_index] || null;
        this.next_index++;
        this.dump_to_canvas();
        this.log(`REDO ${this.next_index}, ${this.high_water_mark}, `);
        return v;
    }
    push(v) {
        this.stack[this.next_index] = v;
        this.next_index++;
        if (this.next_index > this.high_water_mark) {
            this.high_water_mark = this.next_index;
        }
        if (this.high_water_mark > this.stack.length) {
            this.stack.length = this.stack.length * 2;
        }
        this.dump_to_canvas();
        this.log(`PUSH ${this.next_index}, ${this.high_water_mark}, `);
    }
}
exports.UndoRedoBuffer = UndoRedoBuffer;
