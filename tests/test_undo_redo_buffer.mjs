import {UndoRedoBuffer} from "../static/js/undo_redo_buffer.js"
function assert(val, msg) {
    if (val) {
        return
    }
    throw `Assertion failed ${msg}`
}
function test1() {
    const urb = new UndoRedoBuffer(0,10,1);
    urb.push(1)
    const v = urb.undo()
    assert(v == 0, `first undo failed: ${v} != 1`)
}

function test2() {
    let v = 0
    const urb = new UndoRedoBuffer(v,10,1);
    v = 1
    urb.push(v)
    v = 2
    urb.push(v)

    v = urb.undo()
    assert(v == 1, `second undo failed: ${v} != 1`)
}
test1()
test2()