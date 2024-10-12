"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const undo_redo_buffer_js_1 = require("./undo_redo_buffer.js");
function main() {
    const buf = new undo_redo_buffer_js_1.UndoRedoBuffer(10);
    for (var n = 0; n < 10; ++n) {
        buf.push(n * 10);
    }
    for (var n = 0; n < 20; ++n) {
    }
}
main();
