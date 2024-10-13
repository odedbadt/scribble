import { UndoRedoBuffer } from "./undo_redo_buffer.js"
function main() {
    const buf = new UndoRedoBuffer(10);
    for (var n=0; n<10; ++n) {
        buf.push(n*10);
    }
    for (var n=0; n<20; ++n) {
    }
}
main()
